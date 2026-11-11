# Whale Scanner
Static site (index.html + app.js + data.json) on GitHub Pages. Scan / Refresh buttons dispatch `.github/workflows/scanner.yml`,
which runs `scanner/scan.py --cappers N` (OrcaLayer, secret `ORCA_API_KEY`) or `scanner/refresh.py` (ESPN + Kalshi only),
commits `data.json` + `scanner/history.json` + `scanner/page_embed.json`, and redeploys Pages.
UI source: `src/` (React, bundled by `build.sh` with esbuild).
