import { getIO } from "../../libs/socket";
import fs from "fs";
import path, { join } from "path";
import logger from "../../utils/logger";
import { isNil } from "lodash";
import * as Sentry from "@sentry/node";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid, getWhatsappUuid } from "../../helpers/SupabaseIdResolver";

const axios = require('axios');

interface ExtraInfo {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number | string;
  channel?: string;
  extraInfo?: ExtraInfo[];
  remoteJid?: string;
  whatsappId?: number | string;
  wbot?: any;
}

const downloadProfileImage = async ({
  profilePicUrl,
  companyId,
}: { profilePicUrl?: string, companyId: string | number }) => {
  const isValidHttpUrl = (value?: string): boolean => {
    if (!value || typeof value !== "string") return false;
    try {
      const parsed = new URL(value);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (!isValidHttpUrl(profilePicUrl)) {
    return null;
  }

  const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
  let filename;

  const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
    fs.chmodSync(folder, 0o777);
  }

  try {
    const response = await axios.get(profilePicUrl, {
      responseType: 'arraybuffer',
      timeout: 2000
    });

    filename = `${new Date().getTime()}.jpeg`;
    fs.writeFileSync(join(folder, filename), response.data);

  } catch (error) {
    console.error("Failed to download profile image:", error);
  }

  return filename;
}

const CreateOrUpdateContactService = async ({
  name,
  number: rawNumber,
  profilePicUrl,
  isGroup,
  email = "",
  channel = "whatsapp",
  companyId,
  extraInfo = [],
  remoteJid = "",
  whatsappId,
  wbot
}: Request): Promise<any> => {
  try {
    let createContact = false;
    const publicFolder = path.resolve(__dirname, "..", "..", "..", "public");
    const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");
    const io = getIO();
    
    const companyUuid = await getCompanyUuid(companyId);
    let resolvedWhatsappId = whatsappId;
    if (whatsappId && !String(whatsappId).includes("-")) {
       try { resolvedWhatsappId = await getWhatsappUuid(whatsappId); } catch(e) { /* ignore */ }
    }

    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("number", number)
      .eq("company_id", companyUuid)
      .maybeSingle();

    let updateImage = (!contact || contact?.profile_pic_url !== profilePicUrl && profilePicUrl !== "") && wbot || false;

    let finalContactData: any = {};

    if (contact) {
      finalContactData = {
        remote_jid: remoteJid || contact.remote_jid,
        profile_pic_url: profilePicUrl || contact.profile_pic_url,
        is_group: isGroup
      };

      if (isNil(contact.whatsapp_id) && resolvedWhatsappId) {
        const { data: whatsapp } = await supabase
          .from("whatsapps")
          .select("id")
          .eq("id", resolvedWhatsappId)
          .eq("company_id", companyUuid)
          .maybeSingle();

        if (whatsapp) {
          finalContactData.whatsapp_id = resolvedWhatsappId;
        }
      }

      const folder = path.resolve(publicFolder, `company${companyId}`, "contacts");
      let fileName, oldPath = "";
      if (contact.url_picture) {
        oldPath = path.resolve(contact.url_picture.replace(/\\/g, '/'));
        fileName = path.join(folder, oldPath.split('\\').pop() || "");
      }

      if (!fileName || !fs.existsSync(fileName) || contact.profile_pic_url === "") {
        if (!contact.profile_pic_url) {
          finalContactData.profile_pic_url = `${process.env.FRONTEND_URL}/nopicture.png`;
        }
      }

      if (contact.name === number) {
        finalContactData.name = name;
      }

      const { data: updatedContact, error: updateError } = await supabase
        .from("contacts")
        .update(finalContactData)
        .eq("id", contact.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      finalContactData = updatedContact;

    } else if (wbot && ['whatsapp'].includes(channel)) {
      const { data: settings } = await supabase
        .from("companies_settings")
        .select("acceptAudioMessageContact")
        .eq("company_id", companyUuid)
        .maybeSingle();
        
      const acceptAudioMessageContact = settings?.acceptAudioMessageContact;
      let newRemoteJid = remoteJid;

      if (!remoteJid && remoteJid !== "") {
        newRemoteJid = isGroup ? `${rawNumber}@g.us` : `${rawNumber}@s.whatsapp.net`;
      }

      try {
        const profilePicPromise = wbot.profilePictureUrl(newRemoteJid, "image");
        const timeoutPromise = new Promise<string>(resolve =>
          setTimeout(() => resolve(""), 800)
        );
        profilePicUrl =
          ((await Promise.race([profilePicPromise, timeoutPromise])) as string) ||
          `${process.env.FRONTEND_URL}/nopicture.png`;
      } catch (e) {
        Sentry.captureException(e);
        profilePicUrl = `${process.env.FRONTEND_URL}/nopicture.png`;
      }

      const { data: newContact, error: createError } = await supabase
        .from("contacts")
        .insert({
          name,
          number,
          email,
          is_group: isGroup,
          company_id: companyUuid,
          channel,
          accept_audio_message: acceptAudioMessageContact === 'enabled' ? true : false,
          remote_jid: newRemoteJid,
          profile_pic_url: profilePicUrl,
          url_picture: "",
          whatsapp_id: resolvedWhatsappId || null
        })
        .select()
        .single();

      if (createError) throw createError;
      finalContactData = newContact;
      createContact = true;
      
    } else if (['facebook', 'instagram'].includes(channel)) {
      const { data: newContact, error: createError } = await supabase
        .from("contacts")
        .insert({
          name,
          number,
          email,
          is_group: isGroup,
          company_id: companyUuid,
          channel,
          profile_pic_url: profilePicUrl,
          url_picture: "",
          whatsapp_id: resolvedWhatsappId || null
        })
        .select()
        .single();
        
      if (createError) throw createError;
      finalContactData = newContact;
      createContact = true;
    }

    if (updateImage || ['facebook', 'instagram'].includes(channel)) {
      let filename;
      filename = await downloadProfileImage({
        profilePicUrl,
        companyId
      });

      if (filename) {
        const { data: picUpdatedContact } = await supabase
          .from("contacts")
          .update({
            url_picture: filename,
            picture_updated: true
          })
          .eq("id", finalContactData.id)
          .select()
          .single();
          
        if (picUpdatedContact) finalContactData = picUpdatedContact;
      }
    }

    // Format for legacy compatibility
    const formattedContact = {
      ...finalContactData,
      companyId: finalContactData.company_id,
      profilePicUrl: finalContactData.profile_pic_url,
      isGroup: finalContactData.is_group,
      remoteJid: finalContactData.remote_jid,
      whatsappId: finalContactData.whatsapp_id,
      urlPicture: finalContactData.url_picture
    };

    if (createContact) {
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "create",
          contact: formattedContact
        });
    } else {
      io.of(String(companyId))
        .emit(`company-${companyId}-contact`, {
          action: "update",
          contact: formattedContact
        });
    }

    return formattedContact;
  } catch (err) {
    logger.error("Error to find or create a contact:", err);
    throw err;
  }
};

export default CreateOrUpdateContactService;
