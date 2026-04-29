const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "..", "..", ".env") });

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
  const { data, error } = await supabase.from("tickets").select("*").limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else if (data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data in tickets table");
  }
}

checkColumns();
