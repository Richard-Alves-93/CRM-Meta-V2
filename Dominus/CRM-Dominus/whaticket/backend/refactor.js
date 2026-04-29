const fs = require('fs');

const snakeCase = str => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

function replaceAll(code) {
  let newCode = code;

  // Replace await ticket.update({ ... }) with await supabase.from("tickets").update({ ... }).eq("id", ticket.id)
  newCode = newCode.replace(/await\s+(ticket|ticketTraking)\.update\(\s*\{([\s\S]*?)\}\s*\);?/g, (match, variable, propsStr) => {
    // We need to convert camelCase keys to snake_case
    let newProps = propsStr;
    const propRegex = /([a-zA-Z0-9_]+)\s*:/g;
    newProps = newProps.replace(propRegex, (m, key) => {
      return `${snakeCase(key)}:`;
    });

    const table = variable === 'ticket' ? '"tickets"' : '"ticket_trackings"';
    return `await supabase.from(${table}).update({${newProps}, updated_at: new Date().toISOString()}).eq("id", ${variable}.id);`;
  });

  // Replace Whatsapp.findOne({ where: { id: ticket.whatsappId } })
  newCode = newCode.replace(/await\s+Whatsapp\.findOne\(\{\s*where:\s*\{\s*id:\s*ticket\.whatsappId\s*\}\s*\}\);?/g, 
    `await supabase.from("whatsapps").select("*").eq("id", ticket.whatsapp_id || ticket.whatsappId).maybeSingle().then(res => res.data);`);

  // Replace Ticket.findByPk(messageRecord.ticketId)
  newCode = newCode.replace(/await\s+Ticket\.findByPk\((.*?)\);?/g, 
    `await supabase.from("tickets").select("*").eq("id", $1).maybeSingle().then(res => res.data);`);

  // Replace Contact.findByPk(state.contactId)
  newCode = newCode.replace(/await\s+Contact\.findByPk\((.*?)\);?/g, 
    `await supabase.from("contacts").select("*").eq("id", $1).maybeSingle().then(res => res.data);`);

  // Replace Ticket.findAndCountAll
  // const count = await Ticket.findAndCountAll({ where: { userId: null, status: "pending", companyId, queueId: choosenQueue.id, whatsappId: wbot.id, isGroup: false } });
  newCode = newCode.replace(/const\s+count\s*=\s*await\s+Ticket\.findAndCountAll\(\{\s*where:\s*\{([\s\S]*?)\}\s*\}\);?/g, (match, whereStr) => {
     // A bit complex, we just replace it completely if it exactly matches one of the known forms
     return match; // We will handle count manually
  });

  fs.writeFileSync('src/services/WbotServices/wbotMessageListener2.ts', newCode);
  console.log("Written to wbotMessageListener2.ts");
}

const code = fs.readFileSync('src/services/WbotServices/wbotMessageListener.ts', 'utf8');
replaceAll(code);
