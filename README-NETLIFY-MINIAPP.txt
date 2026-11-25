STOCK BOOK — MAIN SYSTEM + TELEGRAM MINI APP (NETLIFY)
Release: 2026-11-22-netlify-main-miniapp-r2
Version: 1.8.2

PURPOSE
This is one unified Netlify deployment. The main Stock Book system and Telegram Mini App share the same Netlify site and domain. Open the Mini App at:
  https://YOUR-SITE.netlify.app/tg/

There is no separate Render Mini App service in this setup. You may leave the old Render service unused; do not configure the bot to point to it.

NETLIFY DEPLOYMENT
1. Extract this ZIP. The extracted root must contain index.html, legacy-app.html, package.json, netlify.toml, netlify/, and tg/.
2. Deploy the extracted root as the site root, preferably from a GitHub repository connected to Netlify so Netlify Functions are built and deployed.
3. Build command: npm install
4. Publish directory: .
5. Functions directory is already configured in netlify.toml as netlify/functions.
6. Node version is already configured in netlify.toml.
7. Copy existing Netlify environment variables from the current main site. Do not create a new Firebase or Supabase project.

REQUIRED EXISTING NETLIFY VARIABLES
- BILLZ_TME_KEY
- TELEGRAM_BOT_TOKEN
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

Keep all existing Firebase-related environment variables already used by the main app. FIREBASE_SERVICE_ACCOUNT_JSON is only needed if your existing all-device session-revocation feature uses it; do not generate a new Firebase project.

No MINIAPP_URL or RENDER_EXTERNAL_URL variable is required. Netlify provides process.env.URL and the existing Telegram Access Management function uses that site URL.

TELEGRAM URLS AFTER DEPLOY
- Mini App: https://YOUR-SITE.netlify.app/tg/
- Webhook: https://YOUR-SITE.netlify.app/.netlify/functions/telegram-bot
- Dashboard API: https://YOUR-SITE.netlify.app/.netlify/functions/tg-dashboard
- Background cache worker: https://YOUR-SITE.netlify.app/.netlify/functions/daily-telegram-report-background

ACTIVATE ONLY AFTER VERIFYING THE DEPLOY
1. Open https://YOUR-SITE.netlify.app/tg/ in a normal browser. It should load the Mini App page (it may ask you to open it inside Telegram to authenticate).
2. Open https://YOUR-SITE.netlify.app/.netlify/functions/tg-dashboard in a browser. GET should return a method response such as 405, not a Netlify 404. The dashboard uses POST from the Mini App.
3. Test the Telegram dashboard from the Stock Book system's Telegram Mini App / Access Management screen by using its Enable Dashboard action. The existing Netlify function will set the bot webhook and Dashboard menu button to this same Netlify site.
4. Test the Dashboard button inside Telegram.

IMPORTANT TELEGRAM WEBHOOK RULE
A Telegram bot can have only one active webhook. Do not run the old Render configure:telegram command. Do not configure the bot to Render. Do not use the old Render service's webhook setup. After the Netlify deployment is confirmed, use the main system's Enable Dashboard action once; it configures the webhook and menu on this unified Netlify site. If another environment configures the same bot later, it can overwrite this webhook.

ACCESS MODEL
Access supports both the saved private group and individual username invitations. Run SUPABASE-TELEGRAM-SCHEMA.sql in the existing Supabase SQL Editor once. An individual presses /start in the private bot chat after you add their username in Reports → Access Management; the webhook links the Telegram user ID and returns the Dashboard button. All approved individual users can see all four stores. Group membership remains a separate access route.

DATA / SAFETY
- The Mini App reads BILLZ/report data through the existing Netlify Functions and uses the same Supabase report/cache tables as the main system.
- Firebase operational data is not migrated or copied.
- Do not place TELEGRAM_BOT_TOKEN, BILLZ_TME_KEY, SUPABASE_SERVICE_ROLE_KEY, Firebase service account JSON, or other secrets in GitHub files or client-side HTML.
- Deploy to a separate Netlify staging site first if possible. Do not replace the production deploy until login, BILLZ sync, catalog, reports, /tg/, and Telegram Dashboard tests pass.
