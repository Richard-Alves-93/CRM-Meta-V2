import { supabase } from "../../libs/supabaseClient";
import removeAccents from "remove-accents";
import { getCompanyUuid, getUserUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  companyId: number | string;
  tagsIds?: number[];
  isGroup?: string;
  userId?: number | string;
  profile?: string;
  canViewAllContacts?: boolean;
}

interface Response {
  contacts: any[];
  count: number;
  hasMore: boolean;
}

const ListContactsService = async ({ 
  searchParam = "",
  pageNumber = "1",
  companyId,
  tagsIds,
  isGroup,
  userId,
  profile,
  canViewAllContacts
}: Request): Promise<Response> => {
  const companyUuid = await getCompanyUuid(companyId);
  const limit = 100;
  const offset = limit * (+pageNumber - 1);

  let query = supabase
    .from('contacts')
    .select(`
      id, name, number, email, is_group, profile_pic_url, active, company_id, channel, url_picture,
      tags:contact_custom_fields!left(id, name)
    `, { count: 'exact' })
    .eq('company_id', companyUuid);

  // Lógica de restrição de contatos para usuários não-admin
  if (!(profile === "admin" || canViewAllContacts) && userId) {
    const userUuid = await getUserUuid(userId);
    const { data: tickets } = await supabase
      .from('tickets')
      .select('contact_id')
      .eq('user_id', userUuid);
      
    if (tickets && tickets.length > 0) {
      const contactIds = Array.from(new Set(tickets.map(t => t.contact_id)));
      query = query.in('id', contactIds);
    } else {
      // Se o usuário não tem tickets, não deve ver nenhum contato
      return { contacts: [], count: 0, hasMore: false };
    }
  }

  // Filtro de Tags
  if (Array.isArray(tagsIds) && tagsIds.length > 0) {
    const { data: contactTags } = await supabase
      .from('contact_tags')
      .select('contact_id')
      .in('tag_id', tagsIds);

    if (contactTags && contactTags.length > 0) {
      const contactIdsWithTags = Array.from(new Set(contactTags.map(t => t.contact_id)));
      query = query.in('id', contactIdsWithTags);
    } else {
      return { contacts: [], count: 0, hasMore: false };
    }
  }

  if (isGroup === "false") {
    query = query.eq('is_group', false);
  }

  if (searchParam) {
    const sanitizedSearchParam = removeAccents(searchParam.toLocaleLowerCase().trim());
    query = query.or(`name.ilike.%${sanitizedSearchParam}%,number.ilike.%${sanitizedSearchParam}%`);
  }

  query = query
    .order('name', { ascending: true })
    .range(offset, offset + limit - 1);

  const { data: contacts, count, error } = await query;

  if (error) {
    console.error("Error listing contacts from Supabase:", error);
    throw new Error("Failed to list contacts");
  }

  // Formatação para compatibilidade legada
  const formattedContacts = contacts.map(contact => ({
    ...contact,
    companyId: contact.company_id,
    profilePicUrl: contact.profile_pic_url,
    isGroup: contact.is_group,
    urlPicture: contact.url_picture
  }));

  const hasMore = (count || 0) > offset + contacts.length;

  return {
    contacts: formattedContacts,
    count: count || 0,
    hasMore
  };
};

export default ListContactsService;