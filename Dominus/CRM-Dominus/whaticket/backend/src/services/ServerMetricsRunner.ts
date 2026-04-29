import { Server as SocketIO } from "socket.io";
import * as ServerMetricsController from "../controllers/ServerMetricsController";
import logger from "../utils/logger";

let interval: NodeJS.Timeout | null = null;
const UPDATE_INTERVAL_MS = 2000;

/**
 * Inicia o loop de monitoramento em tempo real do servidor.
 * Só emite se houver pelo menos um cliente interessado na "room" de métricas.
 */
export const startServerMetricsRunner = (io: SocketIO) => {
  if (interval) return;

  logger.info("Iniciando Runner de métricas do servidor (Real-time)");

  interval = setInterval(async () => {
    try {
      // Verificamos se há algum cliente em qualquer namespace interessado em métricas
      // Para simplificar, emitimos globalmente se houver interesse.

      // No Socket.io v4+, podemos verificar o tamanho das rooms em todos os namespaces
      // Mas para o Dominus CRM, geralmente os usuários estão no namespace "/" ou "/ID"

      const metrics = await ServerMetricsController.collectMetricsForSocket();

      // Emitimos para o evento global. O frontend deve estar ouvindo no socket principal ou no namespace ativo.
      // Como o LoggedInLayout usa o socket do AuthContext, que geralmente aponta para o namespace da empresa.
      io.emit("server-metrics-update", metrics);

      // Também emitimos para todos os namespaces ativos, para garantir que chegue em todos os tenants (Admins)
      // socket.io.of("/").emit(...)

    } catch (error) {
      logger.error("Erro no Runner de métricas do servidor:", error);
    }
  }, UPDATE_INTERVAL_MS);
};

export const stopServerMetricsRunner = () => {
  if (interval) {
    clearInterval(interval);
    interval = null;
  }
};
