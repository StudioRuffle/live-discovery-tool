# Live Discovery Session Tool

Live workshop-facilitation tool: facilitator runs exercises on a projected
screen, attendees join on their phones with no login. Next.js (App Router) +
Supabase (Postgres, Realtime, Storage), deployed to Netlify.

Phase 0 status: scaffold + deploy pipeline only. No feature logic yet — see
`app/page.tsx` for a Supabase connectivity health check.

## Local dev setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com) (free
   tier is fine for dev).

3. Copy the env template and fill in your Supabase project's values (Project
   Settings > API in the Supabase dashboard):

   ```bash
   cp .env.example .env.local
   ```

   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public,
     safe to ship to the browser.
   - `SUPABASE_SERVICE_ROLE_KEY` — secret, server-only, bypasses Row Level
     Security. Never prefix a secret with `NEXT_PUBLIC_` or it gets bundled
     into client JS.
   - `FACILITATOR_PIN` — shared password gating the facilitator side of the
     app (checked server-side; no auth library involved).

4. Run the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) — you should see a
   green "Supabase: connected" box. Red means the URL/anon key are wrong or
   the Supabase project is paused.

## Deploying to Netlify

This repo is set up for Netlify's Next.js runtime (`netlify.toml` +
`@netlify/plugin-nextjs`), which supports the App Router, Server Components,
and Route Handlers used here.

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. In the Netlify dashboard: **Add new site > Import an existing project**,
   pick the repo. Build command and publish directory are already set via
   `netlify.toml` — no manual config needed.
3. In **Site configuration > Environment variables**, add the same four
   variables from `.env.example` with your production Supabase values.
4. Deploy. Netlify gives you a public `*.netlify.app` URL — open it on your
   phone over cellular (not the same wifi as your laptop) to confirm it's
   actually reachable off your local network.

Alternatively, from the CLI:

```bash
npx netlify login      # opens a browser to authenticate your Netlify account
npx netlify init        # links this folder to a Netlify site
npx netlify deploy --prod
```

## Env vars reference

See [.env.example](.env.example) for the full list with descriptions. Every
var used by the app must be documented there.

## Architecture notes

- `lib/supabase/client.ts` — browser client (anon key), for Client Components
  and Realtime subscriptions.
- `lib/supabase/server.ts` — server client (anon key), for Server Components
  and Route Handlers. Respects RLS.
- `lib/supabase/admin.ts` — service-role client. Server-only (`server-only`
  package makes an accidental client import a build error). Used behind the
  facilitator PIN gate to bypass RLS for facilitator writes.
- `app/api/health/route.ts` — connectivity check hit by the homepage.
