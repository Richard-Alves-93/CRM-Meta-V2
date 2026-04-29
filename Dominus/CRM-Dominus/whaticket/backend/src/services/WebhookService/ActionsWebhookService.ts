import AppError from "../../errors/AppError";
import { WebhookModel } from "../../models/Webhook";
import { sendMessageFlow } from "../../controllers/MessageController";
import { IConnections, INodes } from "./DispatchWebHookService";
import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import CreateContactService from "../ContactServices/CreateContactService";
import Contact from "../../models/Contact";
import CreateTicketService from "../TicketServices/CreateTicketService";
import CreateTicketServiceWebhook from "../TicketServices/CreateTicketServiceWebhook";
import { SendMessage } from "../../helpers/SendMessage";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import Ticket from "../../models/Ticket";
import fs from "fs";
import GetWhatsappWbot from "../../helpers/GetWhatsappWbot";
import path from "path";
import SendWhatsAppMedia from "../WbotServices/SendWhatsAppMedia";
import SendWhatsAppMediaFlow, {
  typeSimulation
} from "../WbotServices/SendWhatsAppMediaFlow";
import { randomizarCaminho } from "../../utils/randomizador";
import { SendMessageFlow } from "../../helpers/SendMessageFlow";
import formatBody from "../../helpers/Mustache";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import SendWhatsAppMessage from "../WbotServices/SendWhatsAppMessage";
import ShowTicketService from "../TicketServices/ShowTicketService";
import CreateMessageService, {
  MessageData
} from "../MessageServices/CreateMessageService";
import { randomString } from "../../utils/randomCode";
import ShowQueueService from "../QueueService/ShowQueueService";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import FindOrCreateATicketTrakingService from "../TicketServices/FindOrCreateATicketTrakingService";
import ShowTicketUUIDService from "../TicketServices/ShowTicketFromUUIDService";
import logger from "../../utils/logger";
import CreateLogTicketService from "../TicketServices/CreateLogTicketService";
import CompaniesSettings from "../../models/CompaniesSettings";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import { delay } from "bluebird";
import typebotListener from "../TypebotServices/typebotListener";
import { getWbot } from "../../libs/wbot";
import type { proto } from "baileys";
import { handleOpenAi } from "../IntegrationsServices/OpenAiService";
import { IOpenAi } from "../../@types/openai";
import BullQueues from "../../libs/queue";
import { FlowBuilderModel } from "../../models/FlowBuilder";

interface IAddContact {
  companyId: number;
  name: string;
  phoneNumber: string;
  email?: string;
  dataMore?: any;
}

const FLOW_REENGAGEMENT_QUEUE_KEY = `${process.env.DB_NAME}-flowReengagement`;
// Hotfix: desabilita completamente o lembrete automático até estabilizar o flowbuilder.
const FLOW_REENGAGEMENT_ENABLED = false;

const buildFlowReengagementJobId = (ticketId: number) =>
  `flowReengagement:${ticketId}`;

const parseReengagementSettings = (flowSettings: any) => {
  const reengagement = flowSettings?.reengagement || {};
  return {
    enabled: Boolean(reengagement.enabled),
    minutes: Number(reengagement.minutes) || 0,
    message: String(reengagement.message || "").trim()
  };
};

const removeFlowReengagementJob = async (ticketId?: number) => {
  if (!FLOW_REENGAGEMENT_ENABLED) {
    return;
  }

  if (!ticketId) {
    return;
  }

  try {
    const queue = BullQueues.queues.find(
      item => item.name === FLOW_REENGAGEMENT_QUEUE_KEY
    );
    if (!queue) {
      return;
    }

    const job = await queue.bull.getJob(buildFlowReengagementJobId(ticketId));
    if (job) {
      await job.remove();
    }
  } catch (error) {
    logger.warn("removeFlowReengagementJob failed", error);
  }
};

const scheduleFlowReengagement = async (
  companyId: number,
  idFlowDb: number,
  ticketId?: number,
  lastFlowId?: string
) => {
  if (!FLOW_REENGAGEMENT_ENABLED) {
    return;
  }

  if (!ticketId || !lastFlowId) {
    return;
  }

  const flow = await FlowBuilderModel.findOne({
    where: {
      id: idFlowDb,
      company_id: companyId
    }
  });

  if (!flow?.flow) {
    return;
  }

  const { enabled, minutes, message } = parseReengagementSettings(
    flow.flow["settings"]
  );

  if (!enabled || minutes < 1 || !message) {
    return;
  }

  await removeFlowReengagementJob(ticketId);

  await BullQueues.add(
    FLOW_REENGAGEMENT_QUEUE_KEY,
    {
      ticketId,
      companyId,
      flowId: idFlowDb,
      lastFlowId
    },
    {
      delay: minutes * 60 * 1000,
      jobId: buildFlowReengagementJobId(ticketId)
    }
  );
};

export const ActionsWebhookService = async (
  whatsappId: number,
  idFlowDb: number,
  companyId: number,
  nodes: INodes[],
  connects: IConnections[],
  nextStage: string,
  dataWebhook: any,
  details: any,
  hashWebhookId: string,
  pressKey?: string,
  idTicket?: number,
  numberPhrase: "" | { number: string; name: string; email: string } = "",
  msg?: proto.IWebMessageInfo
): Promise<string> => {
  try {
    const io = getIO();
    let next = nextStage;
    console.log(
      "ActionWebhookService | 53",
      idFlowDb,
      companyId,
      nodes,
      connects,
      nextStage,
      dataWebhook,
      details,
      hashWebhookId,
      pressKey,
      idTicket,
      numberPhrase
    );
    let createFieldJsonName = "";

    const connectStatic = connects;
    if (numberPhrase === "") {
      const nameInput = details.inputs.find(item => item.keyValue === "nome");
      nameInput.data.split(",").map(dataN => {
        const lineToData = details.keysFull.find(item => item === dataN);
        let sumRes = "";
        if (!lineToData) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToData, dataWebhook);
        }
        createFieldJsonName = createFieldJsonName + sumRes;
      });
    } else {
      createFieldJsonName = numberPhrase.name;
    }

    let numberClient = "";

    if (numberPhrase === "") {
      const numberInput = details.inputs.find(
        item => item.keyValue === "celular"
      );

      numberInput.data.split(",").map(dataN => {
        const lineToDataNumber = details.keysFull.find(item => item === dataN);
        let createFieldJsonNumber = "";
        if (!lineToDataNumber) {
          createFieldJsonNumber = dataN;
        } else {
          createFieldJsonNumber = constructJsonLine(
            lineToDataNumber,
            dataWebhook
          );
        }

        numberClient = numberClient + createFieldJsonNumber;
      });
    } else {
      numberClient = numberPhrase.number;
    }

    numberClient = removerNaoLetrasNumeros(numberClient);

    if (numberClient.substring(0, 2) === "55") {
      if (parseInt(numberClient.substring(2, 4)) >= 31) {
        if (numberClient.length === 13) {
          numberClient =
            numberClient.substring(0, 4) + numberClient.substring(5, 13);
        }
      }
    }

    let createFieldJsonEmail = "";

    if (numberPhrase === "") {
      const emailInput = details.inputs.find(item => item.keyValue === "email");
      emailInput.data.split(",").map(dataN => {
        const lineToDataEmail = details.keysFull.find(item =>
          item.endsWith("email")
        );

        let sumRes = "";
        if (!lineToDataEmail) {
          sumRes = dataN;
        } else {
          sumRes = constructJsonLine(lineToDataEmail, dataWebhook);
        }

        createFieldJsonEmail = createFieldJsonEmail + sumRes;
      });
    } else {
      createFieldJsonEmail = numberPhrase.email;
    }

    const lengthLoop = nodes.length;

    // ===== Seleção de conexão WhatsApp (respeitando whatsappId quando existir) =====
    let whatsapp: any;
    try {
      if (whatsappId) {
        // tenta a conexão específica
        whatsapp = await ShowWhatsAppService(whatsappId, companyId);
      }
      // se não encontrar/especificar, usa a padrão da empresa
      if (!whatsapp) {
        whatsapp = await GetDefaultWhatsApp(companyId);
      }
    } catch (e) {
      // fallback final para padrão
      whatsapp = await GetDefaultWhatsApp(companyId);
    }
    // ==============================================================================

    if (whatsapp.status !== "CONNECTED") {
      return;
    }

    let execCount = 0;

    let execFn = "";

    let ticket: any = null;

    let noAlterNext = false;

    if (pressKey && idTicket) {
      await removeFlowReengagementJob(idTicket);
    }

    for (var i = 0; i < lengthLoop; i++) {
      let nodeSelected: any;
      let ticketInit: Ticket;

      if (pressKey) {
        console.log("UPDATE2...");
        const normalizedPressKeyText = normalizeText(pressKey);
        if (normalizedPressKeyText === "parar" || normalizedPressKeyText === "sair") {
          console.log("UPDATE3...");
          if (idTicket) {
            console.log("UPDATE4...");
            ticketInit = await Ticket.findOne({
              where: { id: idTicket, whatsappId }
            });
            if (ticketInit) {
              await ticketInit.update({
                status: "closed"
              });
            }
            if (ticket) {
              await ticket.update({
                status: "closed"
              });
            }
          }
          break;
        }

        if (execFn === "") {
          console.log("UPDATE5...");
          nodeSelected = nodes.filter(node => node.id === next)[0] || {
            type: "menu"
          };
        } else {
          console.log("UPDATE6...");
          nodeSelected = nodes.filter(node => node.id === execFn)[0];
        }
      } else {
        console.log("UPDATE7...");
        const otherNode = nodes.filter(node => node.id === next)[0];
        if (otherNode) {
          nodeSelected = otherNode;
        }
      }

      if (nodeSelected.type === "message") {
        let msg;

        const webhook = ticket?.dataWebhook;

        if (webhook && webhook.hasOwnProperty("variables")) {
          msg = {
            body: replaceMessages(webhook, nodeSelected.data.label)
          };
        } else {
          msg = {
            body: nodeSelected.data.label
          };
        }

        await SendMessage(whatsapp, {
          number: numberClient,
          body: msg.body
        });

        await intervalWhats("1");
      }
      console.log("273");
      if (nodeSelected.type === "typebot") {
        console.log("275");
        const wbot = getWbot(whatsapp.id);
        await typebotListener({
          wbot: wbot,
          msg,
          ticket,
          typebot: nodeSelected.data.typebotIntegration
        });
      }

      if (nodeSelected.type === "openai") {
        // ===== IA NO FLOWBUILDER (OpenAI/Gemini) =====
        // Garantimos que o ticket esteja carregado antes de usar IA,
        // pois ele será necessário depois para transferir para fila real.
        if (!ticket && idTicket) {
          ticket = await Ticket.findOne({
            where: { id: idTicket, companyId }
          });
        }

        if (!ticket) {
          logger.warn("ActionsWebhookService: ticket não encontrado para nó OpenAI", {
            idTicket,
            companyId,
            whatsappId
          });
          // se não tiver ticket, não dá pra seguir com IA nesse nó; continua fluxo
          continue;
        }

        const {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens,
          temperature,
          apiKey,
          queueId,
          maxMessages,
          model
        } = nodeSelected.data.typebotIntegration as IOpenAi;

        const openAiSettings: IOpenAi = {
          name,
          prompt,
          voice,
          voiceKey,
          voiceRegion,
          maxTokens,
          temperature,
          apiKey,
          queueId,
          maxMessages,
          model
        };

        const contact = await Contact.findOne({
          where: { number: numberClient, companyId }
        });

        const wbot = getWbot(whatsapp.id);

        const ticketTraking = await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          userId: null,
          whatsappId: whatsapp?.id
        });

        // 🔹 Aqui a IA é chamada. No próximo passo (OpenAiService)
        // vamos ensinar o handleOpenAi a:
        // - detectar quando o cliente pedir atendente humano
        // - e acionar a transferência de fila usando queueId / ticket.
        await handleOpenAi(
          openAiSettings,
          msg,
          wbot,
          ticket,
          contact,
          null,
          ticketTraking
        );
      }

      if (nodeSelected.type === "question") {
        const { message } = nodeSelected.data.typebotIntegration;
        const ticketDetails = await ShowTicketService(ticket.id, companyId);
        const bodyFila = formatBody(`${message}`, ticket.contact);
        await delay(3000);
        await typeSimulation(ticket, "composing");
        await SendWhatsAppMessage({
          body: bodyFila,
          ticket: ticketDetails,
          quotedMsg: null
        });
        SetTicketMessagesAsRead(ticketDetails);
        await ticketDetails.update({
          lastMessage: bodyFila
        });
        await ticket.update({
          userId: null,
          companyId: companyId,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });
        await scheduleFlowReengagement(
          companyId,
          idFlowDb,
          ticket.id,
          nodeSelected.id
        );
        break;
      }

      if (nodeSelected.type === "ticket") {
        const queueId = nodeSelected.data?.data?.id || nodeSelected.data?.id;
        const queue = await ShowQueueService(queueId, companyId);

        await ticket.update({
          status: "pending",
          queueId: queue.id,
          userId: ticket.userId,
          companyId: companyId,
          flowWebhook: true,
          lastFlowId: nodeSelected.id,
          hashFlowId: hashWebhookId,
          flowStopped: idFlowDb.toString()
        });

        await FindOrCreateATicketTrakingService({
          ticketId: ticket.id,
          companyId,
          whatsappId: ticket.whatsappId,
          userId: ticket.userId
        });

        await UpdateTicketService({
          ticketData: {
            status: "pending",
            queueId: queue.id
          },
          ticketId: ticket.id,
          companyId
        });

        await CreateLogTicketService({
          ticketId: ticket.id,
          type: "queue",
          queueId: queue.id
        });

        let settings = await CompaniesSettings.findOne({
          where: {
            companyId: companyId
          }
        });

        const enableQueuePosition = settings.sendQueuePosition === "enabled";

        if (enableQueuePosition) {
          const count = await Ticket.findAndCountAll({
            where: {
              userId: null,
              status: "pending",
              companyId,
              queueId: queue.id,
              whatsappId: whatsapp.id,
              isGroup: false
            }
          });
          const qtd = count.count === 0 ? 1 : count.count;
          const msgFila = `${settings.sendQueuePositionMessage} *${qtd}*`;
          const ticketDetails = await ShowTicketService(ticket.id, companyId);
          const bodyFila = formatBody(`${msgFila}`, ticket.contact);
          await delay(3000);
          await typeSimulation(ticket, "composing");
          await SendWhatsAppMessage({
            body: bodyFila,
            ticket: ticketDetails,
            quotedMsg: null
          });
          SetTicketMessagesAsRead(ticketDetails);
          await ticketDetails.update({
            lastMessage: bodyFila
          });
        }
      }

      if (nodeSelected.type === "interval") {
          // Node standalone do FlowBuilder (frontend) usa data.sec (segundos) :contentReference[oaicite:1]{index=1}
          const sec = Number(nodeSelected?.data?.sec ?? 0);

          if (Number.isFinite(sec) && sec > 0) {
            await intervalWhats(String(sec)); // intervalWhats espera string em segundos
          }
      }

      if (nodeSelected.type === "singleBlock") {
        for (var iLoc = 0; iLoc < nodeSelected.data.seq.length; iLoc++) {
          const elementNowSelected = nodeSelected.data.seq[iLoc];

          ticket = await Ticket.findOne({
            where: { id: idTicket, companyId }
          });

          if (elementNowSelected.includes("message")) {
            const bodyFor = nodeSelected.data.elements.filter(
              item => item.number === elementNowSelected
            )[0].value;
            const ticketDetails = await ShowTicketService(idTicket, companyId);
            let msg;
            const webhook = ticket?.dataWebhook;
            if (webhook && webhook.hasOwnProperty("variables")) {
              msg = replaceMessages(webhook.variables, bodyFor);
            } else {
              msg = bodyFor;
            }
            await delay(3000);
            await typeSimulation(ticket, "composing");
            await SendWhatsAppMessage({
              body: msg,
              ticket: ticketDetails,
              quotedMsg: null
            });
            SetTicketMessagesAsRead(ticketDetails);
            await ticketDetails.update({
              lastMessage: formatBody(bodyFor, ticket.contact)
            });
            await intervalWhats("1");
          }
          if (elementNowSelected.includes("interval")) {
            await intervalWhats(
              nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].value
            );
          }

          if (elementNowSelected.includes("img")) {
            await typeSimulation(ticket, "composing");
            await SendMessage(whatsapp, {
              number: numberClient,
              body: "",
              mediaPath:
                process.env.BACKEND_URL === "https://localhost:8090"
                  ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
                  : `${__dirname
                      .split("dist")[0]
                      .split("\\")
                      .join("/")}public/${
                      nodeSelected.data.elements.filter(
                        item => item.number === elementNowSelected
                      )[0].value
                    }`
            });
            await intervalWhats("1");
          }

          if (elementNowSelected.includes("audio")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "https://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });
            await typeSimulation(ticket, "recording");
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt,
              isRecord: nodeSelected.data.elements.filter(
                item => item.number === elementNowSelected
              )[0].record
            });
            await intervalWhats("1");
          }
          if (elementNowSelected.includes("video")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "https://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;
            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });
            await typeSimulation(ticket, "recording");
            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });
            await intervalWhats("1");
          }

          // ---------- INÍCIO DO BLOCO ADICIONADO PARA DOCUMENTOS ----------
          if (elementNowSelected.includes("document")) {
            const mediaDirectory =
              process.env.BACKEND_URL === "https://localhost:8090"
                ? `${__dirname.split("src")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`
                : `${__dirname.split("dist")[0].split("\\").join("/")}public/${
                    nodeSelected.data.elements.filter(
                      item => item.number === elementNowSelected
                    )[0].value
                  }`;

            const ticketInt = await Ticket.findOne({
              where: { id: ticket.id }
            });

            await typeSimulation(ticket, "composing");

            await SendWhatsAppMediaFlow({
              media: mediaDirectory,
              ticket: ticketInt
            });

            await intervalWhats("1");
          }
          // ---------- FIM DO BLOCO ADICIONADO PARA DOCUMENTOS ----------
        }
      }

      let isRandomizer: boolean;
      if (nodeSelected.type === "randomizer") {
        const selectedRandom = randomizarCaminho(
          nodeSelected.data.percent / 100
        );
        const resultConnect = connects.filter(
          connect => connect.source === nodeSelected.id
        );
        if (selectedRandom === "A") {
          next = resultConnect.filter(item => item.sourceHandle === "a")[0]
            .target;
          noAlterNext = true;
        } else {
          next = resultConnect.filter(item => item.sourceHandle === "b")[0]
            .target;
          noAlterNext = true;
        }
        isRandomizer = true;
      }

      let isMenu: boolean;
      if (nodeSelected.type === "menu") {
        console.log(650, "menu");
        if (pressKey) {
          const selectedOption = resolveMenuSelection(pressKey, nodeSelected);
          const selectedOptionAsNumber = Number(selectedOption);
          const menuNodeId = nodeSelected.id || next;
          const outgoingConnections = connectStatic.filter(
            connection => String(connection.source) === String(menuNodeId)
          );

          const connectionByHandle = outgoingConnections.find(connection => {
            const sourceHandle = String(connection.sourceHandle || "");
            return sourceHandle === `a${selectedOption}` ||
              sourceHandle === String(selectedOption) ||
              sourceHandle === `option-${selectedOption}`;
          });

          if (connectionByHandle?.target) {
            execFn = connectionByHandle.target;
          } else if (
            Number.isFinite(selectedOptionAsNumber) &&
            selectedOptionAsNumber > 0 &&
            outgoingConnections.length >= selectedOptionAsNumber
          ) {
            // Fallback para fluxos antigos/importados sem sourceHandle:
            // usa a ordem das conexões do nó de menu.
            execFn = outgoingConnections[selectedOptionAsNumber - 1]?.target;
          } else {
            execFn = undefined;
          }
          if (execFn === undefined) {
            break;
          }
          pressKey = "999";
          const isNodeExist = nodes.filter(item => item.id === execFn);
          console.log(674, "menu");
          if (isNodeExist.length > 0) {
            isMenu = isNodeExist[0].type === "menu" ? true : false;
          } else {
            isMenu = false;
          }
        } else {
          console.log(681, "menu");
          let optionsMenu = "";
          nodeSelected.data.arrayOption.map(item => {
            optionsMenu += `[${item.number}] ${item.value}
`;
          });
          const menuCreate = `${nodeSelected.data.message}

${optionsMenu}`;
          const webhook = ticket?.dataWebhook;
          let msg;
          if (webhook && webhook.hasOwnProperty("variables")) {
            msg = {
              body: replaceMessages(webhook, menuCreate),
              number: numberClient,
              companyId: companyId
            };
          } else {
            msg = {
              body: menuCreate,
              number: numberClient,
              companyId: companyId
            };
          }
          const ticketDetails = await ShowTicketService(ticket.id, companyId);
          const messageData: MessageData = {
            wid: randomString(50),
            ticketId: ticket.id,
            body: msg.body,
            fromMe: true,
            read: true
          };
          await typeSimulation(ticket, "composing");

          await SendWhatsAppMessage({
            body: msg.body,
            ticket: ticketDetails,
            quotedMsg: null
          });
          SetTicketMessagesAsRead(ticketDetails);
          await ticketDetails.update({
            lastMessage: formatBody(msg.body, ticket.contact)
          });
          await intervalWhats("1");

          if (ticket) {
            ticket = await Ticket.findOne({
              where: {
                id: ticket.id,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          } else {
            ticket = await Ticket.findOne({
              where: {
                id: idTicket,
                whatsappId: whatsappId,
                companyId: companyId
              }
            });
          }

          if (ticket) {
            await ticket.update({
              queueId: ticket.queueId ? ticket.queueId : null,
              userId: null,
              companyId: companyId,
              flowWebhook: true,
              lastFlowId: nodeSelected.id,
              dataWebhook: dataWebhook,
              hashFlowId: hashWebhookId,
              flowStopped: idFlowDb.toString()
            });
            await scheduleFlowReengagement(
              companyId,
              idFlowDb,
              ticket.id,
              nodeSelected.id
            );
          }
          break;
        }
      }

      let isContinue = false;
      if (pressKey === "999" && execCount > 0) {
        console.log(587, "ActionsWebhookService | 587");
        pressKey = undefined;
        // Após escolher opção de menu, o próximo loop deve executar o nó
        // escolhido (execFn), e não pular direto para o próximo dele.
        if (!noAlterNext) {
          next = execFn || "";
        }
        execFn = "";
      } else {
        let result;
        if (execFn) {
          // Sempre prioriza o destino escolhido no menu (a1/a2/a3...),
          // independente do tipo do próximo nó.
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
          execFn = "";
        } else if (isMenu) {
          result = { target: execFn };
          isContinue = true;
          pressKey = undefined;
        } else if (isRandomizer) {
          isRandomizer = false;
          result = next;
        } else {
          result = connects.filter(connect => connect.source === next)[0];
        }
        if (typeof result === "undefined") {
          next = "";
        } else {
          if (!noAlterNext) {
            next = result.target;
          }
        }
        console.log(619, "ActionsWebhookService");
      }
      if (!pressKey && !isContinue) {
        const nextNode = connects.filter(
          connect => connect.source === nodeSelected.id
        ).length;
        console.log(626, "ActionsWebhookService");
        if (nextNode === 0) {
          console.log(654, "ActionsWebhookService");
          await Ticket.findOne({
            where: { id: idTicket, whatsappId, companyId: companyId }
          });
          await ticket.update({
            lastFlowId: nodeSelected.id,
            hashFlowId: null,
            flowWebhook: false,
            flowStopped: idFlowDb.toString()
          });
          break;
        }
      }
      isContinue = false;
      if (next === "") {
        break;
      }
      console.log(678, "ActionsWebhookService");
      console.log("UPDATE10...");
      ticket = await Ticket.findOne({
        where: { id: idTicket, whatsappId, companyId: companyId }
      });
      if (ticket.status === "closed") {
        io.of(String(companyId))
          .emit(`company-${ticket.companyId}-ticket`, {
            action: "delete",
            ticketId: ticket.id
          });
      }
      console.log("UPDATE12...");
      await ticket.update({
        whatsappId: whatsappId,
        queueId: ticket?.queueId,
        userId: null,
        companyId: companyId,
        flowWebhook: true,
        lastFlowId: nodeSelected.id,
        hashFlowId: hashWebhookId,
        flowStopped: idFlowDb.toString()
      });
      noAlterNext = false;
      execCount++;
    }
    return "ds";
  } catch (error) {
    logger.error(error);
  }
};

const constructJsonLine = (line: string, json: any) => {
  let valor = json;
  const chaves = line.split(".");
  if (chaves.length === 1) {
    return valor[chaves[0]];
  }
  for (const chave of chaves) {
    valor = valor[chave];
  }
  return valor;
};

function removerNaoLetrasNumeros(texto: string) {
  return texto.replace(/[^a-zA-Z0-9]/g, "");
}

const sendMessageWhats = async (
  whatsId: number,
  msg: any,
  req: Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>
) => {
  sendMessageFlow(whatsId, msg, req);
  return Promise.resolve();
};

const intervalWhats = (time: string) => {
  const seconds = parseInt(time) * 1000;
  return new Promise(resolve => setTimeout(resolve, seconds));
};

const replaceMessages = (variables, message) => {
  return message.replace(
    /{{\s*([^{}\s]+)\s*}}/g,
    (match, key) => variables[key] || ""
  );
};

const normalizeText = (value: string) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const resolveMenuSelection = (
  pressKey: string | undefined,
  nodeSelected: any
): string | undefined => {
  if (!pressKey) return undefined;

  const raw = String(pressKey).trim();
  if (!raw) return undefined;

  if (/^\d+$/.test(raw)) return raw;

  const numberMatch = raw.match(/\b(\d+)\b/);
  if (numberMatch?.[1]) return numberMatch[1];

  const options = nodeSelected?.data?.arrayOption || [];
  const normalizedRaw = normalizeText(raw);
  const byLabel = options.find(
    option => normalizeText(option?.value) === normalizedRaw
  );
  if (byLabel?.number !== undefined && byLabel?.number !== null) {
    return String(byLabel.number);
  }

  return undefined;
};

const replaceMessagesOld = (
  message: string,
  details: any,
  dataWebhook: any,
  dataNoWebhook?: any
) => {
  const matches = message.match(/\{([^}]+)\}/g);
  if (dataWebhook) {
    let newTxt = message.replace(/{+nome}+/, dataNoWebhook.nome);
    newTxt = newTxt.replace(/{+numero}+/, dataNoWebhook.numero);
    newTxt = newTxt.replace(/{+email}+/, dataNoWebhook.email);
    return newTxt;
  }
  if (matches && matches.includes("inputs")) {
    const placeholders = matches.map(match => match.replace(/\{|\}/g, ""));
    let newText = message;
    placeholders.map(item => {
      const value = details["inputs"].find(
        itemLocal => itemLocal.keyValue === item
      );
      const lineToData = details["keysFull"].find(itemLocal =>
        itemLocal.endsWith(`.${value.data}`)
      );
      const createFieldJson = constructJsonLine(lineToData, dataWebhook);
      newText = newText.replace(`{${item}}`, createFieldJson);
    });
    return newText;
  } else {
    return message;
  }
};
