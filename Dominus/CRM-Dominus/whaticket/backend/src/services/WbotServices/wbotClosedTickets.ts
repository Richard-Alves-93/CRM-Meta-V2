import { supabase } from "../../libs/supabaseClient";
import { getIO } from "../../libs/socket"
import formatBody from "../../helpers/Mustache";
import SendWhatsAppMessage from "./SendWhatsAppMessage";
import moment from "moment";
import ShowTicketService from "../TicketServices/ShowTicketService";
import { verifyMessage } from "./wbotMessageListener";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import logger from "../../utils/logger";
import { isNil } from "lodash";
import { sub } from "date-fns";

const closeTicket = async (ticket: any, body: string, companyId: any) => {
  await supabase
    .from("tickets")
    .update({
      status: "closed",
      last_message: body,
      unread_messages: 0,
      amount_used_bot_queues: 0,
      updated_at: new Date().toISOString()
    })
    .eq("id", ticket.id);

  await CreateLogTicketService({
    userId: ticket.userId || ticket.user_id || null,
    queueId: ticket.queueId || ticket.queue_id || null,
    ticketId: ticket.id,
    type: "autoClose"
  });
};

const handleOpenTickets = async (companyId: number | string, whatsapp: any) => {
  const timeInactiveMessage = Number(whatsapp.timeInactiveMessage || 0);
  let expiresTime = Number(whatsapp.expiresTicket || 0);

  if (!isNil(expiresTime) && expiresTime > 0) {
    if (!isNil(timeInactiveMessage) && timeInactiveMessage > 0) {
      const inactiveLimit = sub(new Date(), { minutes: timeInactiveMessage }).toISOString();

      let query = supabase
        .from("tickets")
        .select("*, contact:contacts(*)")
        .eq("status", "open")
        .eq("company_id", companyId)
        .eq("whatsapp_id", whatsapp.id)
        .lt("updated_at", inactiveLimit)
        .is("imported", null)
        .eq("send_inactive_message", false);

      if (Number(whatsapp.whenExpiresTicket) === 1) {
        query = query.eq("from_me", true);
      }

      const { data: ticketsForInactiveMessage } = await query;

      if (ticketsForInactiveMessage && ticketsForInactiveMessage.length > 0) {
        logger.info(`Encontrou ${ticketsForInactiveMessage.length} atendimentos para enviar mensagem de inatividade na empresa ${companyId}- na conexão ${whatsapp.name}!`)
        await Promise.all(ticketsForInactiveMessage.map(async (ticket: any) => {
          // No reload needed with Supabase usually if we just fetched it, 
          // but if we want to be safe we can refetch or just check the current state
          if (!ticket.send_inactive_message) {
            const legacyTicket = { ...ticket, id: ticket.id, companyId, contact: ticket.contact };
            const bodyMessageInactive = formatBody(`\u200e ${whatsapp.inactiveMessage}`, legacyTicket);
            const sentMessage = await SendWhatsAppMessage({ body: bodyMessageInactive, ticket: legacyTicket });
            await verifyMessage(sentMessage, legacyTicket, ticket.contact);
            
            await supabase
              .from("tickets")
              .update({ send_inactive_message: true, from_me: true, updated_at: new Date().toISOString() })
              .eq("id", ticket.id);
          }
        }));
      }

      expiresTime += timeInactiveMessage;
    }

    const expiresLimit = sub(new Date(), { minutes: expiresTime }).toISOString();

    let query = supabase
      .from("tickets")
      .select("*, contact:contacts(*)")
      .eq("status", "open")
      .eq("company_id", companyId)
      .eq("whatsapp_id", whatsapp.id)
      .lt("updated_at", expiresLimit)
      .is("imported", null);

    if (timeInactiveMessage > 0) {
      query = query.eq("send_inactive_message", true);
    }

    if (Number(whatsapp.whenExpiresTicket) === 1) {
      query = query.eq("from_me", true);
    }

    const { data: ticketsToClose } = await query;

    if (ticketsToClose && ticketsToClose.length > 0) {
      logger.info(`Encontrou ${ticketsToClose.length} atendimentos para encerrar na empresa ${companyId} - na conexão ${whatsapp.name}!`);

      for (const ticket of ticketsToClose) {
        const { data: ticketTraking } = await supabase
          .from("ticket_trackings")
          .select("*")
          .eq("ticket_id", ticket.id)
          .is("finished_at", null)
          .maybeSingle();

        let bodyExpiresMessageInactive = "";

        if (!isNil(whatsapp.expiresInactiveMessage) && whatsapp.expiresInactiveMessage !== "") {
          const legacyTicket = { ...ticket, id: ticket.id, companyId, contact: ticket.contact };
          bodyExpiresMessageInactive = formatBody(`\u200e${whatsapp.expiresInactiveMessage}`, legacyTicket);
          const sentMessage = await SendWhatsAppMessage({ body: bodyExpiresMessageInactive, ticket: legacyTicket });
          await verifyMessage(sentMessage, legacyTicket, ticket.contact);
        }

        await closeTicket(ticket, bodyExpiresMessageInactive, companyId);

        if (ticketTraking) {
          await supabase
            .from("ticket_trackings")
            .update({
              finished_at: new Date().toISOString(),
              closed_at: new Date().toISOString(),
              whatsapp_id: ticket.whatsapp_id,
              user_id: ticket.user_id,
            })
            .eq("id", ticketTraking.id);
        }

        const io = getIO();
        io.of(companyId.toString()).emit(`company-${companyId}-ticket`, {
          action: "delete",
          ticketId: ticket.id
        });
      }
    }
  }
};

const handleNPSTickets = async (companyId: number | string, whatsapp: any) => {
  const expiresTime = Number(whatsapp.expiresTicketNPS);
  const dataLimite = moment().subtract(expiresTime, 'minutes').toISOString();

  const { data: ticketsToClose } = await supabase
    .from("tickets")
    .select("*, contact:contacts(*)")
    .eq("status", "nps")
    .eq("company_id", companyId)
    .eq("whatsapp_id", whatsapp.id)
    .lt("updated_at", dataLimite)
    .is("imported", null);

  if (ticketsToClose && ticketsToClose.length > 0) {
    logger.info(`Encontrou ${ticketsToClose.length} atendimentos para encerrar NPS na empresa ${companyId} - na conexão ${whatsapp.name}!`);
    await Promise.all(ticketsToClose.map(async (ticket: any) => {
      const { data: ticketTraking } = await supabase
        .from("ticket_trackings")
        .select("*")
        .eq("ticket_id", ticket.id)
        .is("finished_at", null)
        .maybeSingle();

      let bodyComplationMessage = "";

      if (!isNil(whatsapp.complationMessage) && whatsapp.complationMessage !== "") {
        const legacyTicket = { ...ticket, id: ticket.id, companyId, contact: ticket.contact };
        bodyComplationMessage = formatBody(`\u200e${whatsapp.complationMessage}`, legacyTicket);
        const sentMessage = await SendWhatsAppMessage({ body: bodyComplationMessage, ticket: legacyTicket });
        await verifyMessage(sentMessage, legacyTicket, ticket.contact);
      }

      await closeTicket(ticket, bodyComplationMessage, companyId);

      if (ticketTraking) {
        await supabase
          .from("ticket_trackings")
          .update({
            finished_at: moment().toISOString(),
            closed_at: moment().toISOString(),
            whatsapp_id: ticket.whatsapp_id,
            user_id: ticket.user_id,
          })
          .eq("id", ticketTraking.id);
      }

      getIO().of(companyId.toString()).emit(`company-${companyId}-ticket`, {
        action: "delete",
        ticketId: ticket.id
      });
    }));
  }
};

export const ClosedAllOpenTickets = async (companyId: number | string): Promise<void> => {
  try {
    const { data: whatsapps } = await supabase
      .from("whatsapps")
      .select("id, name, status, time_send_queue, send_id_queue, time_inactive_message, expires_inactive_message, inactive_message, expires_ticket, expires_ticket_nps, when_expires_ticket, complation_message")
      .eq("company_id", companyId)
      .eq("status", "CONNECTED")
      .or("expires_ticket.gt.0,expires_ticket_nps.gt.0");

    if (whatsapps && whatsapps.length > 0) {
      for (const whatsapp of whatsapps) {
        // Map snake_case to camelCase for internal logic compatibility
        const mappedWhatsapp = {
          ...whatsapp,
          timeInactiveMessage: whatsapp.time_inactive_message,
          expiresTicket: whatsapp.expires_ticket,
          inactiveMessage: whatsapp.inactive_message,
          whenExpiresTicket: whatsapp.when_expires_ticket,
          expiresInactiveMessage: whatsapp.expires_inactive_message,
          expiresTicketNPS: whatsapp.expires_ticket_nps,
          complationMessage: whatsapp.complation_message
        };

        if (mappedWhatsapp.expiresTicket) {
          await handleOpenTickets(companyId, mappedWhatsapp);
        }
        if (mappedWhatsapp.expiresTicketNPS) {
          await handleNPSTickets(companyId, mappedWhatsapp);
        }
      }
    }

  } catch (error) {
    console.error('Erro:', error);
  }
};
