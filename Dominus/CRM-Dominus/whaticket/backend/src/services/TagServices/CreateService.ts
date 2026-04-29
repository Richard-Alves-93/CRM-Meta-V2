import * as Yup from "yup";

import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  name: string;
  color: string;
  kanban: string | number;
  companyId: number | string;
  timeLane?: number;
  nextLaneId?: number;
  greetingMessageLane?: string;
  rollbackLaneId?: number;
}

const CreateService = async ({
  name,
  color = "#A4CCCC",
  kanban,
  companyId,
  timeLane = null,
  nextLaneId = null,
  greetingMessageLane = "",
  rollbackLaneId = null
}: Request): Promise<any> => {
  const schema = Yup.object().shape({
    name: Yup.string().required().min(3)
  });

  try {
    await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const companyUuid = await getCompanyUuid(companyId);

  // Busca se já existe uma tag com esses dados (findOrCreate)
  let { data: tag, error: fetchError } = await supabase
    .from("tags")
    .select("*")
    .eq("name", name)
    .eq("color", color)
    .eq("kanban", kanban)
    .eq("company_id", companyUuid)
    .maybeSingle();

  if (!tag) {
    // Insere
    const { data: newTag, error: insertError } = await supabase
      .from("tags")
      .insert({
        name,
        color,
        kanban: kanban ? 1 : 0, // Kanban usa tinyint no banco legado, Supabase usa 1/0 ou bool, adaptamos para manter compat
        company_id: companyUuid,
        time_lane: timeLane,
        next_lane_id: String(nextLaneId) === "" ? null : nextLaneId,
        greeting_message_lane: greetingMessageLane,
        rollback_lane_id: String(rollbackLaneId) === "" ? null : rollbackLaneId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select("*")
      .single();

    if (insertError || !newTag) {
      throw new AppError("Erro ao criar tag no Supabase");
    }
    tag = newTag;
  }

  return {
    ...tag,
    companyId: tag.company_id,
    timeLane: tag.time_lane,
    nextLaneId: tag.next_lane_id,
    greetingMessageLane: tag.greeting_message_lane,
    rollbackLaneId: tag.rollback_lane_id,
    createdAt: tag.created_at,
    updatedAt: tag.updated_at
  };
};

export default CreateService;
