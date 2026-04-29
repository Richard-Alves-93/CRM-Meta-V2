const fs = require('fs');
let code = fs.readFileSync('src/services/WbotServices/wbotMessageListener2.ts', 'utf8');

// The regex needs to handle the weird invisible spaces (\xA0) and normal spaces!
// Because the output showed `        where: {` these are non-breaking spaces or tabs.
// We can use [\s\S]*? or \s*
const regex = /const\s+count\s*=\s*await\s+Ticket\.findAndCountAll\(\{\s*where:\s*\{\s*userId:\s*null,\s*status:\s*"pending",\s*companyId,\s*queueId:\s*choosenQueue\.id,\s*whatsappId:\s*wbot\.id,\s*isGroup:\s*false\s*\}\s*\}\);/g;

code = code.replace(regex, `const { count } = await supabase.from("tickets").select("*", { count: "exact", head: true }).is("user_id", null).eq("status", "pending").eq("company_id", companyId).eq("queue_id", choosenQueue.id).eq("whatsapp_id", wbot.id).eq("is_group", false);`);

fs.writeFileSync('src/services/WbotServices/wbotMessageListener2.ts', code);
console.log("Count replaced.");
