// @ts-nocheck
import {
  type BinaryNode,
  type Contact as BContact,
  type WASocket
} from "baileys";
import * as Sentry from "@sentry/node";
import fs from "fs";
import path from "path";
import logger from "../../utils/logger";
import createOrUpdateBaileysService from "../BaileysServices/CreateOrUpdateBaileysService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import { verifyMessage } from "./wbotMessageListener";
import UpsertContactFromBaileysService from "../ContactServices/UpsertContactFromBaileysService";
import { dynamicImport } from "../../utils/dynamicImport";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

let baileysMod: typeof import("baileys") | null = null;
async function getBaileys() {
  if (!baileysMod) baileysMod = await dynamicImport("baileys");
  return baileysMod;
}

let i = 0;

setInterval(() => {
  i = 0;
}, 5000);

type Session = WASocket & {
  id?: number | string;
};

interface IContact {
  contacts: BContact[];
}

const wbotMonitor = async (
  wbot: Session,
  whatsapp: any,
  companyId: number | string
): Promise<void> => {
  try {
    const { isJidBroadcast, isJidStatusBroadcast, isLidUser } = await getBaileys();
    wbot.ws.on("CB:call", async (node: BinaryNode) => {
      const content = node.content[0] as any;

      await new Promise((r) => setTimeout(r, i * 650));
      i++;

      if (content.tag === "terminate" && !node.attrs.from.includes("@call")) {
        const companyUuid = await getCompanyUuid(companyId);

        // 1. Fetch settings
        const { data: settings } = await supabase
          .from("companies_settings")
          .select("accept_call_whatsapp, accept_call_whatsapp_message")
          .eq("company_id", companyId) // SupabaseIdResolver might already return numeric or UUID depending on context, but let's use the provided ID
          .maybeSingle();

        if (settings?.accept_call_whatsapp === "enabled") {
          const acceptCallMessage = settings.accept_call_whatsapp_message || "Chamada recusada.";
          const sentMessage = await wbot.sendMessage(node.attrs.from, {
            text: `\u200e ${acceptCallMessage}`,
          });
          const number = node.attrs.from.split(":")[0].replace(/\D/g, "");

          // 2. Fetch contact
          const { data: contact } = await supabase
            .from("contacts")
            .select("id, is_group, name, number, profile_pic_url")
            .eq("company_id", companyId)
            .eq("number", number)
            .maybeSingle();

          if (!contact) return;

          // 3. Find or Create Ticket
          let { data: ticket } = await supabase
            .from("tickets")
            .select("*")
            .eq("contact_id", contact.id)
            .eq("whatsapp_id", wbot.id)
            .in("status", ["open", "pending", "nps", "lgpd"])
            .eq("company_id", companyId)
            .maybeSingle();

          if (!ticket) {
            const { data: newTicket } = await supabase
              .from("tickets")
              .insert({
                company_id: companyId,
                contact_id: contact.id,
                whatsapp_id: wbot.id,
                is_group: contact.is_group,
                status: "pending",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select("*")
              .single();
            ticket = newTicket;
          }

          if (!ticket) return;

          // Compat layer for legacy verifyMessage function
          const legacyTicket = { ...ticket, id: ticket.id, companyId, contactId: contact.id };
          const legacyContact = { ...contact, id: contact.id, companyId };
          
          await verifyMessage(sentMessage, legacyTicket, legacyContact);

          const date = new Date();
          const hours = date.getHours();
          const minutes = date.getMinutes();

          const body = `Chamada de voz/vídeo perdida às ${hours}:${minutes}`;
          const messageData = {
            wid: content.attrs["call-id"],
            ticketId: ticket.id,
            contactId: contact.id,
            body,
            fromMe: false,
            mediaType: "call_log",
            read: true,
            quotedMsgId: null,
            ack: 1,
          };

          // Update Ticket status and last_message
          const updateData: any = {
            last_message: body,
            updated_at: new Date().toISOString()
          };

          if (ticket.status === "closed") {
            updateData.status = "pending";
          }

          await supabase
            .from("tickets")
            .update(updateData)
            .eq("id", ticket.id);

          return CreateMessageService({ messageData, companyId });
        }
      }
    });

    function cleanStringForJSON(str: string | undefined): string {
      if (!str) return "";
      return str
        .replace(/[\x00-\x1F"\\']/g, "")
        .replace(/[\uD800-\uDFFF]/g, "")
        .replace(/\uFFFD/g, "");
    }

    // Contatos (upsert)
    wbot.ev.on("contacts.upsert", async (contacts: BContact[]) => {
      const filteredContacts: any[] = [];

      try {
        await Promise.all(
          contacts.map(async (contact: any) => {
            if (
              !isJidBroadcast(contact.id) &&
              !isJidStatusBroadcast(contact.id) &&
              (isLidUser(contact.id) ?? false)
            ) {
              const obj: any = { id: contact.id };

              const setIf = (k: string, v?: any) => {
                if (typeof v === "string" && v.length > 0) {
                  obj[k] = cleanStringForJSON(v);
                }
              };

              const fallback = contact.id.split("@")[0].split(":")[0];
              const nameCand =
                contact.name ||
                contact.notify ||
                contact.verifiedName ||
                contact.pushname ||
                fallback;

              setIf("name", nameCand);
              setIf("notify", contact.notify);
              setIf("verifiedName", contact.verifiedName);
              setIf("pushname", contact.pushname);

              filteredContacts.push(obj);

              await UpsertContactFromBaileysService({ companyId, obj });
            }
          })
        );

        // Validação de serialização
        try {
          JSON.stringify(filteredContacts);
        } catch (err: any) {
          logger.error(`Failed to serialize filteredContacts: ${err.message}`);
          Sentry.captureException(err);
          return;
        }

        // Persistência em arquivo
        const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
        const companyFolder = path.join(publicFolder, `company${companyId}`);
        const contactJson = path.join(companyFolder, "contactJson.txt");

        try {
          if (!fs.existsSync(companyFolder)) {
            fs.mkdirSync(companyFolder, { recursive: true });
            fs.chmodSync(companyFolder, 0o777);
          }
          if (fs.existsSync(contactJson)) {
            await fs.promises.unlink(contactJson);
          }
          await fs.promises.writeFile(
              contactJson,
              JSON.stringify(filteredContacts, null, 2)
          );
        } catch (err: any) {
          logger.error(`Failed to write contactJson.txt: ${err.message}`);
          Sentry.captureException(err);
        }

        // Upsert no banco (Baileys)
        try {
          await createOrUpdateBaileysService({
            whatsappId: whatsapp.id,
            contacts: filteredContacts,
          });
        } catch (err: any) {
          logger.error(`Error in createOrUpdateBaileysService: ${err.message}`);
          Sentry.captureException(err);
        }
      } catch (err: any) {
        logger.error(`Error in contacts.upsert: ${err.message}`);
        Sentry.captureException(err);
      }
    });
  } catch (err: any) {
    logger.error(`Error in wbotMonitor: ${err.message}`);
    Sentry.captureException(err);
  }
};

export default wbotMonitor;
