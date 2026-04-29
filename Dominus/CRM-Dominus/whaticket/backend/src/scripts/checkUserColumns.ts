import { supabase } from "../libs/supabaseClient";

async function checkColumns() {
  const columns = ['id', 'email', 'password_hash', 'online', 'company_id', 'profile', 'is_active'];
  for (const col of columns) {
    const { error: colError } = await supabase.from('users').select(col).limit(1);
    if (colError) {
      console.log(`❌ Column ${col} does NOT exist.`);
    } else {
      console.log(`✅ Column ${col} exists.`);
    }
  }
}

checkColumns();
