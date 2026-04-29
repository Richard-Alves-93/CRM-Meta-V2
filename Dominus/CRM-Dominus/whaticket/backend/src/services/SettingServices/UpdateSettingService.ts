import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  key: string;
  value: string;
  companyId: number | string;
}

const UpdateSettingService = async ({
  key,
  value,
  companyId
}: Request): Promise<any | undefined> => {
  const companyUuid = await getCompanyUuid(companyId);

  // Tenta atualizar primeiro
  const { data: updatedData, error: updateError } = await supabase
    .from("settings")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("company_id", companyUuid)
    .eq("key", key)
    .select()
    .maybeSingle();

  if (updatedData) {
    return {
      ...updatedData,
      companyId: updatedData.company_id,
      createdAt: updatedData.created_at,
      updatedAt: updatedData.updated_at
    };
  }

  // Se não atualizou, insere
  const { data: insertedData, error: insertError } = await supabase
    .from("settings")
    .insert({
      company_id: companyUuid,
      key,
      value,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .maybeSingle();

  if (insertError || !insertedData) {
    throw new AppError("ERR_NO_SETTING_FOUND", 404);
  }

  return {
    ...insertedData,
    companyId: insertedData.company_id,
    createdAt: insertedData.created_at,
    updatedAt: insertedData.updated_at
  };
};

export default UpdateSettingService;
