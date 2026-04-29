import { createClient } from "@supabase/supabase-js";
import { Sequelize } from "sequelize-typescript";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const sequelize = new Sequelize({
  dialect: (process.env.DB_DIALECT as any) || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "dominus",
  password: process.env.DB_PASS || "dominus",
  database: process.env.DB_NAME || "dominus_testes",
  logging: false,
});

async function migrate() {
  console.log("\n🚀 INICIANDO MIGRAÇÃO COMPLETA PARA SUPABASE");
  console.log("===============================================================");

  try {
    await sequelize.authenticate();
    
    // Mapeamentos
    const companyMap = new Map<number, string>();
    const userMap = new Map<number, string>();

    // 1. Mapear Empresas
    const [companies] = await sequelize.query("SELECT id, name FROM \"Companies\"");
    for (const comp of companies as any[]) {
      const { data } = await supabase.from("companies").select("id").eq("legacy_id", comp.id).maybeSingle();
      if (data) companyMap.set(comp.id, data.id);
    }
    console.log(`✅ ${companyMap.size} empresas mapeadas.`);

    // 2. Mapear Usuários
    const [users] = await sequelize.query("SELECT id, email FROM \"Users\"");
    for (const u of users as any[]) {
      const { data } = await supabase.from("users").select("id").eq("email", u.email).maybeSingle();
      if (data) userMap.set(u.id, data.id);
    }
    console.log(`✅ ${userMap.size} usuários mapeados.`);

    // 3. Migrar Planos
    console.log("🔄 Migrando Planos...");
    const [plans] = await sequelize.query("SELECT * FROM \"Plans\"");
    for (const p of plans as any[]) {
      await supabase.from("plans").upsert({
        id: p.id, // Usando o ID legado como PK no Supabase para Planos se for numérico
        name: p.name,
        users: p.users,
        connections: p.connections,
        queues: p.queues,
        value: p.value,
        use_kanban: p.useKanban,
        use_whatsapp: p.useWhatsapp,
        use_facebook: p.useFacebook,
        use_instagram: p.useInstagram,
        use_campaigns: p.useCampaigns,
        use_schedules: p.useSchedules,
        use_internal_chat: p.useInternalChat,
        use_external_api: p.useExternalApi,
        created_at: p.createdAt,
        updated_at: p.updatedAt
      });
    }

    // 4. Migrar Filas (Queues)
    console.log("🔄 Migrando Filas...");
    const [queues] = await sequelize.query("SELECT * FROM \"Queues\"");
    for (const q of queues as any[]) {
      const companyUuid = companyMap.get(q.companyId);
      if (!companyUuid) continue;
      await supabase.from("queues").upsert({
        legacy_id: q.id,
        name: q.name,
        color: q.color,
        greeting_message: q.greetingMessage,
        out_of_hours_message: q.outOfHoursMessage,
        schedules: q.schedules,
        company_id: companyUuid,
        created_at: q.createdAt,
        updated_at: q.updatedAt
      });
    }

    // 5. Migrar Whatsapps
    console.log("🔄 Migrando Whatsapps...");
    const [whatsapps] = await sequelize.query("SELECT * FROM \"Whatsapps\"");
    for (const w of whatsapps as any[]) {
      const companyUuid = companyMap.get(w.companyId);
      if (!companyUuid) continue;
      await supabase.from("whatsapps").upsert({
        legacy_id: w.id,
        name: w.name,
        session: w.session,
        qrcode: w.qrcode,
        status: w.status,
        battery: w.battery,
        plugged: w.plugged,
        retries: w.retries,
        number: w.number,
        greeting_message: w.greetingMessage,
        farewell_message: w.farewellMessage,
        company_id: companyUuid,
        is_default: w.isDefault,
        created_at: w.createdAt,
        updated_at: w.updatedAt
      });
    }

    console.log("===============================================================");
    console.log("🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!");

  } catch (err: any) {
    console.error("💥 Erro durante a migração:", err.message);
    if (err.message.includes("relation \"whatsapps\" does not exist")) {
      console.log("\n⚠️  DICA: Você precisa criar as tabelas no Supabase primeiro.");
    }
  } finally {
    await sequelize.close();
  }
}

migrate();
