import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

const ShowPlanService = async (id: string | number): Promise<any> => {
  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !plan) {
    throw new AppError("ERR_NO_PLAN_FOUND", 404);
  }

  return plan;
};

export default ShowPlanService;
