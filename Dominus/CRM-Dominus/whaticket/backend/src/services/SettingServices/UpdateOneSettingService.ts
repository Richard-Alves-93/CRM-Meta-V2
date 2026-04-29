import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";

interface Request {
    key: string;
    value: string;
}

const UpdateOneSettingService = async ({
    key,
    value
}: Request): Promise<any | undefined> => {
    
    // Tenta atualizar primeiro
    const { data: updatedData, error: updateError } = await supabase
        .from("settings")
        .update({ value, updated_at: new Date().toISOString() })
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

    // Se não atualizou (não existia), insere
    const { data: insertedData, error: insertError } = await supabase
        .from("settings")
        .insert({
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

export default UpdateOneSettingService;