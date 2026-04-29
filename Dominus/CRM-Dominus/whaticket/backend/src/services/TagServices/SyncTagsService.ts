import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

interface Request {
  tags: any[];
  contactId: number | string;
}

const SyncTags = async ({
  tags,
  contactId
}: Request): Promise<any | null> => {
  // Deleta todas as tags antigas do contato
  const { error: deleteError } = await supabase
    .from("contact_tags")
    .delete()
    .eq("contact_id", contactId);

  if (deleteError) {
    console.error("Erro ao deletar tags antigas:", deleteError);
    throw new AppError("Erro ao sincronizar tags");
  }

  // Se tem tags pra inserir, insere
  if (tags && tags.length > 0) {
    const tagList = tags.map(t => ({ 
      tag_id: t.id, 
      contact_id: contactId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from("contact_tags")
      .insert(tagList);

    if (insertError) {
      console.error("Erro ao inserir novas tags:", insertError);
      throw new AppError("Erro ao sincronizar tags");
    }
  }

  // Retorna o contato atualizado com suas tags
  const { data: contact } = await supabase
    .from("contacts")
    .select(`
      *,
      tags:contact_tags(tag:tags(*))
    `)
    .eq("id", contactId)
    .maybeSingle();

  if (!contact) return null;

  return {
    ...contact,
    companyId: contact.company_id,
    profilePicUrl: contact.profile_pic_url,
    isGroup: contact.is_group,
    createdAt: contact.created_at,
    updatedAt: contact.updated_at,
    tags: contact.tags ? contact.tags.map((ct: any) => ct.tag) : []
  };
};

export default SyncTags;
