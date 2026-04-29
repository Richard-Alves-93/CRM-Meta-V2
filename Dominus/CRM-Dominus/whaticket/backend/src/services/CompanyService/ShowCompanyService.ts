import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

const ShowCompanyService = async (id: string | number): Promise<any> => {
  const { data: company, error } = await supabase
    .from("companies")
    .select("*, plan:plans(*)")
    .eq("id", id)
    .maybeSingle();
  
  if (error || !company) {
    throw new AppError("ERR_NO_COMPANY_FOUND", 404);
  }

  // Format to camelCase for legacy compatibility
  return {
    ...company,
    planId: company.plan_id
  };
};

export default ShowCompanyService;
