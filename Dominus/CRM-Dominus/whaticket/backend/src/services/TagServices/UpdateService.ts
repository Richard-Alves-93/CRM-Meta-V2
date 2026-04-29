import * as Yup from "yup";

import AppError from "../../errors/AppError";
import ShowService from "./ShowService";
import { supabase } from "../../libs/supabaseClient";

interface TagData {
  id?: number | string;
  name?: string;
  color?: string;
  kanban?: number;
  timeLane?: number;
  nextLaneId?: number;
  greetingMessageLane: string;
  rollbackLaneId?: number;
}

interface Request {
  tagData: TagData;
  id: string | number;
}

const UpdateUserService = async ({
  tagData,
  id
}: Request): Promise<any | undefined> => {
  // Ensure it exists
  await ShowService(id);

  const schema = Yup.object().shape({
    name: Yup.string().min(3)
  });

  const { name, color, kanban,
    timeLane,
    nextLaneId = null,
    greetingMessageLane,
    rollbackLaneId = null} = tagData;

  try {
    if (name) await schema.validate({ name });
  } catch (err: any) {
    throw new AppError(err.message);
  }

  const updatePayload: any = {
    updated_at: new Date().toISOString()
  };

  if (name !== undefined) updatePayload.name = name;
  if (color !== undefined) updatePayload.color = color;
  if (kanban !== undefined) updatePayload.kanban = kanban;
  if (timeLane !== undefined) updatePayload.time_lane = timeLane;
  if (nextLaneId !== undefined) updatePayload.next_lane_id = String(nextLaneId) === "" ? null : nextLaneId;
  if (greetingMessageLane !== undefined) updatePayload.greeting_message_lane = greetingMessageLane;
  if (rollbackLaneId !== undefined) updatePayload.rollback_lane_id = String(rollbackLaneId) === "" ? null : rollbackLaneId;

  const { error } = await supabase
    .from("tags")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    throw new AppError("Erro ao atualizar a Tag no Supabase");
  }

  return await ShowService(id);
};

export default UpdateUserService;
