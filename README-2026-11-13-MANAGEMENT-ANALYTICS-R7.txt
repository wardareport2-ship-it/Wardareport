STOCK BOOK — MANAGEMENT ANALYTICS r7
Release: 2026-11-13-stockbook-management-analytics-r7
Package version: 1.6.1

SCOPE
- Main Stock Book system: adds a Management Analytics section with date-range and store filters.
- Telegram Mini App: adds ONLY a simple Cash vs Card chart to the selected daily/weekly/monthly report.
- No full Management Analytics page, seller rankings, Excel export, Other payment series, or payment comparison table is added to the Mini App.
- Existing Mini App reports, product rankings, store selectors and comparison view remain otherwise unchanged.

MAIN SYSTEM MANAGEMENT ANALYTICS
- BILLZ payment amounts grouped by cash/card/other payment type.
- BILLZ seller performance: revenue, gross profit where returned, discounts where returned, units sold and returns.
- Store performance, salesperson ranking, daily revenue trend and Excel export.
- Date range limit: 366 days; optional single-store filtering.
- Read-only BILLZ endpoints: /v1/transaction-report-totals and /v1/seller-general-table.

TELEGRAM MINI APP
- Displays only two series: Naqd (cash) and Karta (card), using BILLZ payment-type totals for the selected report period and store scope.
- If BILLZ payment totals are missing, the chart shows an unavailable message rather than invented zero values.
- If some stores fail to return totals, the chart is marked partial.
- The chart displays payment amounts and percentage of cash+card total. It does not claim to allocate product units to payment methods for split-tender receipts.

DEPLOYMENT
1. Back up the current deployment.
2. Upload/commit the contents of this ZIP's project root, preserving netlify/ and tg/ folder structure.
3. Keep all existing environment variables and Supabase tables unchanged.
4. Deploy to the same Netlify site; do not create a new Firebase project or delete data.
5. In the main Stock Book system, open Analytics, select date range/store and click Apply / Refresh.
6. In the Telegram Mini App, open the selected day/week/month report and verify the Cash vs Card chart against BILLZ.

IMPORTANT DATA NOTES
- Cash/card amounts are money totals grouped by the actual BILLZ payment type labels for SALE receipts. A split-tender receipt contributes the respective money to each method; product units are not arbitrarily split.
- Payment labels that are not clearly cash or card remain grouped as Other in the main system. They are not shown in the Mini App chart.
- Gross profit and discount values are shown only when BILLZ returns those fields.
- Live financial reconciliation must be verified after deployment using a BILLZ key with permission to access the reporting endpoints.
