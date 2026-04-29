import 'dotenv/config';
import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import logger from "./utils/logger";
import { supabase } from "./libs/supabaseClient";
import BullQueue from './libs/queue';
import { startQueueProcess } from "./queues";
import { StartWhatsAppSession } from "./services/WbotServices/StartWhatsAppSession";

const PORT = Number(process.env.PORT) || 8080;
const HOST = process.env.HOST || "0.0.0.0";

const server = app.listen(PORT, HOST, async () => {
  try {
    // 1. Busca no banco todas as conexões que deveriam estar ativas
    const { data: whatsapps, error } = await supabase
      .from("whatsapps")
      .select("*")
      .eq("status", "CONNECTED");

    if (error) {
      logger.error("Erro ao buscar sessões conectadas no Supabase", error);
    }

    logger.info(
      `✅ Servidor iniciado. Tentando reconectar ${whatsapps?.length || 0} sessões.`
    );

    // 2. Tenta iniciar cada uma delas
    if (whatsapps && whatsapps.length > 0) {
      for (const wpp of whatsapps) {
        // Adiciona um pequeno atraso para não sobrecarregar a API do WhatsApp
        await new Promise(r => setTimeout(r, 1000));
        logger.info(`Tentando reconectar: ${wpp.name}`);
        StartWhatsAppSession(wpp, wpp.company_id);
      }
    }

    // 3. Inicia as filas (como já fazia)
    await startQueueProcess();
  } catch (err) {
    logger.error("Erro no startup do servidor", err);
  }

  if (process.env.REDIS_URI_ACK && process.env.REDIS_URI_ACK !== "") {
    BullQueue.process();
  }

  logger.info(`Server started on ${HOST}:${PORT}`);
});

process.on("uncaughtException", err => {
  console.error(`${new Date().toUTCString()} uncaughtException:`, err.message);
  console.error(err.stack);
});

process.on("unhandledRejection", (reason, p) => {
  console.error(`${new Date().toUTCString()} unhandledRejection:`, reason, p);
});

initIO(server);
gracefulShutdown(server);