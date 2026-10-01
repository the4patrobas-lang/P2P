# TZS-USDT-INR Money Exchange Ledger

A modern money exchange tracking web app for recording TZS credited amounts, USDT purchases, Google/Binance INR rates, and automatic arbitrage profit calculations.

## Features

- Add transactions with live FX preview
- Automatic 2.5% bonus on trades above 100,000 TZS
- Monthly / weekly / daily summaries
- Doughnut gauges and bar chart analytics
- Ledger search and delete actions
- Excel export
- Cloud database sync (Supabase) with user accounts
- Local demo mode when cloud config is not set
- Vercel-ready static deployment configuration

## Vercel deployment

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Keep the default settings, or set the project root to the repository root.
4. No build command is required for this static app.
5. Set the deployment output to the repository root.
6. Update `config.js` with your real Supabase values if you want cloud login and cross-device syncing.

Example:
```js
window.APP_CONFIG = {
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key',
  enableCloudStorage: true
};
```

7. Deploy.

## Local development

Open the project folder and run a local static server:

```bash
python3 -m http.server 8000
```

Then open:
```text
http://localhost:8000
```

## Database setup (Supabase)

1. Create a Supabase project.
2. Open SQL Editor.
3. Run the schema in `supabase/schema.sql`.
4. Update `config.js` with the project URL and anon key.
5. Ensure Row-Level Security is enabled for the `transactions` table.

## Demo mode

If the Supabase values are not configured, the app works in local browser demo mode and stores data in localStorage.

## Security note

For production use, do not expose service-role keys in browser code. Use anon keys with RLS enabled.
