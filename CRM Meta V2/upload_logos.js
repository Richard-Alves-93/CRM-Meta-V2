import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://ojbyabjhuhzwijnborga.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Chave removida por segurança. Configure no ambiente.

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const images = [
  { path: "C:/Users/richa/.gemini/antigravity/brain/ff387bb0-4caf-4129-a6bc-f2018d2dd2fa/media__1775676286155.png", name: "dominus-h-light.png" },
  { path: "C:/Users/richa/.gemini/antigravity/brain/ff387bb0-4caf-4129-a6bc-f2018d2dd2fa/media__1775676286190.png", name: "dominus-h-dark.png" },
  { path: "C:/Users/richa/.gemini/antigravity/brain/ff387bb0-4caf-4129-a6bc-f2018d2dd2fa/media__1775676286502.png", name: "dominus-v-light.png" },
  { path: "C:/Users/richa/.gemini/antigravity/brain/ff387bb0-4caf-4129-a6bc-f2018d2dd2fa/media__1775676286559.png", name: "dominus-v-dark.png" }
];

async function uploadImages() {
  console.log("Iniciando upload dos logos Dominus...");
  
  for (const img of images) {
    try {
      const fileBuffer = fs.readFileSync(img.path);
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(img.name, fileBuffer, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (error) {
        console.error(`Erro no upload de ${img.name}:`, error.message);
      } else {
        const { data: urlData } = supabase.storage.from('logos').getPublicUrl(img.name);
        console.log(`Sucesso: ${img.name} -> ${urlData.publicUrl}`);
      }
    } catch (err) {
      console.error(`Falha ao ler arquivo ${img.path}:`, err);
    }
  }
}

uploadImages();
