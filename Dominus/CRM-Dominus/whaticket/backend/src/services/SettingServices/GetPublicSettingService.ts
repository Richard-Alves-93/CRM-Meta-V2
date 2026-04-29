import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface Request {
  key: string;
}

const publicSettingsKeys = [
  "allowSignup",
  "primaryColorLight",
  "primaryColorDark",
  "appLogoLight",
  "appLogoDark",
  "appLogoFavicon",
  "appName"
]

const GetPublicSettingService = async ({
  key
}: Request): Promise<string | undefined | null> => {
  
  if (!publicSettingsKeys.includes(key)) {
    return null;
  }
  
  try {
    const companyUuid = await getCompanyUuid(1);

    const { data: setting, error } = await supabase
      .from("settings")
      .select("value")
      .eq("company_id", companyUuid)
      .eq("key", key)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar setting pública:", error.message);
      return null;
    }

    return setting?.value;
  } catch (error) {
    console.error("Exceção em GetPublicSettingService:", error);
    return null;
  }
};

export default GetPublicSettingService;
