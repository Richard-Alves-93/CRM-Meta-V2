import { supabase } from "../../libs/supabaseClient";

interface Request {
    key: string;
}

const GetSettingService = async ({
    key
}: Request): Promise<any | undefined> => {

    const { data: setting } = await supabase
        .from("settings")
        .select("*")
        .eq("key", key)
        .maybeSingle();

    if (!setting) {
        return "enabled";
    }

    // Retornamos mapeado para o estilo legado (caso esperem um objeto Sequelize)
    // Se a aplicação espera apenas "enabled", ela poderia quebrar se for um objeto. 
    // O código antigo retorna `setting` (o model) se for != null.
    return {
        ...setting,
        companyId: setting.company_id,
        createdAt: setting.created_at,
        updatedAt: setting.updated_at
    };
};

export default GetSettingService;