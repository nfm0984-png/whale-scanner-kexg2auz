# Whale Scanner
Static site (index.html + app.js + data.json) on GitHub Pages.

Cadence (America/Los_Angeles, DST-safe):
- Hourly full top-200 OrcaLayer scan at :20, from 6 AM to midnight PT (`.github/workflows/scanner.yml`).
- Light ESPN/Kalshi/positions refresh about every 5 minutes from 6 AM to midnight PT (`.github/workflows/follow-check.yml`).
- Both scheduled jobs no-op midnight–6 AM PT. Manual Run scan / Run refresh (workflow_dispatch) always works, including overnight.

The in-page Scan / Refresh buttons dispatch `scanner.yml` with a built-in GitHub access key (Actions: Read and write). If that key cannot start a run, use **Run scan on GitHub**, or grant a fine-grained PAT Actions: Read and write on `whale-scanner-kexg2auz` at https://github.com/settings/personal-access-tokens.

Scans and refreshes commit `data.json` + `scanner/history.json` + `scanner/page_embed.json` + `scanner/capper_history.json` (rebase keeps this run's data on conflicts) and redeploy Pages via `pages.yml`.
UI source: `src/` (React, bundled by `build.sh` with esbuild).
