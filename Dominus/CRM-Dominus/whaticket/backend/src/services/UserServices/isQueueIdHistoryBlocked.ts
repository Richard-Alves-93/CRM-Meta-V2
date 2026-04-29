import { supabase } from "../../libs/supabaseClient";
import AppError from "../../errors/AppError";

interface Request {
  userRequest?: string | number;
}

const isQueueIdHistoryBlocked = async ({
  userRequest
}: Request): Promise<boolean> => {
  if (!userRequest) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("all_historic")
    .eq("id", userRequest)
    .single();

  if (error || !user) {
    throw new AppError("ERR_NO_USER_FOUND", 404);
  }

  return user.all_historic === "enabled";
};

export default isQueueIdHistoryBlocked;