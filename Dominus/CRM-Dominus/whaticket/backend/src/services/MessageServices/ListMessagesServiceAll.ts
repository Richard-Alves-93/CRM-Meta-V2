import { supabase } from "../../libs/supabaseClient";

interface Request {
  companyId: number | string;
  fromMe?: string | boolean;
  dateStart?: string;
  dateEnd?: string;
}

interface Response {
  count: number;
}

const ListMessagesServiceAll = async ({
  companyId,
  fromMe,
  dateStart,
  dateEnd
}: Request): Promise<Response> => {

  let query = supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("company_id", companyId);

  if (fromMe !== undefined && fromMe !== "") {
    const isFromMe = fromMe === "true" || fromMe === true;
    query = query.eq("from_me", isFromMe);
  }

  if (dateStart && dateEnd) {
    query = query
      .gte("created_at", `${dateStart}T00:00:00.000Z`)
      .lte("created_at", `${dateEnd}T23:59:59.999Z`);
  }

  const { count, error } = await query;

  if (error) {
    console.error("❌ Erro ao contar mensagens no Supabase:", error.message);
    return { count: 0 };
  }

  return {
    count: count || 0,
  };
};

export default ListMessagesServiceAll;

