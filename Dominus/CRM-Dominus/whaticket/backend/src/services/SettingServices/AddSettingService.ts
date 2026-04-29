import { supabase } from "../../libs/supabaseClient";

const AddSettingService = async () => {
    try {
        const newSetting = {
            key: "wtV",
            value: "disabled",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            // company_id is omitted or null if it's a global setting
        };
        await supabase.from("settings").insert(newSetting);
    } catch (error) {
        console.log(error);
    }
};

export default AddSettingService;