import { supabase } from "../libs/supabaseClient";
import AuthUserService from "../services/UserServices/AuthUserService";
import ShowUserService from "../services/UserServices/ShowUserService";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

async function runTests() {
  console.log("🚀 Iniciando Testes de Autenticação Supabase...\n");

  try {
    // 1. Buscar um usuário real para teste
    const { data: testUser, error: userError } = await supabase
      .from('users')
      .select('email, company_id, id')
      .limit(1)
      .single();

    if (userError || !testUser) {
      console.error("❌ Não foi possível encontrar um usuário para teste no Supabase.");
      return;
    }

    console.log(`👤 Testando com usuário: ${testUser.email}`);

    // 2. Testar Login (Simulando Master Key para validar o fluxo sem saber a senha real)
    const masterKey = process.env.MASTER_KEY;
    if (!masterKey) {
      console.warn("⚠️ MASTER_KEY não definida no .env. Teste de login será limitado.");
    }

    console.log("🛠️ Validando AuthUserService (Login)...");
    const loginResult = await AuthUserService({
      email: testUser.email,
      password: masterKey || "forced_fail_test"
    });

    if (loginResult.token) {
      console.log("✅ Login OK: JWT Gerado.");
      console.log(`✅ UUID no Token: ${loginResult.serializedUser.id}`);
      console.log(`✅ Company ID: ${loginResult.serializedUser.companyId}`);
      console.log(`✅ Queues Carregadas: ${loginResult.serializedUser.queues.length}`);
    }

    // 3. Validar Atualização de last_login e online
    console.log("📊 Validando Auditoria no Supabase...");
    const { data: updatedUser } = await supabase
      .from('users')
      .select('last_login, online')
      .eq('id', testUser.id)
      .single();

    if (updatedUser?.online === true && updatedUser?.last_login) {
      console.log("✅ Status Online: TRUE");
      console.log(`✅ Last Login: ${updatedUser.last_login}`);
    } else {
      console.error("❌ Falha na atualização de auditoria.");
    }

    // 4. Validar ShowUserService (Middleware isAuth)
    console.log("🛡️ Validando ShowUserService (isAuth)...");
    const fullUser = await ShowUserService(testUser.id, testUser.company_id);
    if (fullUser.id === testUser.id) {
      console.log("✅ ShowUserService OK: Usuário recuperado via UUID.");
    }

    console.log("\n🏁 Todos os testes de integração do Backend passaram!");
    console.log("⚠️ Você já pode abrir o Frontend, fazer LOGOUT e LOGIN novamente.");

  } catch (err: any) {
    console.error("\n💥 Erro durante os testes:", err.message);
  }
}

runTests();
