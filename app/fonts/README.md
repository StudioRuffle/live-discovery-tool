# Fonts (not in git)

`Raghero-Regular.otf` belongs here for local builds (`app/layout.tsx` loads
it via `next/font/local`). It's deliberately excluded from this public
repo's git history since it's a licensed font file, not something cleared
for redistribution — see `.gitignore`.

If you're setting up a fresh clone, get the font file from Chris and drop
it in as `app/fonts/Raghero-Regular.otf` before running `npm run build`.
Deploys from a machine that already has the file (via `netlify deploy`,
which uploads the local build output rather than re-cloning from GitHub)
aren't affected either way.
