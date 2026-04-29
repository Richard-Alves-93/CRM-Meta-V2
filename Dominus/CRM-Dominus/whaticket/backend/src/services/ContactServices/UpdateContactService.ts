import AppError from "../../errors/AppError";
import { supabase } from "../../libs/supabaseClient";
import { getCompanyUuid } from "../../helpers/SupabaseIdResolver";

interface ExtraInfo {
  id?: number | string;
  name: string;
  value: string;
}

interface ContactData {
  email?: string;
  number?: string;
  name?: string;
  acceptAudioMessage?: boolean;
  active?: boolean;
  extraInfo?: ExtraInfo[];
  disableBot?: boolean;
  remoteJid?: string;
  wallets?: null | number[] | string[];
}

interface Request {
  contactData: ContactData;
  contactId: string | number;
  companyId: number | string;
}

const UpdateContactService = async ({
  contactData,
  contactId,
  companyId
}: Request): Promise<any> => {
  const { email, name, number, extraInfo, acceptAudioMessage, active, disableBot, remoteJid, wallets } = contactData;
  const companyUuid = await getCompanyUuid(companyId);

  // 1. Busca o contato existente
  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select(`
      id, name, number, channel, email, company_id, accept_audio_message, active, profile_pic_url, remote_jid, url_picture,
      extraInfo:contact_custom_fields(id, name, value),
      wallets:contact_wallets(wallet_id)
    `)
    .eq("id", contactId)
    .maybeSingle();

  if (fetchError) {
    throw new AppError("Error fetching contact from Supabase", 500);
  }

  if (!contact) {
    throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  }

  if (String(contact.company_id) !== String(companyUuid)) {
    throw new AppError("Não é possível alterar registros de outra empresa", 403);
  }

  // 2. Atualiza os campos customizados (ExtraInfo)
  if (extraInfo) {
    const oldExtraInfo = contact.extraInfo || [];

    // Delete campos removidos
    for (const oldInfo of oldExtraInfo) {
      const stillExists = extraInfo.find(info => String(info.id) === String(oldInfo.id));
      if (!stillExists) {
        await supabase
          .from("contact_custom_fields")
          .delete()
          .eq("id", oldInfo.id);
      }
    }

    // Upsert campos novos/existentes
    for (const info of extraInfo) {
      if (info.id) {
        await supabase
          .from("contact_custom_fields")
          .update({ name: info.name, value: info.value })
          .eq("id", info.id);
      } else {
        await supabase
          .from("contact_custom_fields")
          .insert({
            name: info.name,
            value: info.value,
            contact_id: contact.id
          });
      }
    }
  }

  // 3. Atualiza as Carteiras (Wallets)
  if (wallets) {
    // Remove as antigas
    await supabase
      .from("contact_wallets")
      .delete()
      .eq("contact_id", contact.id);

    // Adiciona as novas
    if (wallets.length > 0) {
      const contactWallets = wallets.map((wallet: any) => ({
        wallet_id: wallet.id ? wallet.id : wallet,
        contact_id: contact.id,
        company_id: companyUuid
      }));

      await supabase
        .from("contact_wallets")
        .insert(contactWallets);
    }
  }

  // 4. Atualiza os dados principais do contato
  const updatePayload: any = {};
  if (name !== undefined) updatePayload.name = name;
  if (number !== undefined) updatePayload.number = number;
  if (email !== undefined) updatePayload.email = email;
  if (acceptAudioMessage !== undefined) updatePayload.accept_audio_message = acceptAudioMessage;
  if (active !== undefined) updatePayload.active = active;
  if (disableBot !== undefined) updatePayload.disable_bot = disableBot;
  if (remoteJid !== undefined) updatePayload.remote_jid = remoteJid;

  if (Object.keys(updatePayload).length > 0) {
    await supabase
      .from("contacts")
      .update(updatePayload)
      .eq("id", contact.id);
  }

  // 5. Retorna o contato atualizado com formatação legada
  const { data: updatedContact } = await supabase
    .from("contacts")
    .select(`
      id, name, number, channel, email, company_id, accept_audio_message, active, profile_pic_url, remote_jid, url_picture,
      extraInfo:contact_custom_fields(id, name, value),
      tags:contact_tags(tag:tags(id, name)),
      wallets:contact_wallets(wallet_id) // Add join for user/wallet info if necessary
    `)
    .eq("id", contact.id)
    .single();

  const formattedContact = {
    ...updatedContact,
    companyId: updatedContact.company_id,
    profilePicUrl: updatedContact.profile_pic_url,
    acceptAudioMessage: updatedContact.accept_audio_message,
    remoteJid: updatedContact.remote_jid,
    urlPicture: updatedContact.url_picture
  };

  return formattedContact;
};

export default UpdateContactService;
