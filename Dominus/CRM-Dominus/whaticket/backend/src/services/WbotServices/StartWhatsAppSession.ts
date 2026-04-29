import { initWASocket } from "../../libs/wbot";
import { supabase } from "../../libs/supabaseClient";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import logger from "../../utils/logger";
import * as Sentry from "@sentry/node";

const sessionStartLocks = new Map<number | string, number>();
const START_LOCK_TTL_MS = 120_000;

export const StartWhatsAppSession = async (
  whatsapp: any,
  companyId: number | string
): Promise<void> => {
  const lockAt = sessionStartLocks.get(whatsapp.id);
  if (lockAt && Date.now() - lockAt < START_LOCK_TTL_MS) {
    logger.warn(
      `Session ${whatsapp.id} start já em andamento; ignorando chamada duplicada`
    );
    return;
  }
  if (lockAt) {
    logger.warn(`Session ${whatsapp.id} lock antigo detectado; liberando lock`);
  }
  sessionStartLocks.set(whatsapp.id, Date.now());

  try {
    await supabase
      .from("whatsapps")
      .update({ status: "OPENING" })
      .eq("id", whatsapp.id);

    const io = getIO();
    io.of(String(companyId)).emit(`company-${companyId}-whatsappSession`, {
      action: "update",
      session: whatsapp
    });

    const wbot = await initWASocket(whatsapp);
    if (wbot) {
      wbotMessageListener(wbot, companyId);
      wbotMonitor(wbot, whatsapp, companyId);
    }
  } catch (err) {
    Sentry.captureException(err);
    logger.error(err);
    try {
      const { data: current, error: fetchError } = await supabase
        .from("whatsapps")
        .select("*")
        .eq("id", whatsapp.id)
        .maybeSingle();

      if (current?.status === "OPENING") {
        await supabase
          .from("whatsapps")
          .update({ status: "DISCONNECTED", qrcode: "" })
          .eq("id", whatsapp.id);

        const io = getIO();
        io.of(String(companyId)).emit(`company-${companyId}-whatsappSession`, {
          action: "update",
          session: { ...current, status: "DISCONNECTED", qrcode: "" }
        });
      }
    } catch (updateErr) {
      logger.error(updateErr);
    }
  } finally {
    sessionStartLocks.delete(whatsapp.id);
  }
};
