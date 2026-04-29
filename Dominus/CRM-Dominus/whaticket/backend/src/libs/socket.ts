import { Server as SocketIO, Server } from "socket.io";
import { Server as HttpServer } from "http";
import { instrument } from "@socket.io/admin-ui";
import { z } from "zod";
import logger from "../utils/logger";
import jwt from "jsonwebtoken";
import authConfig from "../config/auth";
import { startServerMetricsRunner } from "../services/ServerMetricsRunner";

// Define namespaces permitidos
// Mantém compatibilidade com IDs numéricos e UUIDs do Supabase
const ALLOWED_NAMESPACES = /^\/(workspace-[a-zA-Z0-9-]+|[a-zA-Z0-9-]+)$/;

// Esquemas de validação
const userIdSchema = z.union([z.string(), z.number()]).optional();
const ticketIdSchema = z.union([z.string(), z.number()]).transform(String);
const statusSchema = z.enum(["open", "closed", "pending"]);
const jwtPayloadSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  userId: z.union([z.string(), z.number()]).optional(),
  companyId: z.union([z.string(), z.number()]).optional(),
  profile: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
}).passthrough();

// Origens CORS permitidas
const ALLOWED_ORIGINS = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"];

// Ajuste da classe AppError para compatibilidade com Error
class SocketCompatibleAppError extends Error {
  constructor(public message: string, public statusCode: number) {
    super(message);
    this.name = "AppError";
    // Garante que a stack trace seja capturada
    Error.captureStackTrace?.(this, SocketCompatibleAppError);
  }
}

let io: SocketIO;

export const initIO = (httpServer: HttpServer): SocketIO => {
  io = new SocketIO(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn(`Origem não autorizada: ${origin}`);
          callback(new SocketCompatibleAppError("Violação da política CORS", 403));
        }
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    maxHttpBufferSize: 1e6, // Limita payload a 1MB
    pingTimeout: 20000,
    pingInterval: 25000,
  });

  // Middleware de autenticação JWT
  io.use((socket, next) => {
    const token = socket.handshake.query.token as string;
    if (!token) {
      logger.warn("Tentativa de conexão sem token");
      return next(new SocketCompatibleAppError("Token ausente", 401));
    }

    try {
      const decoded = jwt.verify(token, authConfig.secret);
      const validatedPayload = jwtPayloadSchema.parse(decoded);
      socket.data.user = validatedPayload;
      next();
    } catch (err) {
      logger.warn("Token inválido");
      return next(new SocketCompatibleAppError("Token inválido", 401));
    }
  });

  // Admin UI apenas em desenvolvimento
  const isAdminEnabled = process.env.SOCKET_ADMIN === "true" && process.env.NODE_ENV !== "production";
  if (isAdminEnabled && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    try {
      instrument(io, {
        auth: {
          type: "basic",
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
        },
        mode: "development",
        readonly: true,
      });
      logger.info("Socket.IO Admin UI inicializado em modo de desenvolvimento");
    } catch (error) {
      logger.error("Falha ao inicializar Socket.IO Admin UI", error);
    }
  } else if (isAdminEnabled) {
    logger.warn("Credenciais de administrador ausentes, Admin UI não inicializado");
  }

  // Namespaces dinâmicos com validação
  const workspaces = io.of((name, auth, next) => {
    if (ALLOWED_NAMESPACES.test(name)) {
      next(null, true);
    } else {
      logger.warn(`Tentativa de conexão a namespace inválido: ${name}`);
      next(new SocketCompatibleAppError("Namespace inválido", 403), false);
    }
  });

  workspaces.on("connection", (socket) => {
    const clientIp = socket.handshake.address;

    // Valida userId
    let userId: string | undefined;
    try {
      const parsedUserId = userIdSchema.parse(socket.handshake.query.userId);
      userId = parsedUserId !== undefined ? String(parsedUserId) : undefined;
    } catch (error) {
      socket.disconnect(true);
      logger.warn(`userId inválido de ${clientIp}`);
      return;
    }

    logger.info(`Cliente conectado ao namespace ${socket.nsp.name} (IP: ${clientIp})`);

    socket.on("joinChatBox", (ticketId: string, callback?: (error?: string) => void) => {
      try {
        const validatedTicketId = ticketIdSchema.parse(ticketId);
        socket.join(validatedTicketId);
        logger.info(`Cliente entrou no canal de ticket ${validatedTicketId} no namespace ${socket.nsp.name}`);
        callback?.();
      } catch (error) {
        logger.warn(`ticketId inválido: ${ticketId}`);
        callback?.("ID de ticket inválido");
      }
    });

    socket.on("joinNotification", (callback?: (error?: string) => void) => {
      socket.join("notification");
      logger.info(`Cliente entrou no canal de notificações no namespace ${socket.nsp.name}`);
      callback?.();
    });

    socket.on("joinTickets", (status: string, callback?: (error?: string) => void) => {
      try {
        const validatedStatus = statusSchema.parse(status);
        socket.join(validatedStatus);
        logger.info(`Cliente entrou no canal ${validatedStatus} no namespace ${socket.nsp.name}`);
        callback?.();
      } catch (error) {
        logger.warn(`Status inválido: ${status}`);
        callback?.("Status inválido");
      }
    });

    socket.on("joinTicketsLeave", (status: string, callback?: (error?: string) => void) => {
      try {
        const validatedStatus = statusSchema.parse(status);
        socket.leave(validatedStatus);
        logger.info(`Cliente saiu do canal ${validatedStatus} no namespace ${socket.nsp.name}`);
        callback?.();
      } catch (error) {
        logger.warn(`Status inválido: ${status}`);
        callback?.("Status inválido");
      }
    });

    socket.on("joinChatBoxLeave", (ticketId: string, callback?: (error?: string) => void) => {
      try {
        const validatedTicketId = ticketIdSchema.parse(ticketId);
        socket.leave(validatedTicketId);
        logger.info(`Cliente saiu do canal de ticket ${validatedTicketId} no namespace ${socket.nsp.name}`);
        callback?.();
      } catch (error) {
        logger.warn(`ticketId inválido: ${ticketId}`);
        callback?.("ID de ticket inválido");
      }
    });

    socket.on("disconnect", () => {
      logger.info(`Cliente desconectado do namespace ${socket.nsp.name} (IP: ${clientIp})`);
    });

    socket.on("error", (error) => {
      logger.error(`Erro no socket do namespace ${socket.nsp.name}: ${error.message}`);
    });
  });

  // Inicia o monitoramento em tempo real
  startServerMetricsRunner(io);

  return io;
};

export const getIO = (): SocketIO => {
  if (!io) {
    throw new SocketCompatibleAppError("Socket IO não inicializado", 500);
  }
  return io;
};
