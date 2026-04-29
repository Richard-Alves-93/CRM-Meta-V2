import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";

const TagService = async (id: string | number): Promise<any> => {
  // Supabase doesn't natively map Sequelize's "include: ['contacts']" implicitly without explicit joined tables.
  // We'll fetch the tag. If contacts are needed, they would be fetched via contact_tags.
  const { data: tag, error } = await supabase
    .from("tags")
    .select(`
      *,
      contacts:contact_tags(contact:contacts(*))
    `)
    .eq("id", id)
    .maybeSingle();

  if (error || !tag) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  // Aplainando a lista de contatos para o padrão legado (tag.contacts)
  const formattedContacts = tag.contacts ? tag.contacts.map((ct: any) => ct.contact) : [];

  return {
    ...tag,
    companyId: tag.company_id,
    timeLane: tag.time_lane,
    nextLaneId: tag.next_lane_id,
    greetingMessageLane: tag.greeting_message_lane,
    rollbackLaneId: tag.rollback_lane_id,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at,
    contacts: formattedContacts
  };
};

export default TagService;
