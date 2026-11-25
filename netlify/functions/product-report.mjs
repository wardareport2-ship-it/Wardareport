import core from '../lib/telegram-report-core.cjs';

// POST { text, model }  +  Authorization: Bearer <Firebase ID token>
// Sends one product sales report (built in Stock Book) to the saved Telegram chat.
const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

// Verifies the login with Google's public endpoint, so no Admin service account is needed.
async function verifyUser(idToken) {
  const key = process.env.FIREBASE_API_KEY || 'AIzaSyAqFp2SG979LRDAFDCXfrhbam3eA8vtsbA';
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }), signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) return null;
  const j = await r.json().catch(() => null);
  const u = j && j.users && j.users[0];
  if (!u || u.disabled || !/@stockbook\.app$/i.test(u.email || '')) return null;
  return u;
}

export default async function productReport(request) {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'POST only.' });
  const idToken = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return json(401, { ok: false, error: 'Sign in again.' });
  let body;
  try { body = await request.json(); } catch { return json(400, { ok: false, error: 'Invalid request.' }); }
  const text = String(body && body.text || '').trim();
  if (!text || text.length > 3900) return json(400, { ok: false, error: 'Report text is empty or too long.' });
  try {
    if (!await verifyUser(idToken)) return json(401, { ok: false, error: 'Login could not be verified.' });
    const token = core.getTelegramToken();
    const cfg = await core.getTelegramSettings().catch(() => null);
    const chatId = (cfg && cfg.chatId) || process.env.TELEGRAM_CHAT_ID;
    if (!chatId) return json(503, { ok: false, error: 'Telegram chat is not set. Save it in Stock Book > Report > Telegram.' });
    // Plain text (no parse_mode) so product names can never break or inject formatting.
    await core.telegram('sendMessage', token, { chat_id: chatId, text, disable_web_page_preview: true });
    return json(200, { ok: true });
  } catch (e) {
    console.error('product-report failed:', e && e.stack || e);
    return json(500, { ok: false, error: String(e && e.message || 'Could not send the report.').slice(0, 200) });
  }
}
