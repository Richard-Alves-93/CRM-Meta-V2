const fs = require('fs');

const snakeToCamel = (str) => str.replace(/([-_][a-z])/g, (group) => group.toUpperCase().replace('-', '').replace('_', ''));

const mapToCamel = (obj) => {
  if (!obj) return obj;
  const newObj = {};
  Object.keys(obj).forEach(key => {
    newObj[snakeToCamel(key)] = obj[key];
  });
  return newObj;
};

function replaceFinal(code) {
  let newCode = code;

  // Replace Queue.findByPk
  newCode = newCode.replace(/await\s+Queue\.findByPk\((.*?)\);?/g, (match, id) => {
    return `await supabase.from("queues").select("*").eq("id", ${id}).maybeSingle().then(res => res.data ? { ...res.data, outOfHoursMessage: res.data.out_of_hours_message, greetingMessage: res.data.greeting_message } : null)`;
  });

  // Replace CompaniesSettings.findOne
  newCode = newCode.replace(/await\s+CompaniesSettings\.findOne\(\{\s*where:\s*\{\s*companyId\s*\}\s*\}\);?/g, 
    `await supabase.from("companies_settings").select("*").eq("company_id", companyId).maybeSingle().then(res => res.data ? { ...res.data, companyId: res.data.company_id, scheduleType: res.data.schedule_type } : null)`);

  // Replace WebhookModel.findOne
  newCode = newCode.replace(/await\s+WebhookModel\.findOne\(\{\s*where:\s*\{\s*company_id:\s*companyId\s*\}\s*\}\);?/g, 
    `await supabase.from("webhooks").select("*").eq("company_id", companyId).maybeSingle().then(res => res.data)`);

  fs.writeFileSync('src/services/WbotServices/wbotMessageListener2.ts', newCode);
  console.log("Final refactor part 2 done.");
}

const code = fs.readFileSync('src/services/WbotServices/wbotMessageListener2.ts', 'utf8');
replaceFinal(code);
