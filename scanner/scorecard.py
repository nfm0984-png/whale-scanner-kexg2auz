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



def _payout(px):
    if isinstance(px, (int, float)) and 0 < px < 1:
        return 1.0 / px
    return None


def _bucket_stats(rows):
    w = l = pending = 0
    pnl = 0.0
    for r in rows:
        res = r.get("result")
        if res == "W":
            w += 1
        elif res == "L":
            l += 1
        elif res == "pending":
            pending += 1
        u = r.get("pnl")
        if isinstance(u, (int, float)):
            pnl += u
    return {"w": w, "l": l, "pending": pending, "pnl": round(pnl, 2), "n": len(rows)}


def signal_breakdown(picks):
    agree, single, singles, combos, dogs, favs = [], [], [], [], [], []
    for p in picks:
        if (p.get("agree") or 1) >= 2:
            agree.append(p)
        else:
            single.append(p)
        if p.get("combo"):
            combos.append(p)
        else:
            singles.append(p)
        pay = p.get("payout")
        if pay is None:
            pay = _payout(p.get("price") if p.get("price") is not None else p.get("kprice"))
        if isinstance(pay, (int, float)):
            (dogs if pay >= 2.0 else favs).append(p)
    out = []
    for label, rows in (
        ("2+ agree", agree),
        ("Single capper", single),
        ("Singles", singles),
        ("Combos", combos),
        ("Underdogs (≥2.0x)", dogs),
        ("Favorites (<2.0x)", favs),
    ):
        if not rows:
            continue
        st = _bucket_stats(rows)
        st["label"] = label
        out.append(st)
    return out



def yes_no(side):
    u = (side or "").strip().upper()
    if u in ("Y", "YES") or u.endswith(" YES") or "BUY YES" in u:
        return "YES"
    if u in ("N", "NO") or u.endswith(" NO") or "BUY NO" in u:
        return "NO"
    return u


def _dedupe_key(p):
    tk = (p.get("ticker") or "").strip().upper()
    yn = yes_no(p.get("yesNo") or p.get("side"))
    if tk and yn:
        return ("t", tk, yn)
    return ("q", (p.get("q") or p.get("label") or "").strip().lower(), yn, p.get("start") or p.get("startTs") or 0)


def dedupe_picks(raw):
    groups, order = {}, []
    for p in raw:
        k = _dedupe_key(p)
        if k not in groups:
            groups[k] = []
            order.append(k)
        groups[k].append(p)
    out = []
    for k in order:
        rows = groups[k]
        names = []
        for r in rows:
            n = (r.get("capper") or "").strip()
            if n and n not in names:
                names.append(n)
        agree = max(len(names) or 0, max((r.get("agree") or 1) for r in rows), len(rows))
        results = [r.get("result") for r in rows]
        if "W" in results and "L" not in results:
            res = "W"
        elif "L" in results and "W" not in results:
            res = "L"
        else:
            res = rows[0].get("result") or "pending"
        proto = dict(rows[0])
        yn = yes_no(proto.get("yesNo") or proto.get("side"))
        proto["yesNo"] = yn
        proto["side"] = yn
        proto["result"] = res
        proto["agree"] = agree
        proto["cappers"] = names
        proto["capper"] = names[0] if len(names) == 1 else proto.get("capper") or ""
        proto["capperNote"] = names[0] if len(names) == 1 else (("%d capper%s" % (agree, "" if agree == 1 else "s")) if agree else "")
        pnl = None
        price = proto.get("price") if proto.get("price") is not None else proto.get("kprice")
        for r in rows:
            if r.get("result") == res:
                if r.get("pnl") is not None and pnl is None:
                    pnl = r.get("pnl")
                rp = r.get("price") if r.get("price") is not None else r.get("kprice")
                if rp is not None and price is None:
                    price = rp
        proto["price"] = price
        proto["kprice"] = price
        proto["payout"] = None if _payout(price) is None else round(_payout(price), 2)
        proto["pnl"] = None if pnl is None or (isinstance(pnl, (int, float)) and abs(pnl) < 0.005) else (round(pnl, 2) if isinstance(pnl, (int, float)) else pnl)
        out.append(proto)
    return out


def drop_split_picks(picks):
    from collections import defaultdict
    by_tk, by_q = defaultdict(set), defaultdict(set)
    for p in picks:
        yn = yes_no(p.get("yesNo") or p.get("side"))
        tk = (p.get("ticker") or "").strip().upper()
        if tk and yn in ("YES", "NO"):
            by_tk[tk].add(yn)
        qk = ((p.get("q") or "").strip().lower(), p.get("start") or p.get("startTs") or 0)
        if qk[0] and yn in ("YES", "NO"):
            by_q[qk].add(yn)
    split_tk = {tk for tk, s in by_tk.items() if "YES" in s and "NO" in s}
    split_q = {k for k, s in by_q.items() if "YES" in s and "NO" in s}
    kept, hidden = [], set()
    for p in picks:
        tk = (p.get("ticker") or "").strip().upper()
        qk = ((p.get("q") or "").strip().lower(), p.get("start") or p.get("startTs") or 0)
        if (tk and tk in split_tk) or (qk[0] and qk in split_q):
            hidden.add(tk or qk[0])
            continue
        kept.append(p)
    return kept, len(hidden)


def totals_of(picks):
    w = l = pending = 0
    pnl = 0.0
    pnl_known = True
    for p in picks:
        res = p.get("result")
        if res == "W":
            w += 1
            if p.get("pnl") is None:
                pnl_known = False
        elif res == "L":
            l += 1
            if p.get("pnl") is None:
                pnl_known = False
        elif res == "pending":
            pending += 1
        u = p.get("pnl")
        if isinstance(u, (int, float)):
            pnl += u
    return w, l, pending, round(pnl, 2), pnl_known


def day_summary(data):
    return {
        "date": data.get("date"),
        "label": data.get("label"),
        "w": data.get("w") or 0,
        "l": data.get("l") or 0,
        "pending": data.get("pending") or 0,
        "pnl": data.get("pnl"),
        "n": len(data.get("picks") or []),
    }


def merge_history(existing, data):
    hist = list((existing or {}).get("history") or [])
    if not hist and existing and existing.get("date") and existing.get("date") != data.get("date"):
        hist.append(day_summary(existing))
    hist = [h for h in hist if h.get("date") != data.get("date")]
    hist.append(day_summary(data))
    hist.sort(key=lambda h: h.get("date") or "")
    return hist[-7:]


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
        kprice = row.get("kprice")
        kal = row.get("kalshi") or ""
        ticker = (row.get("ticker") or "").strip()
        if not ticker.upper().startswith("KX"):
            tok = (kal.split()[0] if kal else "")
            ticker = tok if tok.upper().startswith("KX") else ""
        item = {
            "label": row.get("label") or "",
            "q": row.get("q") or "",
            "side": row.get("side") or "",
            "yesNo": yes_no(row.get("side")),
            "start": row.get("start") or "",
            "ticker": ticker,
            "result": res,
            "invested": invested,
            "pnl": units,
            "price": kprice,
            "kprice": kprice,
            "payout": None if _payout(kprice) is None else round(_payout(kprice), 2),
            "agree": int(row.get("whales") or 1),
            "combo": bool(row.get("combo") or (row.get("tier") == "combo") or ("combo" in kal.lower())),
        }
        picks.append(item)
    picks = dedupe_picks(picks)
    picks, hidden_splits = drop_split_picks(picks)
    picks.sort(key=lambda r: (r.get("start") or "", r.get("label") or ""))
    w, l, pending, pnl, pnl_known = totals_of(picks)
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
        "pnlNote": "Flat $100 at the Kalshi price (not whale size) · unique contracts only",
        "hiddenSplits": hidden_splits,
        "breakdown": signal_breakdown(picks),
        "picks": picks,
    }


def write(path=OUT, now=None):
    existing = {}
    if os.path.exists(path):
        try:
            existing = json.load(open(path))
        except Exception:
            existing = {}
    data = build(now)
    data["history"] = merge_history(existing, data)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return data


if __name__ == "__main__":
    d = write()
    print("scorecard", d["label"], "%d-%d" % (d["w"], d["l"]), "pending", d["pending"], "pnl", d["pnl"], "n", len(d["picks"]), "hiddenSplits", d.get("hiddenSplits") or 0, "history", len(d.get("history") or []))
