// @ts-nocheck
import { supabase } from "../../libs/supabaseClient";
import { getIO } from "../../libs/socket";
import UpdateTicketService from "../TicketServices/UpdateTicketService";
import ShowMessageService from "../MessageServices/ShowMessageService";

const MarkDeleteWhatsAppMessage = async (from: any, timestamp?: any, msgId?: string, companyId?: number): Promise<any> => {

    if (msgId) {
        // 1. Buscar mensagem no Supabase
        const messageToUpdate = await ShowMessageService(msgId);

        if (messageToUpdate && String(messageToUpdate.companyId) === String(companyId)) {
            
            // 2. Atualizar no Supabase
            await supabase
                .from("messages")
                .update({ body: "🚫 _Mensagem Apagada_", is_deleted: true })
                .eq("id", messageToUpdate.id);

            // 3. Atualizar Ticket
            await UpdateTicketService({ 
                ticketData: { lastMessage: "🚫 _Mensagem Apagada_" }, 
                ticketId: messageToUpdate.ticketId, 
                companyId 
            });

            const io = getIO();
            io.of(String(companyId))
                .emit(`company-${companyId}-appMessage`, {
                    action: "update",
                    message: { ...messageToUpdate, body: "🚫 _Mensagem Apagada_", isDeleted: true }
                });
        }

        return timestamp;
    }
}

export default MarkDeleteWhatsAppMessage;