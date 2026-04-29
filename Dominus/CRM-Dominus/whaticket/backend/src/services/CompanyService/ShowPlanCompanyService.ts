import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

const ShowPlanCompanyService = async (id: string | number): Promise<any> => {
    const companyUuid = await getCompanyUuid(id);

    const { data: company, error } = await supabase
        .from("companies")
        .select(`
            id, name, email, status, dueDate:due_date, createdAt:created_at, phone, document, lastLogin:last_login,
            plan:plans(
                id,
                name,
                users,
                connections,
                queues,
                amount,
                useWhatsapp:use_whatsapp,
                useFacebook:use_facebook,
                useInstagram:use_instagram,
                useCampaigns:use_campaigns,
                useSchedules:use_schedules,
                useInternalChat:use_internal_chat,
                useExternalApi:use_external_api,
                useKanban:use_kanban,
                useOpenAi:use_openai,
                useIntegrations:use_integrations
            )
        `)
        .eq("id", companyUuid)
        .maybeSingle();

    if (error || !company) {
        return null;
    }

    return company;
};

export default ShowPlanCompanyService;
