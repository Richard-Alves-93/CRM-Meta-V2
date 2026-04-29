import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data, error } = await supabase.rpc('get_tables'); // This might not work if RPC not defined
  if (error) {
    // Try querying a common table to see if it exists
    const tables = ['users', 'companies', 'contacts', 'tickets', 'messages', 'whatsapps', 'Whatsapps', 'prompts'];
    for (const table of tables) {
      const { error: tableError } = await supabase.from(table).select('*').limit(1);
      if (tableError) {
        console.log(`❌ Table ${table}: ${tableError.message}`);
      } else {
        console.log(`✅ Table ${table}: Found!`);
      }
    }
  } else {
    console.log("Tables:", data);
  }
}

checkTables();
