const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');
code = code.replace("target: 'http://localhost:3005'", "target: 'http://127.0.0.1:3005'");
fs.writeFileSync('vite.config.ts', code);
