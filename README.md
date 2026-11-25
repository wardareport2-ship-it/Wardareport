# Warda Stock Book

This release includes the existing Stock Book application, Telegram Mini App, and an additional Docker-based VPS deployment option.

Read **README-VPS-DEPLOY.md** for hosting migration instructions. Do not change production DNS or the Telegram webhook until a staging deployment has passed the checklist.

The main Stock Book now includes a **Business Intelligence overview** in the Analytics section, with Sales Performance, Product Intelligence, Financial Intelligence and internal Market Intelligence signals, plus category reporting for clothing, shoes, accessories, cosmetics and hair. See **BI-ANALYTICS-AND-THEMES.txt** for exact data definitions and limitations.

The Style panel includes named professional analytics themes, existing theme presets and custom image/JSON palette upload. Theme changes apply immediately and are stored in the current browser; no deployment is needed to change a theme.

Do not upload real secrets. Keep the existing Firebase and Supabase projects and verify all live integrations on a staging domain before switching production DNS or the Telegram webhook.
