TELEGRAM — NETLIFY MINI APP

The Telegram Mini App is hosted on the same Netlify site at /tg/. The bot webhook is /.netlify/functions/telegram-bot.

Access is available through either the saved private group or an individual username invitation. For individual access, add the username in Stock Book → Reports → Access Management. The person then opens @wardareport2026_bot and presses /start privately; the webhook links the Telegram user ID and sends a Dashboard button. The individual-access table must first be created by running SUPABASE-TELEGRAM-SCHEMA.sql in the existing Supabase project.

The bot only answers private /start and /help messages. It does not post sales reports or product photos into groups.

Set TELEGRAM_BOT_TOKEN, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables. Enable the Dashboard menu button once after verifying /tg/ on the intended Netlify site. Do not also configure the bot on Render: Telegram permits one active webhook per bot.
