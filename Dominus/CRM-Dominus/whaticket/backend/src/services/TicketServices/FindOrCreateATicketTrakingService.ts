import { supabase } from "../../libs/supabaseClient";

interface Params {
  ticketId: string | number;
  companyId: string | number;
  whatsappId?: string | number;
  userId?: string | number;
}

const FindOrCreateATicketTrakingService = async ({
  ticketId,
  companyId,
  whatsappId,
  userId
}: Params): Promise<any> => {
  // 1. Buscar tracking aberto no Supabase
  const { data: ticketTraking, error } = await supabase
    .from("ticket_trackings")
    .select("*")
    .eq("ticket_id", ticketId)
    .is("finished_at", null)
    .maybeSingle();

  if (ticketTraking) {
     return {
       ...ticketTraking,
       ticketId: ticketTraking.ticket_id,
       companyId: ticketTraking.company_id
     };
  }

  // 2. Criar novo tracking
  const { data: newRecord, error: createError } = await supabase
    .from("ticket_trackings")
    .insert({
      ticket_id: ticketId,
      company_id: companyId,
      whatsapp_id: whatsappId,
      user_id: userId,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createError || !newRecord) {
    console.error("❌ Erro ao criar TicketTraking no Supabase:", createError?.message);
    return null;
  }

  return {
    ...newRecord,
    ticketId: newRecord.ticket_id,
    companyId: newRecord.company_id
  };
};

export default FindOrCreateATicketTrakingService;