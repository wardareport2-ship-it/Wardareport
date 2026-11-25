import core from '../lib/telegram-report-core.cjs';

// POST { text, model } + Authorization: Bearer <Firebase ID token>
// This narrowly scoped endpoint sends one user-requested product report.
// The general Telegram helper intentionally blocks sendMessage in Dashboard-only mode,
// so this authenticated action calls Telegram directly and sends nothing else.
const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});

// Verify the signed-in Stock Book account with Google's public Firebase endpoint.
async function verifyUser(idToken) {
  const key = process.env.FIREBASE_API_KEY || 'AIzaSyAqFp2SG979LRDAFDCXfrhbam3eA8vtsbA';
  const response = await fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + encodeURIComponent(key),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) return null;
  const data = await response.json().catch(() => null);
  const user = data && data.users && data.users[0];
  if (!user || user.disabled || !/@stockbook\.app$/i.test(user.email || '')) return null;
  return user;
}

export default async function productReport(request) {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'POST only.' });

  const idToken = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!idToken) return json(401, { ok: false, error: 'Sign in again.' });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { ok: false, error: 'Invalid request.' });
  }

  const text = String((body && body.text) || '').trim();
  if (!text || text.length > 3900) {
    return json(400, { ok: false, error: 'Report text is empty or too long.' });
  }

  try {
    if (!await verifyUser(idToken)) {
      return json(401, { ok: false, error: 'Login could not be verified.' });
    }

    const token = core.getTelegramToken();
    const settings = await core.getTelegramSettings().catch(() => null);
    // Explicit report-chat override -> saved Stock Book Telegram group -> legacy env fallback.
    const chatId = process.env.TELEGRAM_REPORT_CHAT_ID
      || (settings && settings.chatId)
      || process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      return json(503, {
        ok: false,
        error: 'Telegram chat is not set. Save it in Stock Book > Report > Telegram.',
      });
    }

    const telegramResponse = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Plain text preserves the user's report template and avoids parse-mode formatting errors.
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(15000),
    });
    const telegramResult = await telegramResponse.json().catch(() => ({}));
    if (!telegramResponse.ok || !telegramResult.ok) {
      throw new Error('Telegram: ' + (telegramResult.description || telegramResponse.status));
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error('product-report failed:', error && error.stack || error);
    return json(500, {
      ok: false,
      error: String(error && error.message || 'Could not send the report.').slice(0, 200),
    });
  }
}
