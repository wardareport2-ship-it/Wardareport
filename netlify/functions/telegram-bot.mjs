import core from '../lib/telegram-report-core.cjs';

// Netlify Telegram webhook. It records chats for Access Management and answers
// private /start requests with a Mini App button. It never sends reports/photos
// to groups, and it never replies to group messages.
const ok = () => new Response('ok', { status: 200 });
const appBaseUrl = () => String(process.env.URL || process.env.DEPLOY_PRIME_URL || '').replace(/\/$/, '');

async function sendStartMessage(token, chatId, authorized, newlyLinked = false) {
  const base = appBaseUrl();
  const hasAppUrl = /^https:\/\//i.test(base);
  let text;
  if (authorized && hasAppUrl) {
    text = (newlyLinked ? '✅ Shaxsiy hisobingiz Stock Book bilan bog‘landi.\n\n' : '') + 'Assalomu alaykum! Warda Report botiga xush kelibsiz.\n\nBarcha 4 ta do‘kon bo‘yicha hisobotlar va mahsulot qidiruvini Mini App orqali ko‘rishingiz mumkin.';
  } else if (authorized && !hasAppUrl) {
    text = 'Bot hisobingizni tanidi, lekin Mini App manzili sozlanmagan. Stock Book administratoridan Netlify’da Enable Dashboard tugmasini qayta bosishini so‘rang.';
  } else {
    text = 'Assalomu alaykum! Warda Report botiga xush kelibsiz.\n\nDashboardga kirish uchun avval Stock Book’da ulangan yopiq Telegram guruhiga a’zo bo‘ling yoki administratoringizdan shaxsiy hisobingizga ruxsat berishini so‘rang. Shundan so‘ng /start buyrug‘ini qayta yuboring.';
  }
  const payload = { chat_id: chatId, text, disable_web_page_preview: true };
  if (authorized && hasAppUrl) {
    payload.reply_markup = {
      inline_keyboard: [[{ text: '📊 Dashboardni ochish', web_app: { url: base + '/tg/' } }]]
    };
  }
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result.ok) {
    throw new Error(`Telegram sendMessage failed (${response.status}): ${result.description || 'Unknown Telegram API error'}`);
  }
}

export default async function telegramBot(request) {
  if (request.method !== 'POST') return new Response('Telegram webhook', { status: 200 });
  let token;
  try { token = core.getTelegramToken(); } catch { return new Response('Not configured', { status: 500 }); }
  if (request.headers.get('x-telegram-bot-api-secret-token') !== core.webhookSecret()) return new Response('Unauthorized', { status: 401 });
  const update = await request.json().catch(() => null);
  if (!update) return ok();
  try {
    if (update.my_chat_member) await core.recordSeenChat(update.my_chat_member.chat);
    if (update.message?.chat) {
      const message = update.message;
      await core.recordSeenChat(message.chat);
      const command = String(message.text || '').trim();
      const isStart = /^\/(?:start|help)(?:@\w+)?(?:\s|$)/i.test(command);
      // Web App launch buttons are supported in private chats. Group messages only
      // register the chat; they are never answered to avoid polluting store groups.
      if (isStart && message.chat.type === 'private' && message.from?.id != null) {
        let linked = false;
        let authorized = false;
        // If an administrator invited this @username in Stock Book, link its
        // permanent Telegram user ID on the first private /start message.
        try { linked = await core.linkInvitedTelegramUser(message.from); }
        catch (e) { console.warn('Telegram individual invite linking failed:', String(e && e.message || e)); }
        try { authorized = await core.isAuthorizedUser(message.from.id); }
        catch (e) { console.warn('Telegram /start authorization check failed:', String(e && e.message || e)); }
        await sendStartMessage(token, message.chat.id, authorized, linked);
      }
    }
    if (update.callback_query) {
      await core.telegram('answerCallbackQuery', token, { callback_query_id: update.callback_query.id }).catch(() => {});
    }
  } catch (e) {
    // Return 200 to Telegram even if a greeting fails; otherwise Telegram retries
    // the same update repeatedly. The error remains visible in Netlify function logs.
    console.error('telegram-bot webhook error:', e && e.stack ? e.stack : String(e));
  }
  return ok();
}
