import { supabase } from "../src/integrations/supabase/client";

async function inspectSchema() {
  console.log("--- Inspecting Services Table ---");
  const { data: services, error: sError } = await supabase.from('services').select('*').limit(1);
  if (sError) console.error("Services Error:", sError.message);
  else console.log("Services columns:", Object.keys(services[0] || {}));

  console.log("--- Inspecting Sale Items Table ---");
  const { data: saleItems, error: siError } = await supabase.from('sale_items').select('*').limit(1);
  if (siError) console.error("Sale Items Error:", siError.message);
  else console.log("Sale Items columns:", Object.keys(saleItems[0] || {}));

  console.log("--- Inspecting Sales Table ---");
  const { data: sales, error: saError } = await supabase.from('sales').select('*').limit(1);
  if (saError) console.error("Sales Error:", saError.message);
  else console.log("Sales columns:", Object.keys(sales[0] || {}));
}

inspectSchema();
