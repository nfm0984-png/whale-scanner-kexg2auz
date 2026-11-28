#!/usr/bin/env python3
"""Capper bet-size confidence labels (display only — never used to filter picks).

Compare each capper's USD stake to their median stake at similar odds.
High confidence = 3x usual or more. Fun bet = 0.5x usual or less.
Need 8 past bets in the odds bucket (fallback to all odds, and say which).
"""
from __future__ import annotations

import json
import os
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

MIN_HISTORY = 8
HIGH_MULT = 3.0
FUN_MULT = 0.5

# Odds buckets so longshots are compared to longshots and favorites to favorites.
# [lo, hi)
BUCKETS = (
    ("longshot", 0.01, 0.35),
    ("mid", 0.35, 0.65),
    ("favorite", 0.65, 0.85),
    ("heavy", 0.85, 1.00),
)


def odds_bucket(avg):
    """Return bucket name for an entry price in (0, 1], or None if unusable."""
    try:
        px = float(avg)
    except (TypeError, ValueError):
        return None
    if not (0.01 <= px <= 1.0):
        return None
    if px >= 1.0:
        return "heavy"
    for name, lo, hi in BUCKETS:
        if lo <= px < hi:
            return name
    return None


def _median(xs):
    if not xs:
        return None
    ys = sorted(xs)
    n = len(ys)
    mid = n // 2
    if n % 2:
        return float(ys[mid])
    return (float(ys[mid - 1]) + float(ys[mid])) / 2.0


def _percentile_below(value, xs):
    """Percent of xs strictly smaller than value, rounded to nearest int."""
    if not xs:
        return None
    n = sum(1 for x in xs if x < value)
    return int(round(100.0 * n / len(xs)))


def usd(n):
    try:
        v = int(round(float(n)))
    except (TypeError, ValueError):
        return "$0"
    sign = "-" if v < 0 else ""
    return sign + "$" + "{:,}".format(abs(v))


def format_label(info):
    tag = info.get("tag")
    n = int(info.get("n") or 0)
    if tag == "thin" or tag is None:
        return "❔ Not enough history yet (%d past bet%s)" % (n, "" if n == 1 else "s")
    mult = info.get("mult")
    usual = info.get("usual")
    pct = info.get("pct")
    via = info.get("via")
    if tag == "high":
        head = "🔥 High confidence"
    elif tag == "fun":
        head = "🎈 Fun bet"
    else:
        head = "👍 Normal size"
    bits = [head]
    if mult is not None:
        bits.append("%.1fx their usual bet" % float(mult))
    if usual is not None:
        where = "at similar odds" if via == "similar" else "across all odds"
        bits[-1] = bits[-1] + " (%s %s)" % (usd(usual), where)
    if pct is not None and n:
        bits.append("bigger than %d%% of %d past bets" % (int(pct), n))
    return " · ".join(bits)


def _norm_row(row):
    if not isinstance(row, dict):
        return None
    try:
        cost = float(row.get("cost") or 0)
    except (TypeError, ValueError):
        return None
    if cost <= 0:
        return None
    avg = row.get("avg")
    try:
        avg = float(avg) if avg is not None else None
    except (TypeError, ValueError):
        avg = None
    if avg is not None and not (0 < avg <= 1.0):
        avg = None
    rid = row.get("id")
    if rid is not None:
        rid = str(rid)
    return {"id": rid, "cost": cost, "avg": avg, "ts": row.get("ts") or 0}


def compare_bet(cost, avg, past, exclude_id=None):
    """Compare one USD stake to a capper's past bets.

    past: iterable of {id, cost, avg} (and optional ts).
    Returns a size info dict with tag, label, mult, usual, n, pct, via.
    """
    try:
        cost = float(cost or 0)
    except (TypeError, ValueError):
        cost = 0.0
    try:
        avg = float(avg) if avg is not None else None
    except (TypeError, ValueError):
        avg = None
    if avg is not None and not (0 < avg <= 1.0):
        avg = None

    ex = str(exclude_id) if exclude_id else None
    rows = []
    for raw in past or []:
        row = _norm_row(raw)
        if not row:
            continue
        if ex and row.get("id") and row["id"] == ex:
            continue
        rows.append(row)

    bucket = odds_bucket(avg) if avg is not None else None
    similar = [r for r in rows if r.get("avg") is not None and odds_bucket(r["avg"]) == bucket] if bucket else []
    if len(similar) >= MIN_HISTORY:
        used, via = similar, "similar"
    else:
        used, via = rows, "all"

    n = len(used)
    if n < MIN_HISTORY or cost <= 0:
        info = {"tag": "thin", "mult": None, "usual": None, "n": n, "pct": None, "via": None}
        info["label"] = format_label(info)
        return info

    costs = [r["cost"] for r in used]
    usual = _median(costs)
    if not usual or usual <= 0:
        info = {"tag": "thin", "mult": None, "usual": None, "n": n, "pct": None, "via": via}
        info["label"] = format_label(info)
        return info

    mult = round(cost / usual, 1)
    if cost >= HIGH_MULT * usual - 1e-9:
        tag = "high"
    elif cost <= FUN_MULT * usual + 1e-9:
        tag = "fun"
    else:
        tag = "normal"
    pct = _percentile_below(cost, costs)
    info = {
        "tag": tag,
        "mult": mult,
        "usual": round(usual, 2),
        "n": n,
        "pct": pct,
        "via": via,
    }
    info["label"] = format_label(info)
    return info


def pick_size_tag(backers):
    """Card tag from already-annotated backers: 'big', 'fun', or None.

    Big if at least one High confidence. Fun-size only if every capper
    (and there is at least one) is a Fun bet. Thin / missing never counts as fun.
    """
    tags = []
    for b in backers or []:
        sz = (b or {}).get("size") if isinstance(b, dict) else None
        tag = (sz or {}).get("tag") if isinstance(sz, dict) else None
        tags.append(tag)
    if not tags:
        return None
    if any(t == "high" for t in tags):
        return "big"
    if tags and all(t == "fun" for t in tags):
        return "fun"
    return None


def _add(hist, key, row):
    row = _norm_row(row)
    if not key or not row:
        return
    k = str(key).lower()
    bucket = hist[k]
    rid = row.get("id")
    if rid:
        for i, prev in enumerate(bucket):
            if prev.get("id") == rid:
                # Keep the larger stake if the same pick appears twice.
                if row["cost"] > (prev.get("cost") or 0):
                    bucket[i] = row
                return
    bucket.append(row)


def _load_json(path, default=None):
    if default is None:
        default = {}
    if not os.path.exists(path):
        return default
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def ingest_capper_history_file(hist, path=None):
    """scanner/capper_history.json: picks -> backers with cost + avg."""
    path = path or os.path.join(HERE, "capper_history.json")
    data = _load_json(path, {})
    picks = data.get("picks") if isinstance(data, dict) else None
    if not isinstance(picks, dict):
        return hist
    for pid, rec in picks.items():
        if not isinstance(rec, dict):
            continue
        for w, b in (rec.get("backers") or {}).items():
            if not isinstance(b, dict):
                continue
            _add(hist, (b.get("wallet") or w), {
                "id": rec.get("id") or pid,
                "cost": b.get("cost"),
                "avg": b.get("avg"),
                "ts": rec.get("startTs") or rec.get("graded") or 0,
            })
    return hist


def ingest_capper_records(hist, capper_history):
    """In-memory capperHistory.cappers[].picks and bf.recent."""
    recs = []
    if isinstance(capper_history, dict):
        recs = capper_history.get("cappers") or []
    elif isinstance(capper_history, list):
        recs = capper_history
    for c in recs:
        if not isinstance(c, dict):
            continue
        w = (c.get("wallet") or "").lower()
        if not w:
            continue
        for p in c.get("picks") or []:
            if not isinstance(p, dict):
                continue
            _add(hist, w, {
                "id": p.get("id"),
                "cost": p.get("cost"),
                "avg": p.get("avg"),
                "ts": p.get("startTs") or p.get("graded") or 0,
            })
        recent = ((c.get("bf") or {}).get("recent")) or []
        for row in recent:
            if not isinstance(row, (list, tuple)) or len(row) < 4:
                continue
            # [slug/id, label, cost, avg, result, ts]
            _add(hist, w, {
                "id": row[0],
                "cost": row[2],
                "avg": row[3],
                "ts": row[5] if len(row) > 5 else 0,
            })
    return hist


def ingest_backfill(hist, path=None):
    """scanner/backfill.json wallets[].recent (up to 20 graded bets each)."""
    path = path or os.path.join(HERE, "backfill.json")
    data = _load_json(path, {})
    wallets = data.get("wallets") if isinstance(data, dict) else None
    if not isinstance(wallets, dict):
        return hist
    for w, rec in wallets.items():
        if not isinstance(rec, dict):
            continue
        for row in rec.get("recent") or []:
            if not isinstance(row, (list, tuple)) or len(row) < 4:
                continue
            _add(hist, w, {
                "id": row[0],
                "cost": row[2],
                "avg": row[3],
                "ts": row[5] if len(row) > 5 else 0,
            })
    return hist


def ingest_coming_games(hist, games):
    for g in games or []:
        if not isinstance(g, dict):
            continue
        for m in g.get("markets") or []:
            for s in (m.get("sides") or []):
                sid = s.get("id")
                for b in s.get("backers") or []:
                    _add(hist, b.get("wallet"), {
                        "id": sid,
                        "cost": b.get("cost"),
                        "avg": b.get("avg"),
                        "ts": b.get("lastTs") or g.get("startTs") or 0,
                    })
    return hist


def ingest_pick_lists(hist, lists):
    for arr in lists or []:
        for p in arr or []:
            if not isinstance(p, dict):
                continue
            pid = p.get("id") or p.get("pickId")
            for b in p.get("backers") or []:
                _add(hist, b.get("wallet"), {
                    "id": pid,
                    "cost": b.get("cost"),
                    "avg": b.get("avg"),
                    "ts": b.get("lastTs") or p.get("startTs") or 0,
                })
    return hist


def load_history(capper_history=None, payload=None):
    """Build wallet -> past bets from already-fetched scanner files + payload."""
    hist = defaultdict(list)
    ingest_capper_history_file(hist)
    ingest_backfill(hist)
    if capper_history is None and isinstance(payload, dict):
        capper_history = payload.get("capperHistory")
    if capper_history:
        ingest_capper_records(hist, capper_history)
    if isinstance(payload, dict):
        ingest_coming_games(hist, payload.get("comingUp"))
        ingest_coming_games(hist, ((payload.get("hotWeek") or {}).get("games")))
        ingest_pick_lists(hist, [
            payload.get("signals"), payload.get("fun"), payload.get("poly"),
            payload.get("glue"), payload.get("props"), payload.get("longshots"),
            payload.get("biggest"), payload.get("upcoming"),
        ])
        proven = payload.get("provenPicks") or {}
        if isinstance(proven, dict):
            for p in proven.get("picks") or []:
                if not isinstance(p, dict):
                    continue
                _add(hist, p.get("wallet"), {
                    "id": p.get("pid") or p.get("id"),
                    "cost": p.get("cost"),
                    "avg": p.get("avg"),
                    "ts": p.get("lastTs") or p.get("startTs") or 0,
                })
        pe = payload.get("politicsEcon") or {}
        for p in (pe.get("picks") or []):
            if not isinstance(p, dict):
                continue
            pid = p.get("ticker") or p.get("id")
            for b in p.get("backers") or []:
                _add(hist, b.get("wallet"), {
                    "id": pid,
                    "cost": b.get("cost"),
                    "avg": b.get("avg"),
                    "ts": p.get("settleTs") or 0,
                })
    return hist


def annotate_backer(b, hist, exclude_id=None):
    if not isinstance(b, dict):
        return b
    key = (b.get("wallet") or b.get("name") or "").lower()
    avg = b.get("avg")
    if avg is None:
        avg = b.get("entry")
    b["size"] = compare_bet(b.get("cost") or 0, avg, hist.get(key) or [], exclude_id=exclude_id)
    return b


def annotate_coming_games(games, capper_history=None, hist=None):
    if hist is None:
        hist = load_history(capper_history=capper_history)
        ingest_coming_games(hist, games)
    for g in games or []:
        for m in g.get("markets") or []:
            for s in m.get("sides") or []:
                sid = s.get("id")
                for b in s.get("backers") or []:
                    annotate_backer(b, hist, exclude_id=sid)
                tag = pick_size_tag(s.get("backers"))
                if tag:
                    s["sizeTag"] = tag
                elif "sizeTag" in s:
                    s.pop("sizeTag", None)
    return games


def annotate_payload(payload, capper_history=None):
    """Attach size fields on every capper line in the published scan payload."""
    if not isinstance(payload, dict):
        return payload
    hist = load_history(capper_history=capper_history or payload.get("capperHistory"), payload=payload)
    annotate_coming_games(payload.get("comingUp") or [], hist=hist)
    hw = payload.get("hotWeek") or {}
    if isinstance(hw, dict):
        annotate_coming_games(hw.get("games") or [], hist=hist)
    for key in ("signals", "fun", "poly", "glue", "props", "longshots", "biggest", "upcoming"):
        for p in payload.get(key) or []:
            if not isinstance(p, dict):
                continue
            pid = p.get("id") or p.get("pickId")
            for b in p.get("backers") or []:
                annotate_backer(b, hist, exclude_id=pid)
            tag = pick_size_tag(p.get("backers"))
            if tag:
                p["sizeTag"] = tag
            elif "sizeTag" in p:
                p.pop("sizeTag", None)
    proven = payload.get("provenPicks") or {}
    if isinstance(proven, dict):
        for p in proven.get("picks") or []:
            if not isinstance(p, dict):
                continue
            annotate_backer(p, hist, exclude_id=p.get("pid") or p.get("id"))
    pe = payload.get("politicsEcon") or {}
    if isinstance(pe, dict):
        for p in pe.get("picks") or []:
            if not isinstance(p, dict):
                continue
            pid = p.get("ticker") or p.get("id")
            for b in p.get("backers") or []:
                annotate_backer(b, hist, exclude_id=pid)
            tag = pick_size_tag(p.get("backers"))
            if tag:
                p["sizeTag"] = tag
    return payload
