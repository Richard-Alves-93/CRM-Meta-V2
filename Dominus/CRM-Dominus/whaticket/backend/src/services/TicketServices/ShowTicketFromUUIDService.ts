import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import User from "../../models/User";
import Queue from "../../models/Queue";
import Tag from "../../models/Tag";
import Whatsapp from "../../models/Whatsapp";
import Company from "../../models/Company";
import QueueIntegrations from "../../models/QueueIntegrations";

const ShowTicketUUIDService = async (uuid: string,
  companyId: number | string): Promise<Ticket> => {
  const ticket = await Ticket.findOne({
    where: {
      uuid,
      companyId
    },
    attributes: [
      "id",
      "uuid",
      "queueId",
      "isGroup",
      "channel",
      "status",
      "contactId",
      "useIntegration",
      "lastMessage",
      "updatedAt",
      "unreadMessages",
      "companyId",
      "whatsappId",
      "imported",
      "lgpdAcceptedAt",
      "amountUsedBotQueues",
      "useIntegration",
      "integrationId",
      "userId",
      "amountUsedBotQueuesNPS",
      "lgpdSendMessageAt",
      "isBot"
    ],
    include: [
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "disableBot", "urlPicture", "companyId"],
        include: ["extraInfo", "tags",
          {
            association: "wallets",
            attributes: ["id", "name"]
          }]
      },
      {
        model: Queue,
        as: "queue",
        attributes: ["id", "name", "color"]
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name"]
      },
      {
        model: Tag,
        as: "tags",
        attributes: ["id", "name", "color"]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name", "groupAsTicket", "greetingMediaAttachment", "facebookUserToken", "facebookUserId"]
      },
      {
        model: Company,
        as: "company",
        attributes: ["id", "name"]
      },
      {
        model: QueueIntegrations,
        as: "queueIntegration",
        attributes: ["id", "name"]
      }
    ]
  });

  if (!ticket) {
    console.log(`[DEBUG] ShowTicketUUIDService: Ticket UUID ${uuid} not found in company ${companyId}`);
    throw new AppError("ERR_NO_TICKET_FOUND", 404);
  }

  if (String(ticket.companyId) !== String(companyId)) {
    console.log(`[DEBUG] ShowTicketUUIDService: Company mismatch! Ticket companyId: ${ticket.companyId}, User companyId: ${companyId}`);
    throw new AppError("Não é possível consultar registros de outra empresa", 403);
  }

  return ticket;
};

export default ShowTicketUUIDService;
