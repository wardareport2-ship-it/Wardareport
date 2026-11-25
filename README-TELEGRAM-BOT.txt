TELEGRAM BOT — NETLIFY MINI APP

The bot handles private /start and /help commands by checking authorization and sending an inline Dashboard button that opens the same Netlify site at /tg/. It records group updates for Access Management and does not post reports or product photos into groups.

Access can be granted in either of two independent ways:
1. Membership in the saved private Telegram group, where the bot is an administrator.
2. An individual username invitation created in Stock Book → Reports → Access Management. The user opens the bot and presses /start; the webhook links their Telegram user ID and activates their private Dashboard access.

Run SUPABASE-TELEGRAM-SCHEMA.sql in the existing Supabase project once to create the individual-access table. Keep TELEGRAM_BOT_TOKEN, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables only.

Only use the Netlify Access Management → Enable Dashboard action to configure the webhook/menu. Do not also configure this same bot from Render or another deployment: Telegram allows only one active webhook per bot.
