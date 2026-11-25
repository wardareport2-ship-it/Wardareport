STOCK BOOK — INTEGRATED NEW MAIN SYSTEM r1

WHAT THIS PACKAGE DOES
- Makes the approved new Stock Book design the main /index.html shell.
- Connects its navigation, global search, store filter and quick actions to the existing signed-in Stock Book application.
- Preserves the previous authenticated app as /legacy-app.html. Its Firebase login, Firestore data, BILLZ sync, sales/import/transfer/write-off forms, Management Analytics, reports and access controls remain in that application.
- Preserves the existing Telegram Mini App at /tg/ and the current Netlify Functions.
- Does not create a new database, migrate data, or change Firebase/Supabase credentials.

DEPLOYMENT
1. Back up the existing Netlify site and keep the current deployment available.
2. Extract this ZIP. The folder containing index.html, netlify.toml, package.json and netlify/ is the project root.
3. On Windows, run DEPLOY-NETLIFY-PREVIEW-WINDOWS.bat. It runs the integrated preflight and creates a DRAFT preview deployment (not production). Link the folder to a new staging site. Do not overwrite production until tests pass.
4. Reuse the existing production environment variables on the staging site only after confirming the intended Firebase/Supabase/BILLZ project and credentials. Never paste secret values into source files.
5. Test login, dashboard, catalog, sales, imports, transfers, write-offs, BILLZ synchronization, Management Analytics, daily reports, and /tg/ from both desktop and Telegram.
6. Confirm the browser URL for each section remains on the new main site and check Netlify Function logs for errors.
7. Only after successful tests, assign the production domain or publish the validated deploy.

IMPORTANT IMPLEMENTATION NOTES
- The new design is the actual main shell, but the existing operational sections are hosted inside a same-origin iframe to preserve the production-tested Firebase/BILLZ workflows while we transition. This is an integration bridge, not a full rewrite of every business screen.
- The iframe uses /legacy-app.html on the same domain, so the existing Firebase authentication session remains same-origin.
- The Telegram Mini App /tg/ is unchanged in this package.
- Netlify Functions and package configuration are copied from the r8 release unchanged.
- The shell only claims a signed-in workspace after the legacy app reports an authenticated Firebase session.
- Do not delete /legacy-app.html; it currently contains the operational application and its authentication/data logic.

ENVIRONMENT VARIABLES
Keep the same existing variables already required by the r8 Netlify project. At minimum, verify BILLZ_TME_KEY, TELEGRAM_BOT_TOKEN, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Also preserve the Firebase-related settings and any other variables currently configured on the production site. Use Netlify's environment-variable UI, never commit secrets.


2026-11-18 PRODUCT REPORT + IMAGE PREVIEW UPDATE
- Selecting a product opens a centered details window over the main system. The catalog remains behind a dimmed overlay.
- The product window shows the image and product details side by side, plus all-time recorded import/sale/removal totals, current stock, store breakdown and sell-through percentage.
- Existing product Excel export remains available. Print / Save PDF uses the browser print dialog.
- Product images in the Telegram Mini App can be tapped to open a large preview. Pinch zoom is supported by the browser; double-tap toggles an enlarged view.
- Product totals are calculated from non-deleted Stock Book movement records. They are not a guarantee of BILLZ reconciliation if sync is incomplete. Run BILLZ sync and compare before relying on the report as final.
- No database schema, credentials, BILLZ sync implementation or Telegram access rules were changed in this update.


2026-11-18 CATALOG STOCK UPDATE + SLOW-MOVING PRODUCTS r3
- Catalog now opens with In stock products. Fully sold-out products leave the default catalog view automatically and move to the Sold out tab. They are retained in All products and historical records; nothing is physically deleted.
- Added Slow-moving view with 30, 60, 90 and 180-day no-sale filters, last sale date, days without a sale, remaining pieces, and a Never sold count. It respects a selected store filter.
- After successful sales/import/transfer/removal commits, newly written movements are merged into the local app state immediately so the catalog quantity and product detail panel recalculate without waiting for the Firestore snapshot round-trip. Firestore remains the durable source of truth.
- Stock quantities remain based on saved Stock Book movement history. If a BILLZ sale was not synced or could not be matched to its variant, it cannot decrement that Stock Book variant yet; complete BILLZ sync and run Compare stock with BILLZ. Do not manually delete sold-out products, as that would remove their availability from the operational catalog.
