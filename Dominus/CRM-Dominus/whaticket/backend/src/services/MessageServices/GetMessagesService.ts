import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";

interface Request {
  id: string;
}

const GetMessageService = async ({ id }: Request): Promise<any> => {
  const { data: messageExists, error } = await supabase
    .from("messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !messageExists) {
    throw new AppError("MESSAGE_NOT_FIND");
  }

  // Format for compatibility
  return {
    ...messageExists,
    ticketId: messageExists.ticket_id,
    contactId: messageExists.contact_id,
    companyId: messageExists.company_id,
    createdAt: messageExists.created_at,
    updatedAt: messageExists.updated_at,
    mediaUrl: messageExists.media_url,
    mediaType: messageExists.media_type,
    isDeleted: messageExists.is_deleted,
    isEdited: messageExists.is_edited
  };
};

export default GetMessageService;
