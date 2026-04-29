// @ts-nocheck
import { Request, Response } from "express";
import { getIO } from "../libs/socket";

import AppError from "../errors/AppError";

import CreateTicketService from "../services/TicketServices/CreateTicketService";
import DeleteTicketService from "../services/TicketServices/DeleteTicketService";
import ListTicketsService from "../services/TicketServices/ListTicketsService";
import ShowTicketUUIDService from "../services/TicketServices/ShowTicketFromUUIDService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import ListTicketsServiceKanban from "../services/TicketServices/ListTicketsServiceKanban";

import CreateLogTicketService from "../services/TicketServices/CreateLogTicketService";
import ShowLogTicketService from "../services/TicketServices/ShowLogTicketService";
import FindOrCreateATicketTrakingService from "../services/TicketServices/FindOrCreateATicketTrakingService";
import ListTicketsServiceReport from "../services/TicketServices/ListTicketsServiceReport";
import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { Mutex } from "async-mutex";

type IndexQuery = {
  searchParam: string;
  pageNumber: string;
  status: string;
  date?: string;
  dateStart?: string;
  dateEnd?: string;
  updatedAt?: string;
  showAll: string;
  withUnreadMessages?: string;
  queueIds?: string;
  tags?: string;
  users?: string;
  whatsapps: string;
  statusFilter: string;
  isGroup?: string;
  sortTickets?: string;
  searchOnMessages?: string;
};

type IndexQueryReport = {
  searchParam: string;
  contactId: string;
  whatsappId: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  queueIds: string;
  tags: string;
  users: string;
  page: string;
  pageSize: string;
  onlyRated: string;
};

interface TicketData {
  contactId: number | string;
  status: string;
  queueId: number | string;
  userId: number | string;
  sendFarewellMessage?: boolean;
  whatsappId?: string;
  unreadMessages?: number;
  amountUsedBotQueues?: number;
  [key: string]: any;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    pageNumber,
    status,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    users: userIdsStringified,
    withUnreadMessages,
    statusFilter: statusStringfied,
    sortTickets,
    searchOnMessages
  } = req.query as IndexQuery;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: any[] = [];
  let usersIds: any[] = [];

  if (queueIdsStringified) {
    queueIds = JSON.parse(queueIdsStringified);
  }

  if (userIdsStringified) {
    usersIds = JSON.parse(userIdsStringified);
  }

  const { tickets, count, hasMore } = await ListTicketsService({
    searchParam,
    pageNumber,
    status,
    showAll,
    userId,
    queueIds,
    companyId,
  });

  return res.status(200).json({ tickets, count, hasMore });
};

export const report = async (req: Request, res: Response): Promise<Response> => {
  const {
    searchParam,
    contactId,
    whatsappId: whatsappIdsStringified,
    dateFrom,
    dateTo,
    status: statusStringified,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    page: pageNumber,
    pageSize,
    onlyRated
  } = req.query as IndexQueryReport;

  const userId = req.user.id;
  const { companyId } = req.user;

  let queueIds: number[] = [];
  let whatsappIds: string[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];
  let statusIds: string[] = [];

  if (statusStringified) statusIds = JSON.parse(statusStringified);
  if (whatsappIdsStringified) whatsappIds = JSON.parse(whatsappIdsStringified);
  if (queueIdsStringified) queueIds = JSON.parse(queueIdsStringified);
  if (tagIdsStringified) tagsIds = JSON.parse(tagIdsStringified);
  if (userIdsStringified) usersIds = JSON.parse(userIdsStringified);

  const { tickets, totalTickets } = await ListTicketsServiceReport(
    companyId,
    {
      searchParam,
      queueIds,
      tags: tagsIds,
      users: usersIds,
      status: statusIds,
      dateFrom,
      dateTo,
      userId,
      contactId,
      whatsappId: whatsappIds,
      onlyRated
    },
    +pageNumber,
    +pageSize
  );

  return res.status(200).json({ tickets, totalTickets });
};

export const kanban = async (req: Request, res: Response): Promise<Response> => {
  const {
    pageNumber,
    status,
    date,
    dateStart,
    dateEnd,
    updatedAt,
    searchParam,
    showAll,
    queueIds: queueIdsStringified,
    tags: tagIdsStringified,
    users: userIdsStringified,
    withUnreadMessages
  } = req.query as IndexQuery;

  const { companyId } = req.user;

  let queueIds: number[] = [];
  let tagsIds: number[] = [];
  let usersIds: number[] = [];

  if (queueIdsStringified) queueIds = JSON.parse(queueIdsStringified);
  if (tagIdsStringified) tagsIds = JSON.parse(tagIdsStringified);
  if (userIdsStringified) usersIds = JSON.parse(userIdsStringified);

  const { tickets, count, hasMore } = await ListTicketsServiceKanban({
    searchParam,
    tags: tagsIds,
    users: usersIds,
    pageNumber,
    status,
    date,
    dateStart,
    dateEnd,
    updatedAt,
    showAll,
    queueIds,
    withUnreadMessages,
    companyId
  });

  return res.status(200).json({ tickets, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { contactId, status, userId, queueId, whatsappId }: TicketData = req.body;
  const { companyId } = req.user;

  const ticket = await CreateTicketService({
    contactId,
    status,
    userId,
    companyId,
    queueId,
    whatsappId
  });

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-ticket`, {
      action: "update",
      ticket
    });

  return res.status(200).json(ticket);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { id: userId, companyId } = req.user;

  const contact = await ShowTicketService(ticketId, companyId);

  return res.status(200).json(contact);
};

export const showLog = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  const log = await ShowLogTicketService({ ticketId, companyId });

  return res.status(200).json(log);
};

export const showFromUUID = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { uuid } = req.params;
  const { id: userId, companyId } = req.user;

  const ticket: any = await ShowTicketUUIDService(uuid, companyId);

  if (ticket.channel === "whatsapp" && ticket.whatsappId && ticket.unreadMessages > 0) {
    SetTicketMessagesAsRead(ticket);
  }

  return res.status(200).json(ticket);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const ticketData: TicketData = req.body;
  const { companyId } = req.user;

  const mutex = new Mutex();
  const { ticket } = await mutex.runExclusive(async () => {
    const result = await UpdateTicketService({
      ticketData,
      ticketId,
      companyId
    });
    return result;
  });

  return res.status(200).json(ticket);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { id: userId, companyId } = req.user;

  const result = await DeleteTicketService(ticketId, companyId);

  if (result && result.error) throw new AppError(result.error.message);

  const io = getIO();
  io.of(String(companyId))
    .emit(`company-${companyId}-ticket`, {
      action: "delete",
      ticketId: ticketId
    });

  return res.status(200).json({ message: "ticket deleted" });
};

export const closeAll = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { status }: TicketData = req.body;
  
  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, user_id, queue_id")
    .eq("company_id", companyId)
    .eq("status", status);

  if (tickets) {
    for (const ticket of tickets) {
      const ticketData = {
        status: "closed",
        userId: ticket.user_id || null,
        queueId: ticket.queue_id || null,
        unreadMessages: 0,
        amountUsedBotQueues: 0,
        sendFarewellMessage: false
      };

      await UpdateTicketService({ ticketData, ticketId: ticket.id, companyId });
    }
  }

  return res.status(200).json();
};