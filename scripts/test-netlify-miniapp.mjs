import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const require = createRequire(import.meta.url);

// Check the deploy layout and Netlify routing.
for (const file of ['index.html','legacy-app.html','tg/index.html','netlify.toml','netlify/functions/telegram-bot.mjs','netlify/functions/tg-dashboard.mjs','netlify/functions/telegram-setup.js','netlify/functions/firebase-config.mjs','netlify/functions/daily-telegram-report-background.mjs','netlify/lib/telegram-report-core.cjs']) {
  assert.ok(fs.existsSync(path.join(root, file)), `Missing required deploy file: ${file}`);
}
const netlify = read('netlify.toml');
const legacy = read('legacy-app.html');
assert.match(netlify, /publish\s*=\s*"\."/);
assert.match(netlify, /functions\s*=\s*"netlify\/functions"/);
assert.match(netlify, /from\s*=\s*"\/tg"[\s\S]*to\s*=\s*"\/tg\/"/);
assert.match(legacy, /\/\.netlify\/functions\/firebase-config/);
assert.ok(fs.existsSync(path.join(root, '.env.example')), 'Firebase/BILLZ/Telegram/Supabase environment template is required');

// Main shell buttons must all route to a known section or a concrete action.
const shell = read('index.html');
const shellViews = [...shell.matchAll(/data-view="([^"]+)"/g)].map(x => x[1]);
const bridgeMap = ['overview','catalog','sales','imports','transfers','writeoffs','intelligence','analytics','reports','sync'];
for (const view of shellViews) {
  if (view === 'telegram' || view === 'settings') continue;
  assert.ok(bridgeMap.includes(view), `Shell navigation has no bridge target: ${view}`);
  assert.ok(shell.includes(`'${view}':`) || shell.includes(`${view}:`), `Shell label missing: ${view}`);
}
for (const id of ['mobilemenu','notifyBtn','quickAdd','quickMenu','globalSearch','storeSelect']) {
  assert.ok(shell.includes(`'${id}'`) || shell.includes(`id="${id}"`), `Main shell control is missing: ${id}`);
}
for (const id of ['lb','stt','nt','ni','fb','nt2','ni2','nr2','no2','tt','tgo','bzallgo','bzpb','bzck','rpc','rpg','bzfp','st','sgo','xt','igo','iadd','iclr']) {
  assert.ok(legacy.includes(`id="${id}"`), `Main system button is missing: ${id}`);
  assert.ok(legacy.includes(`#${id}`) || legacy.includes(`'${id}'`) || legacy.includes(`"${id}"`), `Main system button has no handler reference: ${id}`);
}
for (const selector of ['[data-intel-transfer]','[data-prod]','[data-csv]','[data-lf]','[data-tab]','[data-add]','[data-rm]','[data-st]','[data-tog]','[data-th]','[data-lang]']) {
  assert.ok(legacy.includes(selector), `Main system delegated handler missing: ${selector}`);
}
assert.match(legacy, /\$\$\('\.nb'\)\.forEach\(b=>b\.onclick/);
assert.match(legacy, /window\.StockBookBridge\s*=/);
assert.match(legacy, /telegramApi\(\{action:'inviteUser'/, 'Main system individual-invite button must call its Netlify action');
assert.match(legacy, /telegramApi\(\{action:'removeUser'/, 'Main system individual-remove button must call its Netlify action');
assert.match(legacy, /telegramApi\(\{action:'listUsers'/, 'Main system individual-user list must call its Netlify action');
assert.match(legacy, /data-tg-remove-user/, 'Individual-account remove action must be rendered');

// Mini App controls are delegated and must map to view changes or refresh.
const mini = read('tg/index.html');
for (const selector of ['#tabSeg [data-t]','#kindSeg [data-kd]','[data-s]','#modeSeg [data-m]','#metSeg [data-k]']) {
  assert.ok(mini.includes(selector), `Mini App handler missing: ${selector}`);
}
assert.match(mini, /\$\('#rf'\)\.addEventListener\('click'/);
assert.match(mini, /tgImagePreview/);
assert.match(mini, /touchmove/);
assert.match(mini, /tg-dashboard/);
const webhookCode = read('netlify/functions/telegram-bot.mjs');
assert.match(webhookCode, /linkInvitedTelegramUser\(message\.from\)/, 'Webhook must link invited individual Telegram users on /start');
const setupCode = read('netlify/functions/telegram-setup.js');
for (const action of ['listUsers','inviteUser','removeUser']) assert.ok(setupCode.includes(`action === '${action}'`), `Netlify setup function missing ${action} action`);

// Syntax-check server-side JavaScript entrypoints too (without running them).
const serverFiles = [
  'server.mjs','telegram-bot.mjs','telegram-setup.js','telegram-report-core.cjs','billz.js',
  ...fs.readdirSync(path.join(root, 'netlify/functions')).filter(f => /\.(?:mjs|cjs|js)$/.test(f)).map(f => path.join('netlify/functions', f)),
  ...fs.readdirSync(path.join(root, 'netlify/lib')).filter(f => /\.(?:mjs|cjs|js)$/.test(f)).map(f => path.join('netlify/lib', f))
];
for (const file of serverFiles) {
  if (!fs.existsSync(path.join(root, file))) continue;
  execFileSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'pipe' });
}

// Syntax-check every inline script in the three public HTML files.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stockbook-syntax-'));
try {
  let index = 0;
  for (const htmlFile of ['index.html','legacy-app.html','tg/index.html']) {
    const html = read(htmlFile);
    const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = re.exec(html))) {
      const body = match[2].trim();
      if (!body) continue;
      const isModule = /\btype\s*=\s*["']module["']/i.test(match[1]);
      const ext = isModule ? '.mjs' : '.js';
      const target = path.join(tmp, `inline-${index++}${ext}`);
      fs.writeFileSync(target, body);
      execFileSync(process.execPath, ['--check', target], { stdio: 'pipe' });
    }
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Verify the public Firebase config function returns only browser-safe app configuration.
process.env.FIREBASE_API_KEY = 'firebase-web-api-key-test';
process.env.FIREBASE_AUTH_DOMAIN = 'stockbook-test.firebaseapp.com';
process.env.FIREBASE_PROJECT_ID = 'stockbook-test';
process.env.FIREBASE_STORAGE_BUCKET = 'stockbook-test.firebasestorage.app';
process.env.FIREBASE_MESSAGING_SENDER_ID = '123456789';
process.env.FIREBASE_APP_ID = '1:123456789:web:testapp';
process.env.FIREBASE_SERVICE_ACCOUNT_JSON = '{"private_key":"must-never-be-exposed"}';
const firebaseConfigModule = await import(pathToFileURL(path.join(root, 'netlify/functions/firebase-config.mjs')).href + `?test=${Date.now()}`);
const firebaseConfigResponse = await firebaseConfigModule.default(new Request('https://stockbook-test.netlify.app/.netlify/functions/firebase-config'));
assert.equal(firebaseConfigResponse.status, 200);
const firebasePublicConfig = await firebaseConfigResponse.json();
assert.equal(firebasePublicConfig.projectId, 'stockbook-test');
assert.equal(firebasePublicConfig.apiKey, 'firebase-web-api-key-test');
assert.ok(!('private_key' in firebasePublicConfig) && !('FIREBASE_SERVICE_ACCOUNT_JSON' in firebasePublicConfig), 'Firebase Admin service account must never be exposed by the public config endpoint');
const firebaseConfigPost = await firebaseConfigModule.default(new Request('https://stockbook-test.netlify.app/.netlify/functions/firebase-config', { method: 'POST' }));
assert.equal(firebaseConfigPost.status, 405);

// Verify the deployed Netlify webhook answers /start with a Mini App button,
// does not post into groups, and refuses requests without Telegram's secret header.
process.env.TELEGRAM_BOT_TOKEN = '123456:test-token-for-local-tests';
process.env.TELEGRAM_ALLOWED_USER_IDS = '12345';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.URL = 'https://stockbook-test.netlify.app';
const core = require('../netlify/lib/telegram-report-core.cjs');
const webhookModule = await import(pathToFileURL(path.join(root, 'netlify/functions/telegram-bot.mjs')).href + `?test=${Date.now()}`);
const sent = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes('/sendMessage')) {
    sent.push({ url: String(url), payload: JSON.parse(options.body || '{}') });
    return new Response(JSON.stringify({ ok: true, result: { message_id: sent.length } }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  throw new Error(`Unexpected network request in webhook test: ${url}`);
};
try {
  const signedHeaders = { 'content-type':'application/json', 'x-telegram-bot-api-secret-token':core.webhookSecret() };
  const privateStart = new Request('https://example.netlify.app/.netlify/functions/telegram-bot', {
    method:'POST', headers:signedHeaders,
    body:JSON.stringify({ update_id:1, message:{ message_id:1, text:'/start', chat:{ id:12345, type:'private' }, from:{ id:12345, is_bot:false, first_name:'Test' } } })
  });
  const privateResponse = await webhookModule.default(privateStart);
  assert.equal(privateResponse.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].payload.chat_id, 12345);
  assert.equal(sent[0].payload.reply_markup.inline_keyboard[0][0].web_app.url, 'https://stockbook-test.netlify.app/tg/');

  const groupStart = new Request('https://example.netlify.app/.netlify/functions/telegram-bot', {
    method:'POST', headers:signedHeaders,
    body:JSON.stringify({ update_id:2, message:{ message_id:2, text:'/start', chat:{ id:-100123, type:'supergroup' }, from:{ id:12345, is_bot:false, first_name:'Test' } } })
  });
  const groupResponse = await webhookModule.default(groupStart);
  assert.equal(groupResponse.status, 200);
  assert.equal(sent.length, 1, 'The bot must not post /start replies in the shared group');

  const badSecret = new Request('https://example.netlify.app/.netlify/functions/telegram-bot', {
    method:'POST', headers:{ 'content-type':'application/json' }, body:JSON.stringify({ message:{ text:'/start', chat:{ id:12345, type:'private' }, from:{ id:12345 } } })
  });
  const denied = await webhookModule.default(badSecret);
  assert.equal(denied.status, 401);
} finally {
  globalThis.fetch = originalFetch;
}

// Exercise the individual Telegram invitation lifecycle against a mocked
// Supabase REST API: invite by username -> private /start links ID -> authorized.
process.env.SUPABASE_URL = 'https://stockbook-test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
const users = [];
const supabaseCalls = [];
globalThis.fetch = async (url, options = {}) => {
  const u = new URL(String(url));
  if (u.hostname !== 'stockbook-test.supabase.co' || !u.pathname.startsWith('/rest/v1/stock_book_telegram_users')) {
    throw new Error(`Unexpected request in individual-invite test: ${url}`);
  }
  const method = String(options.method || 'GET').toUpperCase();
  supabaseCalls.push({ method, search: u.search });
  const usernameFilter = u.searchParams.get('username');
  const idFilter = u.searchParams.get('telegram_user_id');
  let selected = users;
  if (usernameFilter?.startsWith('eq.')) selected = users.filter(x => x.username === decodeURIComponent(usernameFilter.slice(3)));
  if (idFilter?.startsWith('eq.')) selected = users.filter(x => x.telegram_user_id === decodeURIComponent(idFilter.slice(3)) && x.status === 'active');
  if (method === 'GET') return new Response(JSON.stringify(selected), { status: 200, headers: { 'Content-Type': 'application/json' } });
  const body = JSON.parse(options.body || '{}');
  if (method === 'POST') {
    const index = users.findIndex(x => x.username === body.username);
    if (index >= 0) users[index] = { ...users[index], ...body };
    else users.push({ ...body });
    return new Response('', { status: 201 });
  }
  if (method === 'PATCH') {
    for (const row of selected) Object.assign(row, body);
    return new Response(JSON.stringify(selected), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (method === 'DELETE') {
    for (let i = users.length - 1; i >= 0; i--) if (selected.includes(users[i])) users.splice(i, 1);
    return new Response(null, { status: 204 });
  }
  throw new Error(`Unexpected Supabase method ${method}`);
};
try {
  const invited = await core.inviteTelegramUser('@Stock_Manager', 'firebase-admin-uid');
  assert.equal(invited.username, 'stock_manager');
  assert.equal(invited.status, 'pending');
  assert.equal(users.length, 1);
  assert.equal(users[0].added_by_uid, 'firebase-admin-uid');

  const linked = await core.linkInvitedTelegramUser({ id: 555123, username: 'Stock_Manager', first_name: 'Store', last_name: 'Manager' });
  assert.equal(linked, true, 'First private /start should link the invited username to its Telegram ID');
  assert.equal(users[0].status, 'active');
  assert.equal(users[0].telegram_user_id, '555123');
  assert.equal(await core.isAuthorizedUser(555123), true, 'Linked individual must receive Mini App authorization');

  await core.removeTelegramUser('@stock_manager');
  assert.equal(users.length, 0, 'Removing the individual invitation should remove the stored authorization');
  assert.ok(supabaseCalls.some(x => x.method === 'PATCH'));
  assert.ok(supabaseCalls.some(x => x.method === 'DELETE'));
} finally {
  globalThis.fetch = originalFetch;
}

// Exercise the authenticated Netlify Access Management API actions as well.
process.env.SUPABASE_URL = 'https://stockbook-test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
const setup = require('../netlify/functions/telegram-setup.js');
const apiUsers = [];
globalThis.fetch = async (url, options = {}) => {
  const target = new URL(String(url));
  if (target.hostname === 'identitytoolkit.googleapis.com') {
    return new Response(JSON.stringify({ users: [{ localId: 'firebase-admin-uid' }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  if (target.hostname !== 'stockbook-test.supabase.co' || !target.pathname.endsWith('/stock_book_telegram_users')) {
    throw new Error(`Unexpected request in Access Management API test: ${url}`);
  }
  const method = String(options.method || 'GET').toUpperCase();
  const filter = target.searchParams.get('username');
  let selected = filter?.startsWith('eq.') ? apiUsers.filter(x => x.username === filter.slice(3)) : apiUsers;
  if (method === 'GET') return new Response(JSON.stringify(selected), { status: 200, headers: { 'Content-Type': 'application/json' } });
  if (method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const index = apiUsers.findIndex(x => x.username === body.username);
    if (index >= 0) apiUsers[index] = { ...apiUsers[index], ...body };
    else apiUsers.push({ ...body });
    return new Response(null, { status: 201 });
  }
  if (method === 'DELETE') {
    for (let i = apiUsers.length - 1; i >= 0; i--) if (selected.includes(apiUsers[i])) apiUsers.splice(i, 1);
    return new Response(null, { status: 204 });
  }
  throw new Error(`Unexpected Access Management method ${method}`);
};
try {
  const call = body => setup.handler({ httpMethod: 'POST', headers: { authorization: 'Bearer firebase-test-id-token' }, body: JSON.stringify(body) });
  const unauth = await setup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ action: 'listUsers' }) });
  assert.equal(unauth.statusCode, 401, 'Access Management actions must require Firebase sign-in');
  const addRes = await call({ action: 'inviteUser', username: '@branch_manager' });
  assert.equal(addRes.statusCode, 200);
  assert.equal(JSON.parse(addRes.body).user.status, 'pending');
  const listRes = await call({ action: 'listUsers' });
  assert.equal(JSON.parse(listRes.body).users.length, 1);
  const removeRes = await call({ action: 'removeUser', username: '@branch_manager' });
  assert.equal(removeRes.statusCode, 200);
  assert.equal(apiUsers.length, 0);
} finally {
  globalThis.fetch = originalFetch;
}

console.log('Netlify UI and Telegram Mini App checks passed: main navigation/actions, Mini App tabs/filters/refresh/image preview, inline JS syntax, environment-configured Firebase public config endpoint with Admin secret isolation, private /start dashboard button, group quiet mode, webhook authentication, individual Telegram invite/link/remove lifecycle, and authenticated Access Management API actions.');
