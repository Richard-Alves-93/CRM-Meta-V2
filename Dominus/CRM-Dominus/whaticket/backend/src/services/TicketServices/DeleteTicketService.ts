import { supabase } from "../../libs/supabaseClient";

const DeleteTicketService = async (id: string | number, companyId: string | number): Promise<any> => {
  const { data: ticket, error: fetchError } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .eq("company_id", companyId)
    .single();

  if (fetchError || !ticket) {
    return { error: { message: "ERR_NO_TICKET_FOUND" } };
  }

  const { error: deleteError } = await supabase
    .from("tickets")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return { error: { message: deleteError.message } };
  }

  return ticket;
};

export default DeleteTicketService;
