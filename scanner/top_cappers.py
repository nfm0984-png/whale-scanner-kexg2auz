#!/usr/bin/env python3
"""Top 100 Sports Cappers roster + Noel-pinned watchlist.

Pinned wallets are always scanned. The Top 100 combines Orca Sports Proven / Smart /
Copyable wallets, the Polymarket sports leaderboard (via already-loaded capper history),
and the pinned list. Market makers / bots and thin one-off jackpots stay out.
Veterans (30+ graded sports bets) rank above tiny samples.
"""
from __future__ import annotations

import json, os, re, time, urllib.request
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
PATH = os.path.join(ROOT, "data", "top_cappers.json")
PT = timezone(timedelta(hours=-8))
TOP_N = 100
PINNED_GMPM2 = "0x67542c3219b37fd1610aad290676ff91cdbfe3bc"
PINNED_AX2026 = "0xaa6c296af0ceea224b56fb7ee1e9cab1ccabe2d0"
DEFAULT_PINNED = [
    {
        "name": "gmpm2",
        "username": "gmpm2",
        "wallet": PINNED_GMPM2,
        "profile": "https://polymarket.com/@gmpm2",
        "source": "noel",
    },
    {
        "name": "ax2026",
        "wallet": PINNED_AX2026,
        "orca": "https://orcalayer.com/wallet/" + PINNED_AX2026,
        "source": "noel",
    },
]


def _now_label(now=None):
    now = now or time.time()
    return datetime.fromtimestamp(int(now), PT).strftime("%a %b %-d · %-I:%M %p PT")


def _norm_wallet(w):
    w = (w or "").strip().lower()
    if re.fullmatch(r"0x[a-f0-9]{40}", w):
        return w
    return ""


def load_store():
    try:
        data = json.load(open(PATH, encoding="utf-8"))
    except Exception:
        data = {}
    pinned = list(data.get("pinned") or [])
    have = {_norm_wallet(p.get("wallet")) for p in pinned}
    for row in DEFAULT_PINNED:
        w = _norm_wallet(row.get("wallet"))
        if w and w not in have:
            pinned.append(dict(row))
            have.add(w)
    data["pinned"] = pinned
    data.setdefault("cappers", [])
    data.setdefault("version", 1)
    return data


def save_store(data):
    os.makedirs(os.path.dirname(PATH), exist_ok=True)
    data = dict(data)
    data["updatedAt"] = data.get("updatedAt") or _now_label()
    with open(PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return data


def pinned_wallets(store=None):
    store = store or load_store()
    out = []
    seen = set()
    for row in store.get("pinned") or []:
        w = _norm_wallet(row.get("wallet"))
        if w and w not in seen:
            out.append(w)
            seen.add(w)
    return out


def pinned_rows(store=None):
    store = store or load_store()
    return [dict(r) for r in (store.get("pinned") or []) if _norm_wallet(r.get("wallet"))]


def resolve_polymarket_username(username):
    """Resolve @handle to a proxy wallet from the public profile page. Returns lowercase 0x… or ''."""
    name = (username or "").strip().lstrip("@")
    if not name:
        return ""
    url = "https://polymarket.com/@" + name
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "whale-scanner/1.0", "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=20) as r:
            html = r.read().decode("utf-8", "replace")
    except Exception:
        return ""
    m = re.search(r'proxyWallet\\?":\\?"(0x[a-fA-F0-9]{40})', html)
    if m:
        return m.group(1).lower()
    m = re.search(r'primaryAddress\\?":\\?"(0x[a-fA-F0-9]{40})', html)
    if m:
        return m.group(1).lower()
    return ""


def ensure_pinned_resolved(store=None, log=print):
    store = store or load_store()
    changed = False
    for row in store.get("pinned") or []:
        w = _norm_wallet(row.get("wallet"))
        user = (row.get("username") or "").strip().lstrip("@")
        if w:
            if user and not row.get("profile"):
                row["profile"] = "https://polymarket.com/@" + user
            if not row.get("orca"):
                row["orca"] = "https://orcalayer.com/wallet/" + w
            continue
        if not user:
            continue
        got = resolve_polymarket_username(user)
        if got:
            row["wallet"] = got
            row["profile"] = "https://polymarket.com/@" + user
            row["orca"] = "https://orcalayer.com/wallet/" + got
            changed = True
            log("top_cappers: resolved @%s -> %s" % (user, got))
    if changed:
        save_store(store)
    return store


def _lens_wallets(orca_lenses):
    out = []
    seen = set()
    lenses = orca_lenses or {}
    for key in ("proven", "smart", "copyable"):
        for item in lenses.get(key) or []:
            w = _norm_wallet(item if isinstance(item, str) else (item.get("wallet") or item.get("address")))
            if w and w not in seen:
                out.append(w)
                seen.add(w)
    return out


def _cap_map(capper_history):
    m = {}
    for c in (capper_history or {}).get("cappers") or []:
        w = _norm_wallet(c.get("wallet"))
        if w:
            m[w] = c
    return m


def _sport_focus(c):
    sports = c.get("sports") or {}
    if isinstance(sports, dict) and sports:
        best = None
        for name, rec in sports.items():
            if not name:
                continue
            n = (rec or {}).get("n") or 0
            roi = (rec or {}).get("roi")
            if best is None or n > best[0] or (n == best[0] and (roi or -999) > (best[1] or -999)):
                best = (n, roi, name)
        if best:
            return best[2]
    return c.get("bestAt") or c.get("bestSport") or ""


def _row(c, extra=None):
    w = _norm_wallet(c.get("wallet"))
    name = c.get("name") or (w[:10] if w else "")
    user = (c.get("username") or "").strip().lstrip("@")
    cw, cl = int(c.get("cw") or c.get("w") or 0), int(c.get("cl") or c.get("l") or 0)
    n = int(c.get("cn") or c.get("n") or (cw + cl) or 0)
    wr = c.get("cwr") if c.get("cwr") is not None else c.get("wr")
    if wr is None and n:
        wr = round(100.0 * cw / n, 1)
    roi = c.get("croi") if c.get("croi") is not None else c.get("roi")
    pnl = c.get("cprofit") if c.get("cprofit") is not None else (c.get("profit") or c.get("pnl"))
    tags = []
    if c.get("pinned"):
        tags.append("Pinned")
    if c.get("elite"):
        tags.append("Elite")
    if c.get("proven") or c.get("orcaProven"):
        tags.append("Orca Proven")
    if c.get("orcaSmart") or (c.get("orca") or {}).get("smart"):
        tags.append("Smart")
    if c.get("orcaCopyable") or (c.get("orca") or {}).get("copyable"):
        tags.append("Copyable")
    if c.get("badge") == "Hot":
        tags.append("Hot")
    row = {
        "wallet": w,
        "name": name,
        "username": user,
        "tags": tags,
        "pinned": bool(c.get("pinned")),
        "elite": bool(c.get("elite")),
        "proven": bool(c.get("proven") or c.get("orcaProven")),
        "smart": bool(c.get("orcaSmart") or (c.get("orca") or {}).get("smart")),
        "w": cw,
        "l": cl,
        "n": n,
        "wr": None if wr is None else round(float(wr), 1),
        "roi": None if roi is None else round(float(roi), 1),
        "pnl": None if pnl is None else round(float(pnl), 2),
        "sport": _sport_focus(c),
        "open": int(c.get("open") or 0),
        "profile": c.get("profile") or (("https://polymarket.com/@" + user) if user else ( "https://polymarket.com/@" + name if name and re.fullmatch(r"[A-Za-z0-9_.-]+", name) else "")),
        "orca": c.get("orcaUrl") or ("https://orcalayer.com/wallet/" + w if w else ""),
        "ageDays": c.get("ageDays"),
        "quality": c.get("quality"),
    }
    if extra:
        row.update(extra)
    return row


def _score(c):
    """Veterans (30+ graded) above tiny samples, then ROI, then profit, then wins."""
    n = int(c.get("cn") or c.get("n") or 0)
    roi = c.get("croi") if c.get("croi") is not None else (c.get("roi") or 0)
    pnl = c.get("cprofit") if c.get("cprofit") is not None else (c.get("profit") or c.get("pnl") or 0)
    veteran = 1 if n >= 30 else 0
    pinned = 1 if c.get("pinned") else 0
    return (pinned, veteran, float(roi or 0), float(pnl or 0), n)


def build(capper_history=None, orca_lenses=None, proven=None, now=None, log=print, store=None):
    """Rebuild the Top 100 Sports Cappers list and persist it.

    Drops market makers / bots and one-off jackpots (same flags as the rest of the
    scanner). Pinned wallets always stay on the list, even if a stale flag lingers,
    so Noel can see them; they still have to clear MM/one-off to be Elite.
    """
    now = now or time.time()
    store = ensure_pinned_resolved(store or load_store(), log=log)
    caps = _cap_map(capper_history)
    pin_rows = pinned_rows(store)
    pin_set = {_norm_wallet(r.get("wallet")) for r in pin_rows}
    elite = { _norm_wallet(e.get("wallet")) for e in ((proven or {}).get("elite") or []) }
    lenses = orca_lenses or {}
    lens_set = {k: set() for k in ("proven", "smart", "copyable")}
    for key in lens_set:
        for item in lenses.get(key) or []:
            w = _norm_wallet(item if isinstance(item, str) else (item.get("wallet") or item.get("address")))
            if w:
                lens_set[key].add(w)

    candidates = {}
    def take(c, pinned=False):
        w = _norm_wallet(c.get("wallet") if isinstance(c, dict) else "")
        if not w:
            return
        rec = dict(caps.get(w) or (c if isinstance(c, dict) else {}) )
        rec["wallet"] = w
        rec["pinned"] = bool(pinned or w in pin_set or rec.get("pinned"))
        rec["elite"] = w in elite or bool(rec.get("elite"))
        rec["orcaProven"] = w in lens_set["proven"] or bool(rec.get("proven"))
        rec["orcaSmart"] = w in lens_set["smart"]
        rec["orcaCopyable"] = w in lens_set["copyable"]
        if rec["orcaProven"]:
            rec["proven"] = True
        # MM / one-off stay out of the ranked 100 unless pinned (pinned always listed).
        if (rec.get("mm") or rec.get("oneOff") or rec.get("badge") == "Cooling") and not rec["pinned"]:
            return
        if rec.get("badge") == "Cooling" and rec["pinned"]:
            pass
        prev = candidates.get(w)
        if prev is None or _score(rec) > _score(prev):
            candidates[w] = rec

    for c in caps.values():
        take(c, pinned=_norm_wallet(c.get("wallet")) in pin_set)
    for w in _lens_wallets(lenses):
        take(caps.get(w) or {"wallet": w, "name": w[:10]})
    for row in pin_rows:
        w = _norm_wallet(row.get("wallet"))
        base = dict(caps.get(w) or {})
        base["wallet"] = w
        base["name"] = base.get("name") or row.get("name") or w[:10]
        base["username"] = row.get("username") or base.get("username")
        base["profile"] = row.get("profile") or base.get("profile")
        base["orcaUrl"] = row.get("orca") or base.get("orcaUrl")
        take(base, pinned=True)

    ranked = sorted(candidates.values(), key=_score, reverse=True)
    # Pinned first (stable among themselves by score), then the rest, cap at 100 but never drop pinned.
    pinned = [c for c in ranked if c.get("pinned")]
    rest = [c for c in ranked if not c.get("pinned")]
    top = pinned + rest
    top = top[: max(TOP_N, len(pinned))]
    rows = []
    for i, c in enumerate(top, 1):
        r = _row(c)
        r["rank"] = i
        rows.append(r)
    store["cappers"] = rows
    store["updatedAt"] = _now_label(now)
    store["count"] = len(rows)
    save_store(store)
    log("top_cappers: %d listed (%d pinned)" % (len(rows), len(pinned)))
    return {
        "updatedAt": store["updatedAt"],
        "count": len(rows),
        "pinned": pin_rows,
        "cappers": rows,
    }


def payload(store=None):
    store = store or load_store()
    return {
        "updatedAt": store.get("updatedAt") or "",
        "count": len(store.get("cappers") or []),
        "pinned": pinned_rows(store),
        "cappers": list(store.get("cappers") or []),
    }
