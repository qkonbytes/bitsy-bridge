# bitsy_bridge

Dashboard UI shell for the ERP → Shopify sync tool. Vite + React, no backend wired up yet — all data is mocked in `src/App.jsx`.

## Run locally

```
cp .env.example .env.local
# fill in .env.local with your bitsy-bridge-control project's URL + anon key
npm install
npm run dev
```

Opens at http://localhost:5173

## Admin login

The admin side now uses real Supabase Auth against your `bitsy-bridge-control` project. Only users listed in the `platform_admins` table (with a matching `auth.users` row) can get past login — everyone else sees a "not set up as a platform admin" screen. The customer side still uses the "Preview as" mock toggle until per-client project auth is wired in.

**On Vercel**: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Project Settings → Environment Variables, then redeploy — `.env.local` only applies locally.

## Deploy to Vercel

**Option A — GitHub + Vercel import (recommended, easiest to keep updating)**

1. Create a new empty repo on GitHub (e.g. `bitsy-bridge`).
2. From this folder:
   ```
   git init
   git add .
   git commit -m "Initial dashboard shell"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bitsy-bridge.git
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), sign in, and import that GitHub repo.
4. Vercel auto-detects Vite (the included `vercel.json` also pins this). Click **Deploy**.
5. You'll get a live `*.vercel.app` URL. Every push to `main` auto-redeploys.

**Option B — Vercel CLI (faster one-off, no GitHub needed)**

1. Install the CLI: `npm i -g vercel`
2. From this folder: `vercel login`, then `vercel`
3. Follow the prompts (link to a new project, accept defaults — it'll detect Vite automatically).
4. `vercel --prod` for the production URL once you're happy with a preview.

## Next steps once live

- Wire up the Supabase project (env vars for `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`) and replace the mock data in `src/App.jsx` with real queries.
- Build the Shopify OAuth connect flow (currently a disabled placeholder button in Settings/Connections).
- Add real auth (Supabase Auth) to replace the "Preview as" role switcher in the top bar — that switcher is dev-only and should be removed once real login exists.
