import { Op } from "sequelize";
import Chat from "../../models/Chat";
import ChatMessage from "../../models/ChatMessage";
import ChatUser from "../../models/ChatUser";
import User from "../../models/User";

export interface ChatMessageData {
  senderId: number | string;
  chatId: number | string;
  message: string;
  mediaPath?: string;
  mediaName?: string;
  mediaType?: string;
  quotedMsgId?: number | string;
}

export default async function CreateMessageService({
  senderId,
  chatId,
  message,
  mediaPath,
  mediaName,
  mediaType,
  quotedMsgId
}: ChatMessageData) {
  const newMessage = await ChatMessage.create({
    senderId,
    chatId,
    message,
    mediaPath,
    mediaName,
    mediaType,
    quotedMsgId
  });

  await newMessage.reload({
    include: [
      { model: User, as: "sender", attributes: ["id", "name"] },
      {
        model: Chat,
        as: "chat",
        include: [{ model: ChatUser, as: "users" }]
      },
      {
        model: ChatMessage,
        as: "quotedMsg",
        include: [{ model: User, as: "sender", attributes: ["id", "name"] }]
      }
    ]
  });

  const sender = await User.findByPk(senderId);

  let lastMessageText = `${sender.name}: ${message}`;
  if (!message && mediaType && mediaType.includes("audio")) {
    lastMessageText = `${sender.name}: [Áudio]`;
  } else if (!message && mediaPath) {
    lastMessageText = `${sender.name}: [Arquivo ${mediaName || ""}]`;
  }

  await newMessage.chat.update({ lastMessage: lastMessageText });

  const chatUsers = await ChatUser.findAll({
    where: { chatId }
  });

  for (let chatUser of chatUsers) {
    if (String(chatUser.userId) === String(senderId)) {
      await chatUser.update({ unreads: 0 });
    } else {
      await chatUser.update({ unreads: chatUser.unreads + 1 });
    }
  }

  return newMessage;
}
