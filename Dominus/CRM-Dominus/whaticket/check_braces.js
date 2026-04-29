const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/Settings/Options.js', 'utf8');
const lines = content.split('\n');

let stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') stack.push({ char, line: i + 1 });
        if (char === '}') {
            if (stack.length === 0) {
                console.log(`Extra } at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
        if (char === '(') stack.push({ char, line: i + 1 });
        if (char === ')') {
            if (stack.length === 0) {
                console.log(`Extra ) at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}
console.log('Stack size at end:', stack.length);
if (stack.length > 0) {
    console.log('Unclosed items:', stack);
}
