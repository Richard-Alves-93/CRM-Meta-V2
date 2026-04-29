const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, './frontend/src/components/Settings/Options.js');
let code = fs.readFileSync(filePath, 'utf8');

// Fix label={{...}} to label={...}
code = code.replace(/label=\{\{i18n\.t\(([^)]+)\)\}\}/g, 'label={i18n.t($1)}');

fs.writeFileSync(filePath, code);
console.log('Fixed label syntax in Options.js successfully.');
