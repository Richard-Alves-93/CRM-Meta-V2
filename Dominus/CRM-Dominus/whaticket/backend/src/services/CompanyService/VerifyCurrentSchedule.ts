import { supabase } from "../../libs/supabaseClient";
import moment from "moment";

type Result = {
  id: number | string;
  currentSchedule: any;
  startTimeA: string;
  endTimeA: string;
  startTimeB: string;
  endTimeB: string;
  inActivity: boolean;
};

const VerifyCurrentSchedule = async (companyId?: number | string, queueId?: number | string, whatsappId?: number | string): Promise<Result> => {
  let schedules: any[] = [];
  let recordId: number | string = 0;

  if (Number(whatsappId) > 0 && (queueId === 0 || !queueId)) {
    const { data } = await supabase
      .from("whatsapps")
      .select("id, schedules")
      .eq("id", whatsappId)
      .eq("company_id", companyId)
      .maybeSingle();
    
    if (data) {
      schedules = data.schedules || [];
      recordId = data.id;
    }
  } else if ((!queueId || Number(queueId) === 0) && (!whatsappId || Number(whatsappId) === 0)) {
    const { data } = await supabase
      .from("companies")
      .select("id, schedules")
      .eq("id", companyId)
      .maybeSingle();
    
    if (data) {
      schedules = data.schedules || [];
      recordId = data.id;
    }
  } else {
    const { data } = await supabase
      .from("queues")
      .select("id, schedules")
      .eq("id", queueId)
      .eq("company_id", companyId)
      .maybeSingle();
    
    if (data) {
      schedules = data.schedules || [];
      recordId = data.id;
    }
  }

  const currentWeekday = moment().format("dddd").toLowerCase();
  const todaySchedule = schedules.find(s => s.weekdayEn?.toLowerCase() === currentWeekday || s.weekday?.toLowerCase() === currentWeekday);

  if (!todaySchedule) {
    return {
      id: recordId,
      currentSchedule: null,
      startTimeA: "",
      endTimeA: "",
      startTimeB: "",
      endTimeB: "",
      inActivity: false
    };
  }

  const now = moment();
  const currentTime = now.format("HH:mm");

  const isBetween = (start: string, end: string) => {
    if (!start || !end) return false;
    return currentTime >= start && currentTime <= end;
  };

  const inActivity = isBetween(todaySchedule.startTimeA, todaySchedule.endTimeA) || 
                     isBetween(todaySchedule.startTimeB, todaySchedule.endTimeB);

  return {
    id: recordId,
    currentSchedule: todaySchedule,
    startTimeA: todaySchedule.startTimeA || "",
    endTimeA: todaySchedule.endTimeA || "",
    startTimeB: todaySchedule.startTimeB || "",
    endTimeB: todaySchedule.endTimeB || "",
    inActivity
  };
};

export default VerifyCurrentSchedule;
