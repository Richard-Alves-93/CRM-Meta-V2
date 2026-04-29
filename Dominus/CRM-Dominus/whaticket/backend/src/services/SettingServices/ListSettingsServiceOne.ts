import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
    companyId: number | string;
    key?: string;
}

const ListSettingsServiceOne = async ({
    companyId,
    key
}: Request): Promise<any | undefined> => {
    const companyUuid = await getCompanyUuid(companyId);

    let query = supabase
        .from("settings")
        .select("*")
        .eq("company_id", companyUuid);

    if (key) {
        query = query.eq("key", key);
    }

    const { data: setting, error } = await query.maybeSingle();

    if (error || !setting) {
        return undefined;
    }

    return {
        ...setting,
        companyId: setting.company_id,
        createdAt: setting.created_at,
        updatedAt: setting.updated_at
    };
};

export default ListSettingsServiceOne;