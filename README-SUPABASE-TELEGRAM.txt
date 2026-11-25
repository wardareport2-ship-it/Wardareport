SUPABASE — TELEGRAM ACCESS AND REPORT CACHE

Supabase stores Telegram group settings, individual Telegram user invitations, seen chats and prepared reporting snapshots/caches. Firebase remains the source of truth for the main Stock Book catalog, inventory and operational data.

Required server-side environment variables:
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- TELEGRAM_BOT_TOKEN

Run SUPABASE-TELEGRAM-SCHEMA.sql in the SQL Editor of the existing Supabase project. It creates or retains the required tables and can be safely re-run. The individual user table stores a pending username invitation and links the permanent Telegram user ID only after that user sends /start privately to the bot.

Enable row-level security is applied and anon/authenticated roles are revoked. Only the server-side service_role key should access these tables. Never place the service role key in frontend code or commit it to GitHub.
