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
  console.log("\n🚀 INICIANDO MIGRAÇÃO V7.1 (FIX MAPEAMENTO)");
  console.log("===============================================================");

  try {
    await sequelize.authenticate();
    
    const companyMap = new Map<number, string>();
    const queueMap = new Map<number, string>();
    const userMap = new Map<number, string>();
    const contactMap = new Map<number, string>();

    // 1. EMPRESAS
    const [companies] = await sequelize.query("SELECT * FROM \"Companies\"");
    for (const comp of companies as any[]) {
      const { data } = await supabase.from("companies").select("id").eq("legacy_id", comp.id).maybeSingle();
      if (data) companyMap.set(comp.id, data.id);
    }

    // 2. QUEUES
    const [queues] = await sequelize.query("SELECT * FROM \"Queues\"");
    for (const q of queues as any[]) {
      const { data } = await supabase.from("queues").select("id").eq("legacy_id", q.id).maybeSingle();
      if (data) queueMap.set(q.id, data.id);
    }

    // 3. USERS (MAPEAMENTO POR E-MAIL)
    const [users] = await sequelize.query("SELECT * FROM \"Users\"");
    for (const u of users as any[]) {
      const { data } = await supabase.from("users").select("id").eq("email", u.email).maybeSingle();
      if (data) userMap.set(u.id, data.id);
    }
    console.log(`✅ ${userMap.size} usuários mapeados.`);

    // 4. CONTATOS
    const [contacts] = await sequelize.query("SELECT * FROM \"Contacts\"");
    for (let i = 0; i < contacts.length; i += 500) {
      const batch = contacts.slice(i, i + 500);
      const { data } = await supabase.from("contacts").select("id, legacy_id").in("legacy_id", batch.map((c:any) => c.id));
      if (data) data.forEach(d => contactMap.set(d.legacy_id, d.id));
    }
    console.log(`✅ ${contactMap.size} contatos mapeados.`);

    // 5. TICKETS
    console.log("🔄 Migrando Tickets...");
    const [tickets] = await sequelize.query("SELECT * FROM \"Tickets\"");
    let ticketCount = 0;
    for (const t of tickets as any[]) {
      const companyUuid = companyMap.get(t.companyId);
      const contactUuid = contactMap.get(t.contactId);
      if (!companyUuid || !contactUuid) continue;

      const { error } = await supabase.from("tickets").upsert({
        id: t.id,
        company_id: companyUuid,
        contact_id: contactUuid,
        user_id: userMap.get(t.userId) || null,
        queue_id: queueMap.get(t.queueId) || null,
        status: t.status,
        channel: t.channel || 'whatsapp',
        last_message: t.lastMessage,
        created_at: t.createdAt,
        updated_at: t.updatedAt
      });
      if (!error) ticketCount++;
    }
    console.log(`✅ ${ticketCount} tickets migrados.`);

  } catch (err: any) {
    console.error("💥 Erro:", err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
