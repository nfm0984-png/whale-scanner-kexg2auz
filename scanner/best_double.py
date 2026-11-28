#!/usr/bin/env python3
"""Best Double: the two strongest qualifying bets on two different games.

Display-only. Never used to filter Golden / Ranked / Coming Up.
A pick qualifies only if ALL of these pass:
  1. At least one capper is up over the last month AND the last year,
     and has a proven record in that sport.
  2. That capper is High confidence (≥3x usual) OR several cappers are on the pick.
  3. Price has not moved more than 6¢ against entry, it is not a big longshot
     (<40¢), the opposite side does not have stronger cappers, it is not a
     very short favorite (90¢+), and the pick is not a fun-size bet.
If fewer than two legs on different games qualify, return no double.
"""
from __future__ import annotations

MIN_PX = 0.40
SHORT_FAV_PX = 0.90
STALE_CENTS = 6
SPORT_MIN_N = 5
SEVERAL = 2
STAKE = 10


def slip_cents(price, entry):
    try:
        px = float(price)
        ent = float(entry)
    except (TypeError, ValueError):
        return None
    return round((px - ent) * 100, 1)


def _tag(b):
    sz = (b or {}).get("size") if isinstance(b, dict) else None
    return (sz or {}).get("tag") if isinstance(sz, dict) else None


def is_fun_size(pick):
    backers = pick.get("backers") or []
    if not backers:
        return False
    tags = [_tag(b) for b in backers]
    return all(t == "fun" for t in tags)


def is_high_conf(pick):
    return any(_tag(b) == "high" for b in (pick.get("backers") or []))


def capper_is_up(b):
    """Up last month AND last year (or long-term fallback if provided as yearPnl)."""
    try:
        month = b.get("monthPnl")
        year = b.get("yearPnl")
        if month is None or year is None:
            return False
        return float(month) > 0 and float(year) > 0
    except (TypeError, ValueError):
        return False


def capper_is_down(b):
    """Down over the month or the year / long-term window."""
    try:
        month = b.get("monthPnl")
        year = b.get("yearPnl")
        if month is not None and float(month) < 0:
            return True
        if year is not None and float(year) < 0:
            return True
    except (TypeError, ValueError):
        return False
    return False


def capper_proven_sport(b):
    sr = (b or {}).get("sport") or {}
    n = int(sr.get("n") or 0)
    if n < SPORT_MIN_N:
        return False
    roi = sr.get("roi")
    if roi is not None:
        try:
            return float(roi) > 0
        except (TypeError, ValueError):
            return False
    profit = sr.get("profit")
    if profit is not None:
        try:
            return float(profit) > 0
        except (TypeError, ValueError):
            return False
    w, l = int(sr.get("w") or 0), int(sr.get("l") or 0)
    return w > l


def qualifying_backers(pick):
    several = len(pick.get("backers") or []) >= SEVERAL
    out = []
    for b in pick.get("backers") or []:
        if capper_is_down(b) or not capper_is_up(b):
            continue
        if not capper_proven_sport(b):
            continue
        if _tag(b) == "fun":
            continue
        if _tag(b) == "high" or several:
            out.append(b)
    return out


def why_skip(pick):
    """Return a skip reason code, or None if the pick qualifies."""
    try:
        px = float(pick["price"]) if pick.get("price") is not None else None
    except (TypeError, ValueError):
        px = None
    if px is None:
        return "no_price"
    if px >= SHORT_FAV_PX:
        return "short_favorite"
    if px < MIN_PX:
        return "longshot"
    sl = slip_cents(pick.get("price"), pick.get("entry"))
    if sl is not None and sl > STALE_CENTS:
        return "stale"
    if is_fun_size(pick):
        return "fun_size"
    own = float(pick.get("ownScore") or 0)
    opp = float(pick.get("oppScore") or 0)
    if opp > own:
        return "opp_stronger"
    if not qualifying_backers(pick):
        return "no_qualifying_capper"
    return None


def score(pick):
    """Higher is stronger. High-confidence and agreement first, then net vs opp, then price band."""
    px = float(pick.get("price") or 0)
    band = 2 if 0.55 <= px <= 0.80 else (1 if 0.50 <= px <= 0.85 else 0)
    qb = qualifying_backers(pick)
    high = 1 if is_high_conf(pick) else 0
    n = len(pick.get("backers") or [])
    net = float(pick.get("ownScore") or 0) - float(pick.get("oppScore") or 0)
    return (high, len(qb), n, net, band, px)


def _usd(n):
    try:
        v = int(round(float(n)))
    except (TypeError, ValueError):
        return "$0"
    sign = "-" if v < 0 else ""
    return sign + "$" + "{:,}".format(abs(v))


def reasons_for(pick):
    bits = []
    qb = qualifying_backers(pick)
    for b in qb[:2]:
        name = b.get("name") or "Capper"
        sport = ((b.get("sport") or {}).get("name") or pick.get("league") or "this sport")
        bits.append("%s is up this month and this year, with a proven %s record" % (name, sport))
        if _tag(b) == "high":
            mult = (b.get("size") or {}).get("mult")
            bits.append("%s is betting big vs their usual (%s)" % (name, ("%.1fx" % mult) if mult is not None else "High confidence"))
    if len(pick.get("backers") or []) >= SEVERAL:
        bits.append("%d cappers are on this pick" % len(pick.get("backers") or []))
    sl = slip_cents(pick.get("price"), pick.get("entry"))
    if sl is not None and abs(sl) <= STALE_CENTS:
        if abs(sl) <= 2:
            bits.append("Price is still close to what the cappers paid (%s¢)" % (str(int(sl) if sl == int(sl) else sl)))
        else:
            bits.append("Price has not moved much since they bought (%s¢)" % (str(int(sl) if sl == int(sl) else sl)))
    px = pick.get("price")
    if px is not None:
        bits.append("Current price is %d¢" % int(round(float(px) * 100)))
    return bits


def reasons_against(pick):
    bits = []
    opp = float(pick.get("oppScore") or 0)
    if opp > 0:
        bits.append("The other side of this game also has capper money on it")
    if not is_high_conf(pick):
        bits.append("No High confidence (3x usual) capper on this leg")
    sl = slip_cents(pick.get("price"), pick.get("entry"))
    if sl is not None and sl >= 3:
        bits.append("Price has already moved +%s¢ since entry" % (str(int(sl) if sl == int(sl) else sl)))
    if sl is not None and sl <= -3:
        bits.append("Price has faded %s¢ under entry" % (str(int(abs(sl)) if abs(sl) == int(abs(sl)) else abs(sl))))
    px = pick.get("price")
    if px is not None and float(px) < 0.50:
        bits.append("This is still a dog at %d¢, not a favorite" % int(round(float(px) * 100)))
    if px is not None and 0.85 <= float(px) < SHORT_FAV_PX:
        bits.append("Short favorite — not much juice left at %d¢" % int(round(float(px) * 100)))
    if len(pick.get("backers") or []) == 1:
        bits.append("Only one capper is on this pick")
    return bits


def _leg(pick):
    px = float(pick.get("price") or 0)
    return {
        "id": pick.get("id"),
        "gameId": pick.get("gameId"),
        "label": pick.get("label") or "",
        "game": pick.get("game") or "",
        "league": pick.get("league") or "",
        "price": px,
        "payout": round(1.0 / px, 2) if px > 0 else None,
        "entry": pick.get("entry"),
        "startTs": pick.get("startTs"),
        "reasonsFor": reasons_for(pick),
        "reasonsAgainst": reasons_against(pick),
        "backers": [
            {"name": b.get("name"), "cost": b.get("cost"), "size": b.get("size")}
            for b in (pick.get("backers") or [])
        ],
        "ticker": pick.get("ticker"),
        "yesNo": pick.get("yesNo"),
        "key": pick.get("key") or pick.get("id"),
    }


def combined_payout(p1, p2, stake=STAKE):
    if not p1 or not p2:
        return None
    return round(float(stake) / (float(p1) * float(p2)), 2)


def win_chance_pct(p1, p2):
    if not p1 or not p2:
        return None
    return round(float(p1) * float(p2) * 100.0, 1)


def honest_note(p1=None, p2=None):
    if p1 and p2:
        a, b = int(round(float(p1) * 100)), int(round(float(p2) * 100))
        hit = win_chance_pct(p1, p2)
        return "Both legs must win. A %d¢ leg and a %d¢ leg only hit about %s%% of the time — two ~70¢ legs only hit about half the time." % (a, b, hit)
    return "Both legs must win. Two ~70% legs only hit about half the time."


def select_double(picks):
    """Return a Best Double dict, or None if fewer than two different games qualify."""
    ok = [p for p in (picks or []) if why_skip(p) is None]
    ok.sort(key=lambda p: score(p), reverse=True)
    if not ok:
        return None
    first = ok[0]
    second = None
    for p in ok[1:]:
        if (p.get("gameId") or p.get("id")) != (first.get("gameId") or first.get("id")):
            second = p
            break
    if not second:
        return None
    p1, p2 = float(first["price"]), float(second["price"])
    return {
        "legs": [_leg(first), _leg(second)],
        "stake": STAKE,
        "payout": combined_payout(p1, p2, STAKE),
        "winChance": win_chance_pct(p1, p2),
        "note": honest_note(p1, p2),
    }


def empty_state():
    return {
        "legs": [],
        "stake": STAKE,
        "payout": None,
        "winChance": None,
        "note": honest_note(),
        "empty": True,
        "message": "No Best Double right now",
    }


def _sport_lookup(sports, league, family=None):
    sports = sports or {}
    if not isinstance(sports, dict):
        return None
    keys = []
    for k in (family, league, (league or "").upper(), (league or "").lower()):
        if k and k not in keys:
            keys.append(k)
    for key in keys:
        rec = sports.get(key)
        if rec and int(rec.get("n") or 0) >= SPORT_MIN_N:
            return {
                "name": key,
                "n": int(rec.get("n") or 0),
                "w": int(rec.get("w") or 0),
                "l": int(rec.get("l") or 0),
                "roi": rec.get("roi"),
                "profit": rec.get("profit"),
            }
    want = (family or league or "").lower()
    if want:
        for key, rec in sports.items():
            if str(key).lower() == want and rec and int(rec.get("n") or 0) >= SPORT_MIN_N:
                return {
                    "name": key,
                    "n": int(rec.get("n") or 0),
                    "w": int(rec.get("w") or 0),
                    "l": int(rec.get("l") or 0),
                    "roi": rec.get("roi"),
                    "profit": rec.get("profit"),
                }
    return None


def _side_score(row):
    return (
        sum(1 for b in (row.get("backers") or []) if capper_is_up(b) and capper_proven_sport(b)) * 2
        + len(row.get("backers") or [])
        + (1 if is_high_conf(row) else 0)
    )


def _apply_opp_scores(group):
    scores = [_side_score(r) for r in group]
    for i, r in enumerate(group):
        r["ownScore"] = scores[i]
        r["oppScore"] = max((scores[j] for j in range(len(scores)) if j != i), default=0)


def build_from_whale_payload(payload, now=None):
    """Map comingUp + capperHistory into a Best Double snapshot for data.json."""
    import time as _time
    if not isinstance(payload, dict):
        return empty_state()
    now = now if now is not None else (payload.get("ts") or _time.time())
    ch = payload.get("capperHistory") or {}
    cmap = {}
    for c in (ch.get("cappers") or []):
        w = (c.get("wallet") or "").lower()
        if w:
            cmap[w] = c
    fam_map = ch.get("sportFamilyMap") or {}
    recs = ch.get("capperSportRecords") or {}
    rows = []
    for g in payload.get("comingUp") or []:
        if not isinstance(g, dict):
            continue
        start = g.get("startTs") or 0
        if start and start <= now:
            continue
        gid = g.get("id") or g.get("game") or ""
        league = g.get("league") or ""
        fam = fam_map.get(league) or fam_map.get(str(league).upper()) or fam_map.get(str(league).lower())
        for m in g.get("markets") or []:
            mid = m.get("id") or m.get("cid") or m.get("q") or ""
            group = []
            for s in m.get("sides") or []:
                px = s.get("kPrice")
                if px is None:
                    px = s.get("px")
                backers = []
                for b in s.get("backers") or []:
                    w = (b.get("wallet") or "").lower()
                    rec = cmap.get(w) or {}
                    win = rec.get("win") or {}
                    month = (win.get("month") or {}).get("pnl")
                    year = (win.get("year") or {}).get("pnl")
                    sports = recs.get(w) or rec.get("sports") or {}
                    bb = dict(b)
                    bb["name"] = b.get("name") or w
                    bb["monthPnl"] = month
                    bb["yearPnl"] = year
                    bb["sport"] = _sport_lookup(sports, league, fam)
                    backers.append(bb)
                group.append({
                    "id": s.get("id") or ("%s|%s" % (mid, s.get("side") or s.get("label") or "")),
                    "gameId": gid,
                    "label": s.get("label") or "",
                    "game": g.get("game") or "",
                    "league": league,
                    "price": px,
                    "entry": s.get("avgEntry"),
                    "startTs": start,
                    "backers": backers,
                    "ownScore": 0,
                    "oppScore": 0,
                    "ticker": s.get("ticker"),
                    "yesNo": s.get("action") or s.get("side"),
                })
            _apply_opp_scores(group)
            rows.extend(group)
    return select_double(rows) or empty_state()


def build_from_kalshi_payload(payload, now=None):
    """Map games + cappers (month / yearly-or-all-time / sport) into a Best Double snapshot."""
    import time as _time
    if not isinstance(payload, dict):
        return empty_state()
    now = now if now is not None else (payload.get("ts") or _time.time())
    try:
        from lib_cappers import sport_family as _sport_family
    except Exception:
        def _sport_family(league):
            return league or ""
    cmap = {}
    for c in payload.get("cappers") or []:
        k = (c.get("nickname") or "").lower()
        if k:
            cmap[k] = c
    rows = []
    for g in payload.get("games") or []:
        if not isinstance(g, dict):
            continue
        if g.get("live") or ((g.get("startTs") or 0) and g.get("startTs") <= now):
            continue
        gid = g.get("id") or g.get("game") or ""
        league = g.get("league") or ""
        fam = _sport_family(league)
        group = []
        for p in g.get("picks") or []:
            if p.get("isCombo") or (p.get("legs") or []):
                continue
            view = p.get("view") or {}
            px = view.get("price") if isinstance(view, dict) else None
            backers = []
            avgs = []
            for b in p.get("backers") or []:
                c = cmap.get((b.get("name") or "").lower()) or {}
                month = c.get("monthlyPnl")
                year = c.get("yearlyPnl") if c.get("yearlyPnl") is not None else c.get("pnl")
                bb = dict(b)
                bb["name"] = b.get("name") or ""
                bb["monthPnl"] = month
                bb["yearPnl"] = year
                bb["sport"] = _sport_lookup(c.get("sports") or {}, league, fam)
                backers.append(bb)
                if b.get("avg") is not None:
                    try:
                        avgs.append(float(b["avg"]))
                    except (TypeError, ValueError):
                        pass
            entry = (sum(avgs) / len(avgs)) if avgs else None
            if entry is None and p.get("slip") is not None and px is not None:
                try:
                    entry = float(px) - float(p["slip"]) / 100.0
                except (TypeError, ValueError):
                    entry = None
            group.append({
                "id": p.get("key") or p.get("ticker") or "",
                "gameId": gid,
                "label": p.get("big") or "",
                "game": p.get("sub") or g.get("game") or "",
                "league": league,
                "price": px,
                "entry": entry,
                "startTs": p.get("startTs") or g.get("startTs"),
                "backers": backers,
                "ownScore": 0,
                "oppScore": 0,
                "ticker": p.get("ticker") or (view.get("ticker") if isinstance(view, dict) else None),
                "yesNo": view.get("yesNo") if isinstance(view, dict) else None,
            })
        _apply_opp_scores(group)
        rows.extend(group)
    return select_double(rows) or empty_state()
