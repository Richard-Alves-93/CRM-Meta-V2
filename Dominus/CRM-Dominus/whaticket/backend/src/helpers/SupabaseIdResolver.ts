import { supabase } from "../libs/supabaseClient";

export const getWhatsappUuid = async (legacyId: number | string): Promise<string> => {
  if (typeof legacyId === "string" && legacyId.includes("-")) {
    return legacyId;
  }
  const { data, error } = await supabase
    .from("whatsapps")
    .select("id")
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Whatsapp with legacy_id ${legacyId} not found in Supabase`);
  }
  return data.id;
};


export const getCompanyUuid = async (legacyId: number | string): Promise<string> => {
  if (typeof legacyId === "string" && legacyId.includes("-")) {
    return legacyId;
  }
  const { data, error } = await supabase
    .from("companies")
    .select("id")
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Company with legacy_id ${legacyId} not found in Supabase`);
  }
  return data.id;
};

export const getUserUuid = async (legacyId: number | string): Promise<string> => {
  if (typeof legacyId === "string" && legacyId.includes("-")) {
    return legacyId;
  }
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`User with legacy_id ${legacyId} not found in Supabase`);
  }
  return data.id;
};

export const getTicketUuid = async (legacyId: number | string): Promise<string> => {
  if (typeof legacyId === "string" && legacyId.includes("-")) {
    return legacyId;
  }
  const { data, error } = await supabase
    .from("tickets")
    .select("id")
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Ticket with legacy_id ${legacyId} not found in Supabase`);
  }
  return data.id;
};

export const getContactUuid = async (legacyId: number | string): Promise<string> => {
  if (typeof legacyId === "string" && legacyId.includes("-")) {
    return legacyId;
  }
  const { data, error } = await supabase
    .from("contacts")
    .select("id")
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Contact with legacy_id ${legacyId} not found in Supabase`);
  }
  return data.id;
};

export const getQueueUuid = async (legacyId: number | string): Promise<string> => {
  if (typeof legacyId === "string" && legacyId.includes("-")) {
    return legacyId;
  }
  const { data, error } = await supabase
    .from("queues")
    .select("id")
    .eq("legacy_id", legacyId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Queue with legacy_id ${legacyId} not found in Supabase`);
  }
  return data.id;
};

export const getLegacyCompanyId = async (uuid: string): Promise<number> => {
  const { data, error } = await supabase
    .from("companies")
    .select("legacy_id")
    .eq("id", uuid)
    .maybeSingle();

  if (error || !data) return null;
  return data.legacy_id;
};

export const getLegacyUserId = async (uuid: string): Promise<number> => {
  const { data, error } = await supabase
    .from("users")
    .select("legacy_id")
    .eq("id", uuid)
    .maybeSingle();

  if (error || !data) return null;
  return data.legacy_id;
};
