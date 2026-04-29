const { createClient } = require("@supabase/supabase-js");
const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "dominus",
  password: process.env.DB_PASS || "dominus",
  database: process.env.DB_NAME || "dominus_testes",
  logging: false,
});

async function migrate() {
  console.log("\n🚀 INICIANDO MIGRAÇÃO COMPLETA (VERSÃO JS)");
  
  try {
    await sequelize.authenticate();
    
    const companyMap = new Map();
    const userMap = new Map();

    // 1. Mapear Empresas
    const [companies] = await sequelize.query("SELECT id, name FROM \"Companies\"");
    for (const comp of companies) {
      const { data } = await supabase.from("companies").select("id").eq("legacy_id", comp.id).maybeSingle();
      if (data) companyMap.set(comp.id, data.id);
    }
    console.log(`✅ ${companyMap.size} empresas mapeadas.`);

    // 2. Mapear Usuários
    const [users] = await sequelize.query("SELECT id, email FROM \"Users\"");
    for (const u of users) {
      const { data } = await supabase.from("users").select("id").eq("email", u.email).maybeSingle();
      if (data) userMap.set(u.id, data.id);
    }
    console.log(`✅ ${userMap.size} usuários mapeados.`);

    // 3. Migrar Whatsapps
    console.log("🔄 Migrando Whatsapps...");
    const [whatsapps] = await sequelize.query("SELECT * FROM \"Whatsapps\"");
    for (const w of whatsapps) {
      const companyUuid = companyMap.get(w.companyId);
      if (!companyUuid) continue;
      
      const { error } = await supabase.from("whatsapps").upsert({
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
      if (error) console.error(`❌ Erro ao migrar whatsapp ${w.name}:`, error.message);
    }

    console.log("🎉 MIGRAÇÃO CONCLUÍDA!");

  } catch (err) {
    console.error("💥 Erro:", err.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
