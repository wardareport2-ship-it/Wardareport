# Warda Stock Book — VPS deployment package

This package is based on `StockBook-Netlify-v1.8.4-Redirect-Loop-Fix.zip` and adds a Docker deployment path for a paid Linux VPS. It keeps the existing application code, Firebase project, Supabase project, BILLZ integration, and Telegram Mini App routes. It does not migrate or modify database contents.

## Important before going live

- This is a migration package, not a claim that the live BILLZ/Firebase/Supabase/Telegram integrations have been tested. They must be verified on a staging URL.
- Use a paid VPS with a persistent Linux server and Docker Engine + Docker Compose. Avoid free/sleeping hosting for the always-on main system.
- Keep exactly ONE running instance while the in-process scheduled jobs are enabled, to avoid duplicate scheduled executions.
- Keep your old Netlify deployment and DNS unchanged until the new deployment passes the full checklist.
- Never put real secrets in this ZIP, GitHub, or a public repository.

## 1. Prepare the VPS

Create a Linux VPS (Ubuntu 22.04/24.04 recommended) with a static public IP. Install Docker Engine and the Docker Compose plugin using the official Docker instructions:
https://docs.docker.com/engine/install/ubuntu/

Point a test subdomain (for example `stockbook-test.yourdomain.com`) to the VPS IP. Configure HTTPS using a reverse proxy such as Caddy or Nginx before exposing the app publicly. Telegram Mini Apps require HTTPS.

## 2. Upload and configure

Upload and extract this entire ZIP to a directory such as `/opt/warda-stock-book`.

From that directory:

```bash
cp .env.example .env
nano .env
```

Fill `.env` with the same existing values currently used by your working Stock Book deployment:

- `BILLZ_TME_KEY`
- `TELEGRAM_BOT_TOKEN`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- Firebase Web App settings
- `FIREBASE_SERVICE_ACCOUNT_JSON` if the all-device session-revocation feature is used

Set `PUBLIC_URL` to the final public HTTPS URL, without a trailing slash. Do not create new Firebase or Supabase projects for this migration. Preserve any additional environment variables used by the current BILLZ integration.

## 3. Build and start

```bash
docker compose up -d --build
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f --tail=200
```

The health endpoint is `/healthz`. The main site is `/`, and the Telegram Mini App is `/tg/`. Existing function-style routes remain under `/.netlify/functions/...` so current frontend URLs can continue to work through the included Node adapter.

## 4. Telegram webhook

After HTTPS is active and `PUBLIC_URL` is correct, use the Stock Book's existing Telegram setup / Enable Dashboard workflow on the new URL, if available. Telegram permits one active webhook per bot: switching it to the new host will stop webhook updates from reaching the old host. Do this only during the cutover window and test `/start` plus the Dashboard button.

## 5. Cutover checklist

Test all of these with a test user/date/store before changing the production domain:

- Login/logout and permissions
- Main dashboard and navigation
- Catalog search, product details, variants, colors, sizes, images
- BILLZ product and transaction synchronization
- Sales, returns, transfers, write-offs and closing-stock reconciliation
- Reports for each store and overall
- Telegram `/tg/` Mini App authentication and dashboard data
- Telegram webhook and authorized/unauthorized access
- `last sync` timestamp and failure logging
- Scheduled dashboard cache warm-up

Only after these pass should you switch the production DNS/domain to the VPS. Keep Netlify as rollback until the new host is stable.

## 6. Operations

Update the app:

```bash
docker compose up -d --build
```

Restart:

```bash
docker compose restart
```

View logs:

```bash
docker compose logs -f --tail=200
```

Back up `.env` securely outside the server. Database backups must be handled separately through the existing Firebase and Supabase backup/export processes.

## Architecture notes

- The Node adapter serves the main app and `/tg/` and routes `/.netlify/functions/*` to the existing function files.
- Scheduled functions declared with Netlify `config.schedule` are run by the single Node process using UTC cron expressions.
- Background function endpoints return HTTP 202 and continue processing in the running process.
- A VPS does not have Netlify-style monthly deploy credits, but it has a recurring VPS bill and provider resource/network limits. Monitor CPU, RAM, disk, and bandwidth.
