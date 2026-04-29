import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
    companyId: number | string;
    startDate: string;
    lastDate: string;
}

const GetMessageRangeService = async ({ companyId, startDate, lastDate }: Request): Promise<any[]> => {
    const companyUuid = await getCompanyUuid(companyId);

    const { data: messages, error } = await supabase
        .from("messages")
        .select("*")
        .eq("company_id", companyUuid)
        .gte("created_at", `${startDate} 00:00:00`)
        .lte("created_at", `${lastDate} 23:59:59`);

    if (error || !messages) {
        throw new AppError("MESSAGES_NOT_FIND");
    }

    const formattedMessages = messages.map((m: any) => ({
        ...m,
        companyId: m.company_id,
        contactId: m.contact_id,
        ticketId: m.ticket_id,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        mediaUrl: m.media_url,
        mediaType: m.media_type
    }));

    return formattedMessages;
};

export default GetMessageRangeService;