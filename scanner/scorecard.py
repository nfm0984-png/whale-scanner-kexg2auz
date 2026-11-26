#!/usr/bin/env python3
"""Build yesterday's scanner-pick scorecard (W-L and $) from scanner/history.json."""
import json, os, re
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
HIST = os.path.join(HERE, "history.json")
OUT = os.path.join(ROOT, "scorecard.json")
PT = ZoneInfo("America/Los_Angeles")
FLAT_STAKE = 100  # copy-size unit; not the whale's invested size
# "Thu Nov 12, 9:00 AM PT" or "Thu Nov 12, 9:00 AM"
START_RE = re.compile(
    r"(?:^[A-Za-z]{3} )?([A-Za-z]{3}) (\d{1,2}),? (?:(\d{4}),? )?(\d{1,2}):(\d{2})\s*(AM|PM)",
    re.I,
)
ISO_RE = re.compile(r"^(\d{4})-(\d{2})-(\d{2})")
MONTHS = {m: i for i, m in enumerate("Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(), 1)}


def parse_start(s, year_hint):
    if not s or not isinstance(s, str):
        return None
    s = s.strip()
    m = ISO_RE.match(s)
    if m:
        try:
            return datetime(int(m.group(1)), int(m.group(2)), int(m.group(3)), tzinfo=PT)
        except ValueError:
            return None
    m = START_RE.search(s)
    if not m:
        return None
    mon, day, year_s, hour, minute, ampm = m.group(1).title(), int(m.group(2)), m.group(3), int(m.group(4)), int(m.group(5)), m.group(6).upper()
    mo = MONTHS.get(mon)
    if not mo:
        return None
    if hour == 12:
        hour = 0 if ampm == "AM" else 12
    elif ampm == "PM":
        hour += 12
    year = int(year_s) if year_s else year_hint
    try:
        return datetime(year, mo, day, hour, minute, tzinfo=PT)
    except ValueError:
        return None


def _pnl(result, invested, kprice):
    """Flat $100 at the Kalshi price. Missing price: $0 on a win is omitted; a loss is -$100."""
    if result not in ("W", "L"):
        return None
    if isinstance(kprice, (int, float)) and 0 < kprice < 1:
        units = (1.0 / kprice - 1.0) if result == "W" else -1.0
        return round(FLAT_STAKE * units, 2)
    if result == "L":
        return round(-FLAT_STAKE, 2)
    return None


def yesterday_date(now=None):
    now = now or datetime.now(PT)
    return (now.astimezone(PT) - timedelta(days=1)).date()


def build(now=None):
    now = now or datetime.now(PT)
    day = yesterday_date(now)
    hist = json.load(open(HIST)) if os.path.exists(HIST) else {"picks": {}}
    picks = []
    w = l = pending = 0
    pnl = 0.0
    pnl_known = True
    raw = hist.get("picks") or {}
    if isinstance(raw, list):
        rows = raw
    else:
        rows = list(raw.values())
    for row in rows:
        # Only Kalshi-linked scanner picks, dated from the listed start time (no first-seen fallback).
        kal = (row.get("kalshi") or "")
        if kal.lower().startswith("polymarket only") and row.get("kprice") is None:
            continue
        st = parse_start(row.get("start") or "", day.year)
        if st is None or st.date() != day:
            continue
        result = row.get("result")
        if result in ("W", "WIN", "win"):
            res = "W"
        elif result in ("L", "LOSS", "loss", "MISSED", "missed"):
            res = "L"
        elif result in ("P", "PUSH", "push"):
            res = "P"
        else:
            res = "pending"
        invested = row.get("invested")
        units = _pnl(res, invested, row.get("kprice"))
        item = {
            "label": row.get("label") or "",
            "q": row.get("q") or "",
            "side": row.get("side") or "",
            "start": row.get("start") or "",
            "result": res,
            "invested": invested,
            "pnl": units,
        }
        picks.append(item)
        if res == "W":
            w += 1
            if units is None:
                pnl_known = False
            else:
                pnl += units
        elif res == "L":
            l += 1
            if units is None:
                pnl_known = False
            else:
                pnl += units
        elif res == "pending":
            pending += 1
    picks.sort(key=lambda r: (r.get("start") or "", r.get("label") or ""))
    label = datetime(day.year, day.month, day.day, tzinfo=PT).strftime("%a %b %-d, %Y") + " PT"
    return {
        "date": day.isoformat(),
        "label": label,
        "updatedAt": now.astimezone(PT).strftime("%a %b %-d · %-I:%M %p PT"),
        "w": w,
        "l": l,
        "pending": pending,
        "pnl": round(pnl, 2),
        "pnlPartial": (not pnl_known),
        "pnlNote": "Flat $100 at the Kalshi price (not whale size)",
        "picks": picks,
    }


def write(path=OUT, now=None):
    data = build(now)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return data


if __name__ == "__main__":
    d = write()
    print("scorecard", d["label"], "%d-%d" % (d["w"], d["l"]), "pending", d["pending"], "pnl", d["pnl"], "n", len(d["picks"]))
