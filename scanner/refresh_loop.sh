#!/bin/bash
# Light-refresh tracked whale data about every 5 minutes until just
# before the :20 UTC hourly full scan, then stop so scanner.yml can start.
# Called from .github/workflows/follow-check.yml. Commits data only.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

git config user.name "whale-scanner-bot"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"

# A queued job may have checked out an older SHA while a scan pushed. Start from latest data.
git pull --rebase origin main || true

CHANGED=0
python3 - <<'PY' || true
from datetime import datetime
from zoneinfo import ZoneInfo
now = datetime.now(ZoneInfo("America/Los_Angeles"))
print("refresh-loop start PT %s hour=%d" % (now.strftime("%a %b %-d %-I:%M %p %Z"), now.hour))
PY

END_EPOCH=$(( $(date +%s) + ${FOLLOW_LOOP_SECS:-2880} ))

outs=(data.json proven_picks.json scanner/history.json scanner/page_embed.json scanner/capper_history.json scanner/whale_windows.json scanner/tracked_cappers.json scanner/backfill.json scanner/proven_picks.json scanner/wallet_stats.json kalshi_display.json)

should_stop() {
  python3 - <<'PY'
import sys
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
now_pt = datetime.now(ZoneInfo("America/Los_Angeles"))
if 0 <= now_pt.hour < 6:
    print("quiet hours — stopping the refresh loop")
    sys.exit(0)
utc = datetime.now(timezone.utc)
# Yield just before the :20 UTC hourly full scan.
if 18 <= utc.minute <= 20:
    print("near :20 UTC — stopping so the full scan can run")
    sys.exit(0)
sys.exit(1)
PY
}

run_once() {
  python3 scanner/gate_crypto.py decrypt
  python3 -u scanner/refresh.py --light
  python3 scanner/validate_json.py "light-refresh" "${outs[@]}" || {
    echo "light refresh produced invalid JSON; skipping this cycle"
    return 1
  }
  python3 scanner/gate_crypto.py encrypt
  git add -- "${outs[@]}"
  if git diff --cached --quiet; then
    echo "No data changes to commit."
    python3 scanner/gate_crypto.py decrypt || true
    return 0
  fi
  git commit -m "refresh $(TZ=America/Los_Angeles date '+%a %b %-d %-I:%M %p PT')"

  # Leftover unstaged/untracked files (gate.json, generated line files) must not block rebase.
  if ! git diff --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "stashing leftover files before rebase:"
    git status --short
    git stash push -u -m "refresh-loop-uncommitted" || true
  fi

  i=0
  while [ $i -lt 3 ]; do
    i=$((i + 1))
    if git pull --rebase -X theirs origin main && git push; then
      CHANGED=1
      echo "pushed light refresh $(git rev-parse --short HEAD)"
      git stash pop || true
      python3 scanner/gate_crypto.py decrypt || true
      return 0
    fi
    echo "push failed (attempt $i); retrying"
    # Data files often conflict; keep this run's data ("theirs" during rebase).
    if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
      git checkout --theirs -- "${outs[@]}" 2>/dev/null || true
      git add -- "${outs[@]}"
      if GIT_EDITOR=true git rebase --continue && git push; then
        CHANGED=1
        echo "pushed light refresh $(git rev-parse --short HEAD)"
        git stash pop || true
        python3 scanner/gate_crypto.py decrypt || true
        return 0
      fi
    fi
    git rebase --abort 2>/dev/null || true
    sleep 8
  done
  echo "gave up pushing this light refresh"
  git stash pop || true
  python3 scanner/gate_crypto.py decrypt || true
  return 1
}

# Always do one pass (even if this job started late in the :18–:20 yield
# window), then repeat every 5 minutes until the window ends.
FIRST=1
while true; do
  if [ "$FIRST" != 1 ] && should_stop; then
    break
  fi
  FIRST=0
  START=$(date +%s)
  echo "==== light refresh $(date -u +%H:%M:%SZ) ===="
  run_once || echo "light refresh iteration failed; will try again next cycle"
  NOW=$(date +%s)
  if [ "$NOW" -ge "$END_EPOCH" ]; then
    break
  fi
  SLEEP=$((START + 300 - NOW))
  if [ "$SLEEP" -lt 5 ]; then
    SLEEP=5
  fi
  LEFT=$((END_EPOCH - $(date +%s)))
  if [ "$LEFT" -le 15 ]; then
    break
  fi
  if should_stop; then
    break
  fi
  if [ "$SLEEP" -gt "$LEFT" ]; then
    SLEEP=$LEFT
  fi
  echo "sleeping ${SLEEP}s until the next light refresh"
  sleep "$SLEEP"
done

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  if [ "$CHANGED" = "1" ]; then
    echo "value=1" >> "$GITHUB_OUTPUT"
  else
    echo "value=0" >> "$GITHUB_OUTPUT"
  fi
fi
echo "FOLLOW_LOOP_CHANGED=${CHANGED}"
