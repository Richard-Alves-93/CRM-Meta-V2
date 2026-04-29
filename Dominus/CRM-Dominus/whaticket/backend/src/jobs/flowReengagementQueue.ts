import formatBody from "../helpers/Mustache";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { FlowBuilderModel } from "../models/FlowBuilder";
import Ticket from "../models/Ticket";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../services/TicketServices/ShowTicketService";

interface IJobData {
  ticketId: number;
  companyId: number;
  flowId: number;
  lastFlowId: string;
}

const normalizeReengagement = (flowSettings: any) => {
  const reengagement = flowSettings?.reengagement || {};
  return {
    enabled: Boolean(reengagement.enabled),
    minutes: Number(reengagement.minutes) || 0,
    message: String(reengagement.message || "").trim()
  };
};

export default {
  key: `${process.env.DB_NAME}-flowReengagement`,

  async handle({ data }) {
    try {
      const { ticketId, companyId, flowId, lastFlowId } = data as IJobData;

      const ticket = await Ticket.findOne({
        where: {
          id: ticketId,
          companyId
        }
      });

      if (!ticket) {
        return;
      }

      if (ticket.status === "closed") {
        return;
      }

      if (!ticket.flowWebhook) {
        return;
      }

      if (String(ticket.flowStopped || "") !== String(flowId)) {
        return;
      }

      if (String(ticket.lastFlowId || "") !== String(lastFlowId || "")) {
        return;
      }

      const flow = await FlowBuilderModel.findOne({
        where: {
          id: flowId,
          company_id: companyId
        }
      });

      if (!flow?.flow) {
        return;
      }

      const { enabled, message } = normalizeReengagement(flow.flow["settings"]);

      if (!enabled || !message) {
        return;
      }

      const ticketDetails = await ShowTicketService(ticket.id, companyId);

      await SendWhatsAppMessage({
        body: message,
        ticket: ticketDetails,
        quotedMsg: null
      });

      SetTicketMessagesAsRead(ticketDetails);
      await ticketDetails.update({
        lastMessage: formatBody(message, ticketDetails)
      });
    } catch (error) {
      console.log("flowReengagementQueue error", error);
    }
  }
};
