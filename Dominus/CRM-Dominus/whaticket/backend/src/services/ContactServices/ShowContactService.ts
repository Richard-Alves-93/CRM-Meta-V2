import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

const ShowContactService = async (
  id: string | number,
  companyId: number | string
): Promise<any> => {
  const { data: contact, error } = await supabase
    .from("contacts")
    .select(`
      *,
      extraInfo:contact_custom_fields(*)
    `)
    .eq("id", id)
    .single();

  if (error || !contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  // Validação Multi-tenant
  if (String(contact.company_id) !== String(companyId)) {
    throw new AppError("Não é possível exibir registro de outra empresa", 403);
  }

  // Formatação para compatibilidade
  const formattedContact = {
    ...contact,
    companyId: contact.company_id,
    profilePicUrl: contact.profile_pic_url,
    isGroup: contact.is_group
  };

  return formattedContact;
};

export default ShowContactService;

