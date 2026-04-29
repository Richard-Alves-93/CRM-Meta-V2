import type { proto, WAMessage } from "baileys";
import * as Sentry from "@sentry/node";
import AppError from "../../errors/AppError";
import GetTicketWbot from "../../helpers/GetTicketWbot";
import { supabase } from "../../libs/supabaseClient";
import formatBody from "../../helpers/Mustache";
import { dynamicImport } from "../../utils/dynamicImport";

let baileysMod: typeof import("baileys") | null = null;
async function getBaileys() {
  if (!baileysMod) baileysMod = await dynamicImport("baileys");
  return baileysMod;
}

interface Request {
  body?: string;
  ticket: any;
  quotedMsg?: any;
  msdelay?: number;
  isForwarded?: boolean;
  vCard?: any;           // Restaurado — removido na refatoração mas usado pelo MessageController
  location?: {           // Restaurado — usado pelo MessageController
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  } | null;
}

const SendWhatsAppMessage = async ({
  body,
  ticket,
  quotedMsg,
  msdelay,
  isForwarded = false,
  vCard,
  location,
}: Request): Promise<WAMessage | proto.WebMessageInfo> => {
  let options: any = {};
  const wbot = await GetTicketWbot(ticket);
  const { delay } = await getBaileys();

  // 1. Obter número do contato do Supabase
  // Colunas reais: id, company_id, name, number, email, profile_pic_url, is_group, channel, created_at, updated_at, legacy_id
  const { data: contact } = await supabase
    .from("contacts")
    .select("number")     // P5 FIX: remote_jid não existe na tabela Supabase
    .eq("id", ticket.contactId)
    .single();

  if (!contact) throw new AppError("ERR_CONTACT_NOT_FOUND");

  const number = `${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`;

  // 2. Quoted Message
  if (quotedMsg) {
    const { data: chatMessage } = await supabase
      .from("messages")
      .select("data_json")
      .eq("message_id", quotedMsg.wid || quotedMsg.message_id)
      .maybeSingle();

    if (chatMessage?.data_json) {
      const msgFound = typeof chatMessage.data_json === "string"
        ? JSON.parse(chatMessage.data_json)
        : chatMessage.data_json;

      if (msgFound?.key && msgFound?.message) {
        options = { quoted: { key: msgFound.key, message: msgFound.message } };
      }
    }
  }

  // 3. vCard
  if (vCard) {
    const { isNil } = await import("lodash");
    if (!isNil(vCard)) {
      const numberContact = vCard.number;
      const firstName = vCard.name.split(" ")[0];
      const lastName = String(vCard.name).replace(firstName, "");
      const vcardStr =
        `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${vCard.name}\n` +
        `TEL;type=CELL;waid=${numberContact}:+${numberContact}\nEND:VCARD`;
      try {
        const sent = await wbot.sendMessage(number, {
          contacts: { displayName: vCard.name, contacts: [{ vcard: vcardStr }] }
        }, options);
        await supabase.from("tickets").update({
          last_message: vcardStr.substring(0, 100),
          updated_at: new Date().toISOString()
        }).eq("id", ticket.id);
        return sent as WAMessage;
      } catch (err) {
        Sentry.captureException(err);
        throw new AppError("ERR_SENDING_WAPP_MSG");
      }
    }
  }

  // 4. Location
  if (location) {
    try {
      const mapLink = `https://maps.google.com/maps?q=${location.latitude}%2C${location.longitude}&z=17`;
      const locLabel = location.name || location.address || "Localização";
      const sent = await wbot.sendMessage(number, {
        location: {
          degreesLatitude: location.latitude,
          degreesLongitude: location.longitude,
          name: location.name || undefined,
          address: location.address || undefined,
        }
      }, options);
      await supabase.from("tickets").update({
        last_message: `${locLabel}: ${mapLink}`,
        updated_at: new Date().toISOString()
      }).eq("id", ticket.id);
      return sent as WAMessage;
    } catch (err) {
      Sentry.captureException(err);
      throw new AppError("ERR_SENDING_WAPP_MSG");
    }
  }

  // 5. Texto simples (fluxo principal)
  if (body) {
    try {
      if (msdelay) await delay(msdelay);
      const sentMessage = await wbot.sendMessage(
        number,
        {
          text: formatBody(body, ticket),
          contextInfo: {
            forwardingScore: isForwarded ? 2 : 0,
            isForwarded: !!isForwarded,
          },
        },
        options
      );
      await supabase.from("tickets").update({
        last_message: formatBody(body, ticket),
        updated_at: new Date().toISOString()
      }).eq("id", ticket.id);
      return sentMessage as WAMessage;
    } catch (err) {
      Sentry.captureException(err);
      console.error("❌ Erro ao enviar mensagem WhatsApp:", err);
      throw new AppError("ERR_SENDING_WAPP_MSG");
    }
  }

  throw new AppError("ERR_NO_MESSAGE_CONTENT_PROVIDED");
};

export default SendWhatsAppMessage;
