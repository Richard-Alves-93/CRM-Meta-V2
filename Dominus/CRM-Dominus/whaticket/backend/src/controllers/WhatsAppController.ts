import { Request, Response } from "express";
import { getIO } from "../libs/socket";
import cacheLayer from "../libs/cache";
import { removeWbot, restartWbot } from "../libs/wbot";
import { supabase } from "../libs/supabaseClient";
import AppError from "../errors/AppError";
import DeleteBaileysService from "../services/BaileysServices/DeleteBaileysService";
import ShowCompanyService from "../services/CompanyService/ShowCompanyService";
import {
  getAccessTokenFromPage,
  getPageProfile,
  subscribeApp
} from "../services/FacebookServices/graphAPI";
import ShowPlanService from "../services/PlanService/ShowPlanService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";

import CreateWhatsAppService from "../services/WhatsappService/CreateWhatsAppService";
import DeleteWhatsAppService from "../services/WhatsappService/DeleteWhatsAppService";
import ListWhatsAppsService from "../services/WhatsappService/ListWhatsAppsService";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import { closeTicketsImported } from "../services/WhatsappService/ImportWhatsAppMessageService";
import ShowWhatsAppServiceAdmin from "../services/WhatsappService/ShowWhatsAppServiceAdmin";
import UpdateWhatsAppServiceAdmin from "../services/WhatsappService/UpdateWhatsAppServiceAdmin";
import ListAllWhatsAppsService from "../services/WhatsappService/ListAllWhatsAppService";
import ListFilterWhatsAppsService from "../services/WhatsappService/ListFilterWhatsAppsService";


interface WhatsappData {
  name: string;
  queueIds: number[];
  companyId: number;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  status?: string;
  isDefault?: boolean;
  token?: string;
  maxUseBotQueues?: string;
  timeUseBotQueues?: string;
  expiresTicket?: number;
  allowGroup?: false;
  sendIdQueue?: number;
  timeSendQueue?: number;
  timeInactiveMessage?: string;
  inactiveMessage?: string;
  ratingMessage?: string;
  maxUseBotQueuesNPS?: number;
  expiresTicketNPS?: number;
  whenExpiresTicket?: string;
  expiresInactiveMessage?: string;
  importOldMessages?: string;
  importRecentMessages?: string;
  importOldMessagesGroups?: boolean;
  closedTicketsPostImported?: boolean;
  groupAsTicket?: string;
  timeCreateNewTicket?: number;
  schedules?: any[];
  promptId?: number;
  collectiveVacationMessage?: string;
  collectiveVacationStart?: string;
  collectiveVacationEnd?: string;
  queueIdImportMessages?: number;
  flowIdNotPhrase?: number;
  flowIdWelcome?: number;
}

interface QueryParams {
  session?: number | string;
  channel?: string;
}

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { companyId } = req.user;
  const { session } = req.query as QueryParams;
  const whatsapps = await ListWhatsAppsService({ companyId, session });

  return res.status(200).json(whatsapps);
};

export const indexFilter = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { session, channel } = req.query as QueryParams;

  const whatsapps = await ListFilterWhatsAppsService({
    companyId,
    session,
    channel
  });

  return res.status(200).json(whatsapps);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    name,
    status,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    token,
    maxUseBotQueues,
    timeUseBotQueues,
    expiresTicket,
    allowGroup,
    timeSendQueue,
    sendIdQueue,
    timeInactiveMessage,
    inactiveMessage,
    ratingMessage,
    maxUseBotQueuesNPS,
    expiresTicketNPS,
    whenExpiresTicket,
    expiresInactiveMessage,
    importOldMessages,
    importRecentMessages,
    closedTicketsPostImported,
    importOldMessagesGroups,
    groupAsTicket,
    timeCreateNewTicket,
    schedules,
    promptId,
    collectiveVacationEnd,
    collectiveVacationMessage,
    collectiveVacationStart,
    queueIdImportMessages,
    flowIdNotPhrase,
    flowIdWelcome
  }: WhatsappData = req.body;
  const { companyId } = req.user;

  const company = await ShowCompanyService(companyId);
  const plan = await ShowPlanService(company.planId);

  if (!plan.useWhatsapp) {
    return res.status(400).json({
      error: "Você não possui permissão para acessar este recurso!"
    });
  }

  console.log("================ WhatsAppController ==============");
  console.log(req.body);
  console.log("==================================================");

  // 🔹 Forçar status inicial como DESCONHECTADO, para não ficar em "CONECTANDO"
  // até o usuário clicar em "QR CODE".
  const initialStatus = status || "DISCONNECTED";

  const { whatsapp, oldDefaultWhatsapp } = await CreateWhatsAppService({
    name,
    status: initialStatus,
    isDefault,
    greetingMessage,
    complationMessage,
    outOfHoursMessage,
    queueIds,
    companyId,
    token,
    maxUseBotQueues,
    timeUseBotQueues,
    expiresTicket,
    allowGroup,
    timeSendQueue,
    sendIdQueue,
    timeInactiveMessage,
    inactiveMessage,
    ratingMessage,
    maxUseBotQueuesNPS,
    expiresTicketNPS,
    whenExpiresTicket,
    expiresInactiveMessage,
    importOldMessages,
    importRecentMessages,
    closedTicketsPostImported,
    importOldMessagesGroups,
    groupAsTicket,
    timeCreateNewTicket,
    schedules,
    promptId,
    collectiveVacationEnd,
    collectiveVacationMessage,
    collectiveVacationStart,
    queueIdImportMessages,
    flowIdNotPhrase,
    flowIdWelcome
  });

  // 🔹 NÃO iniciar automaticamente a sessão ao criar a conexão.
  // A sessão (e o QR Code) será iniciada apenas pela rota de "QR CODE" no painel.
  // StartWhatsAppSession(whatsapp, companyId);

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const storeFacebook = async (req: Request, res: Response): Promise<Response> => {
  try {
    const {
      facebookUserId,
      facebookUserToken,
      addInstagram
    }: {
      facebookUserId: string;
      facebookUserToken: string;
      addInstagram: boolean;
    } = req.body;
    const { companyId } = req.user;

    console.log("[storeFacebook] body:", req.body);

    const { data } = await getPageProfile(facebookUserId, facebookUserToken);

    console.log("[storeFacebook] getPageProfile data:", JSON.stringify(data, null, 2));

    if (!data || data.length === 0) {
      console.log("[storeFacebook] Nenhuma página retornada para esse usuário/token");
      return res.status(400).json({
        error: "Facebook page not found 1"
      });
    }

    const io = getIO();
    const pages = [];

    for await (const page of data) {
      const { name, access_token, id, instagram_business_account } = page;

      console.log("[storeFacebook] Página encontrada:", {
        id,
        name,
        hasInstagram: !!instagram_business_account
      });

      const acessTokenPage = await getAccessTokenFromPage(access_token);

      // Sempre cria a conexão do Facebook para a página.
      pages.push({
        companyId,
        name,
        facebookUserId,
        facebookPageUserId: id,
        facebookUserToken: acessTokenPage,
        tokenMeta: facebookUserToken,
        isDefault: false,
        channel: "facebook",
        status: "CONNECTED",
        greetingMessage: "",
        farewellMessage: "",
        queueIds: [],
        isMultidevice: false
      });

      // Inscreve a página para receber eventos do Messenger.
      await subscribeApp(id, acessTokenPage);

      // Se solicitado, cria também a conexão do Instagram e tenta inscrever o IG.
      if (instagram_business_account && addInstagram) {
        const { id: instagramId, username, name: instagramName } =
          instagram_business_account;

        pages.push({
          companyId,
          name: `Insta ${username || instagramName}`,
          facebookUserId,
          facebookPageUserId: instagramId,
          facebookUserToken: acessTokenPage,
          tokenMeta: facebookUserToken,
          isDefault: false,
          channel: "instagram",
          status: "CONNECTED",
          greetingMessage: "",
          farewellMessage: "",
          queueIds: [],
          isMultidevice: false
        });

        try {
          await subscribeApp(instagramId, acessTokenPage);
        } catch (error: any) {
          console.warn(
            "[storeFacebook] Não foi possível inscrever o Instagram em subscribed_apps:",
            error?.response?.data || error?.message || error
          );
        }
      }
    }

    for (const pageConection of pages) {
      const { data: exist } = await supabase
        .from("whatsapps")
        .select("*")
        .eq("facebook_page_user_id", pageConection.facebookPageUserId)
        .maybeSingle();

      if (exist) {
        await supabase
          .from("whatsapps")
          .update(pageConection)
          .eq("id", exist.id);
      } else {
        const { whatsapp } = await CreateWhatsAppService(pageConection);

        io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
          action: "update",
          whatsapp
        });
      }
    }

    return res.status(200);
  } catch (error: any) {
    console.log(
      "[storeFacebook] Erro ao integrar com Facebook:",
      error?.response?.data || error
    );

    return res.status(400).json({
      error: "Facebook page not found 2"
    });
  }
};


export const show = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const { session } = req.query;

  const whatsapp = await ShowWhatsAppService(whatsappId, companyId, session);

  return res.status(200).json(whatsapp);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppService({
    whatsappData,
    whatsappId,
    companyId
  });

  const io = getIO();
  io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const closedTickets = async (req: Request, res: Response) => {
  const { whatsappId } = req.params;

  closeTicketsImported(whatsappId);

  return res.status(200).json("whatsapp");
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId, profile } = req.user;
  const io = getIO();

  if (profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
  console.log("REMOVING WHATSAPP", whatsappId);
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  if (whatsapp.channel === "whatsapp") {
    await DeleteBaileysService(whatsappId);
    await DeleteWhatsAppService(whatsappId);
    await cacheLayer.delFromPattern(`sessions:${whatsappId}:*`);
    removeWbot(whatsappId);

    io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
      action: "delete",
      whatsappId: whatsappId
    });
  }

  if (whatsapp.channel === "facebook" || whatsapp.channel === "instagram") {
    const { facebookUserToken } = whatsapp;

    const { data: getAllSameToken } = await supabase
      .from("whatsapps")
      .select("*")
      .eq("facebook_user_token", facebookUserToken);

    await supabase
      .from("whatsapps")
      .delete()
      .eq("facebook_user_token", facebookUserToken);

    if (getAllSameToken) {
      for (const whatsapp of getAllSameToken) {
        io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
          action: "delete",
          whatsappId: whatsapp.id
        });
      }
    }
  }

  return res.status(200).json({ message: "Session disconnected." });
};

export const restart = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId, profile, id } = req.user;

  const { data: user } = await supabase
    .from("profiles")
    .select("allow_connections")
    .eq("id", id)
    .single();
    
  const allowConnections = user?.allow_connections;

  if (profile !== "admin" && allowConnections === "disabled") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  await restartWbot(companyId);

  return res.status(200).json({ message: "Whatsapp restart." });
};

export const listAll = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { companyId } = req.user;
  const { session } = req.query as QueryParams;
  const whatsapps = await ListAllWhatsAppsService({ session });
  return res.status(200).json(whatsapps);
};

export const updateAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const whatsappData = req.body;
  const { companyId } = req.user;

  const { whatsapp, oldDefaultWhatsapp } = await UpdateWhatsAppServiceAdmin({
    whatsappData,
    whatsappId,
    companyId
  });

  const io = getIO();
  io.of(String(companyId)).emit(`admin-whatsapp`, {
    action: "update",
    whatsapp
  });

  if (oldDefaultWhatsapp) {
    io.of(String(companyId)).emit(`admin-whatsapp`, {
      action: "update",
      whatsapp: oldDefaultWhatsapp
    });
  }

  return res.status(200).json(whatsapp);
};

export const removeAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const io = getIO();
  console.log("REMOVING WHATSAPP ADMIN", whatsappId);
  const whatsapp = await ShowWhatsAppService(whatsappId, companyId);

  if (whatsapp.channel === "whatsapp") {
    await DeleteBaileysService(whatsappId);
    await DeleteWhatsAppService(whatsappId);
    await cacheLayer.delFromPattern(`sessions:${whatsappId}:*`);
    removeWbot(whatsappId);

    io.of(String(companyId)).emit(`admin-whatsapp`, {
      action: "delete",
      whatsappId: whatsappId
    });
  }

  if (whatsapp.channel === "facebook" || whatsapp.channel === "instagram") {
    const { facebookUserToken } = whatsapp;

    const { data: getAllSameToken } = await supabase
      .from("whatsapps")
      .select("*")
      .eq("facebook_user_token", facebookUserToken);

    await supabase
      .from("whatsapps")
      .delete()
      .eq("facebook_user_token", facebookUserToken);

    if (getAllSameToken) {
      for (const whatsapp of getAllSameToken) {
        io.of(String(companyId)).emit(`company-${companyId}-whatsapp`, {
          action: "delete",
          whatsappId: whatsapp.id
        });
      }
    }
  }

  return res.status(200).json({ message: "Session disconnected." });
};

export const showAdmin = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { companyId } = req.user;
  const whatsapp = await ShowWhatsAppServiceAdmin(whatsappId);

  return res.status(200).json(whatsapp);
};
