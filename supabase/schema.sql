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

## Quick start

1. Install Node.js 18+
2. Run:
   ```bash
   npm install
   npm start
   ```
3. Open http://localhost:3000

## Database setup (Supabase)

1. Create a Supabase project
2. Open SQL Editor
3. Run the schema in `supabase/schema.sql`
4. Open `app.js`
5. Replace:
   ```js
   const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
   ```
   with your actual Supabase project values.
6. Make sure Row-Level Security is enabled for the `transactions` table and the provided policy works.

## Demo mode

If the Supabase keys are not configured, the app still works in browser demo mode and stores data in localStorage for the current browser.

## Security note

For a production deployment, do not expose service-role keys in the browser. Only use anon keys with proper Row Level Security.
