import fs from 'node:fs';
import path from 'node:path';
const required=['index.html','legacy-app.html','netlify.toml','package.json','netlify/functions','tg/index.html','server.mjs','scripts/preflight-integrated.mjs','scripts/test-smart-retail.mjs','README-SMART-RETAIL-INTELLIGENCE.txt'];
const missing=required.filter(p=>!fs.existsSync(path.resolve(p)));
if(missing.length){console.error('Missing required project paths:',missing.join(', '));process.exit(1);}
const index=fs.readFileSync('index.html','utf8');
const legacy=fs.readFileSync('legacy-app.html','utf8');
for(const token of ['id=\"legacyFrame\"','data-view=\"overview\"','data-view=\"sync\"','data-view=\"intelligence\"','StockBookBridge']) if(!index.includes(token)) {console.error('Main shell missing:',token);process.exit(1);}
for(const token of ['window.StockBookBridge','onAuthStateChanged','id=\"v-intel\"','function smartRetailData','function renderSmartIntelligence','function catalogSalesActivityIndex','id=\"intel-count-template\"','data-intel-transfer']) if(!legacy.includes(token)) {console.error('Operational app missing:',token);process.exit(1);}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
if(!pkg.scripts?.start || !pkg.dependencies?.['firebase-admin']) {console.error('Package manifest missing existing server dependencies/scripts');process.exit(1);}
console.log('Stock Book integrated-main + Smart Retail Intelligence preflight passed.');
