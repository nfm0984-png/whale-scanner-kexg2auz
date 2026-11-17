#!/usr/bin/env python3
"""Kalshi Cappers tab: public Sports-leaderboard traders who show their bets.

Uses only api.elections.kalshi.com JSON routes (social + trade-api market
quotes). Does not scrape kalshi.com HTML. Hidden profiles are not polled
for trades, metrics, or holdings detail.

Blocklist: edit scanner/kalshi_cappers_config.json (case-insensitive nicknames).

Long-term record is a hard gate (thin histories are hidden, not tagged):
account 60+ days old, all-time PnL of at least $10,000, 30+ reconstructed
graded big sports bets, and positive ROI on those bets over the longest
trade window the public API returns.
"""
from __future__ import annotations

import json, os, re, time, urllib.error, urllib.parse, urllib.request, datetime as dt
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(HERE, "kalshi_cappers_config.json")
SOCIAL = "https://api.elections.kalshi.com/v1/social"
TRADE = "https://api.elections.kalshi.com/trade-api/v2"
PT = dt.timezone(dt.timedelta(hours=-8))
UA = "whale-scanner-kalshi-cappers/1.0"
MIN_INTERVAL = 0.15
TRADE_DAYS = 30  # open-pick recency still prefers recent fills
RECORD_DAYS = 400  # paginate as far as the public tape goes for the record
MAX_TRADE_PAGES = 50
MIN_BIG = 500
MAX_ENTRY = 0.90
STALE_SEC = 3600
SLIP_COMBO_MAX = 2.0
FORM_DAYS = 14
MIN_AGE_DAYS = 60
MIN_GRADED = 30
MIN_PNL = 10000
DEFAULT_BLOCKLIST = ["Wiseandstrong"]

# Prefixes that are clearly not sports (crypto, macro, weather, politics, culture).
NON_SPORT_RE = re.compile(
    r"^(KXBTC|KXETH|KXSOL|KXDOGE|KXXRP|KXADA|KXBNB|KXAVAX|KXDOT|KXLINK|KXSHIB|"
    r"KXSPX|KXNDX|KXDJI|KXNIKKEI|KXVIX|KXGOLD|KXOIL|KXSILVER|KXCOIN|KXCRYPTO|"
    r"KXFED|KXCPI|KXGDP|KXUNEMP|KXRATES|KXTREAS|KXJOBS|KXPCE|KXCPIAUCSL|"
    r"KXHIGH|KXTMAX|KXTMIN|KXRAIN|KXWEATHER|KXSNOW|KXTEMP|"
    r"KXPRES|KXSENATE|KXHOUSE|KXGOV|KXELECT|KXPOLIT|"
    r"KXOSCAR|KXEMMY|KXGRAMMY|KXTONY|KXEGGS|KXINX)",
    re.I,
)
LEAGUE_RES = [
    (re.compile(r"^KXNFL", re.I), "NFL"),
    (re.compile(r"^KXNF", re.I), "NFL"),
    (re.compile(r"^KXNCAAF|^KXCFB|^KXNCAAFB", re.I), "NCAAF"),
    (re.compile(r"^KXNCAAB|^KXCBB|^KXNCAAMB", re.I), "NCAAB"),
    (re.compile(r"^KXNCAAW|^KXCWBB", re.I), "NCAAW"),
    (re.compile(r"^KXWNBA", re.I), "WNBA"),
    (re.compile(r"^KXNBA", re.I), "NBA"),
    (re.compile(r"^KXNHL", re.I), "NHL"),
    (re.compile(r"^KXMLB", re.I), "MLB"),
    (re.compile(r"^KXATP|^KXATPCHALLENGER", re.I), "Tennis"),
    (re.compile(r"^KXWTA|^KXWTACHALLENGER", re.I), "Tennis"),
    (re.compile(r"^KXITF", re.I), "Tennis"),
    (re.compile(r"^KXUFC|^KXMMA|^KXBOX", re.I), "MMA"),
    (re.compile(r"^KXEPL|^KXUCL|^KXUEL|^KXMLS|^KXLAL|^KXBUN|^KXSEA|^KXFL1|"
                 r"^KXINTL|^KXCONCACAF|^KXCONMEBOL|^KXFIF|^KXUNL|^KXNWSL|"
                 r"^KXLIGUE|^KXSERIE|^KXERED|^KXLIGA", re.I), "Soccer"),
    (re.compile(r"^KXVALORANT|^KXVAL", re.I), "Esports"),
    (re.compile(r"^KXCS2|^KXCSGO|^KXCOUNTER", re.I), "Esports"),
    (re.compile(r"^KXLOL|^KXLEAGUEOF", re.I), "Esports"),
    (re.compile(r"^KXDOTA", re.I), "Esports"),
    (re.compile(r"^KXCOD|^KXOVL|^KXR6|^KXRL", re.I), "Esports"),
    (re.compile(r"^KXPGA|^KXLPGA|^KXGOLF", re.I), "Golf"),
    (re.compile(r"^KXF1|^KXNASCAR|^KXINDY|^KXMOTO", re.I), "Racing"),
    (re.compile(r"^KXCFL", re.I), "CFL"),
    (re.compile(r"^KXNRL|^KXAFL", re.I), "Rugby"),
    (re.compile(r"^KXT20|^KXCRIC|^KXIPL|^KXTEST", re.I), "Cricket"),
]


def pt(ts):
    return dt.datetime.fromtimestamp(int(ts), PT).strftime("%a %b %-d · %-I:%M %p PT")


def load_config():
    names = list(DEFAULT_BLOCKLIST)
    if os.path.exists(CONFIG_PATH):
        try:
            raw = json.load(open(CONFIG_PATH, encoding="utf-8"))
            extra = raw.get("blocklist") or raw.get("blocked") or []
            if isinstance(extra, str):
                extra = [extra]
            names.extend(str(x).strip() for x in extra if str(x).strip())
        except Exception as e:
            print("kalshi_cappers config read failed:", e, flush=True)
    # Preserve first-seen casing; match later is case-insensitive.
    out, seen = [], set()
    for n in names:
        k = n.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(n)
    return {"blocklist": out}


def blocked_set(cfg):
    return {n.lower() for n in (cfg.get("blocklist") or [])}


class Http:
    def __init__(self):
        self.last = 0.0
        self.calls = 0
        self.retries_429 = 0

    def _sleep_gap(self):
        wait = MIN_INTERVAL - (time.time() - self.last)
        if wait > 0:
            time.sleep(wait)

    def get(self, url, params=None, timeout=25):
        if params:
            url = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
        delay = 1.0
        last_err = None
        for attempt in range(6):
            self._sleep_gap()
            self.last = time.time()
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=timeout) as r:
                    self.calls += 1
                    return json.loads(r.read().decode())
            except urllib.error.HTTPError as e:
                body = e.read().decode(errors="replace") if e.fp else ""
                if e.code == 429:
                    self.retries_429 += 1
                    print(f"kalshi_cappers 429 backoff {delay:.0f}s {url[:80]}", flush=True)
                    time.sleep(delay)
                    delay = min(delay * 2, 32)
                    last_err = e
                    continue
                if e.code in (500, 502, 503, 504) and attempt < 5:
                    time.sleep(delay)
                    delay = min(delay * 2, 16)
                    last_err = e
                    continue
                try:
                    return json.loads(body) if body else {}
                except Exception:
                    return {}
            except Exception as e:
                last_err = e
                time.sleep(min(delay, 4))
                delay = min(delay * 2, 16)
        if last_err:
            print("kalshi_cappers http failed:", url[:120], last_err, flush=True)
        return {}


def usd_units(raw):
    if raw is None:
        return None
    try:
        return float(raw) / 10000.0
    except Exception:
        return None


def iso_ts(raw):
    if not raw:
        return None
    try:
        s = str(raw).replace(" ", "T").replace("Z", "+00:00")
        if re.match(r".*[+-]\d{2}$", s):
            s = s + ":00"
        return int(dt.datetime.fromisoformat(s).timestamp())
    except Exception:
        return None


def league_of(ticker, category=None):
    tk = ticker or ""
    for rx, name in LEAGUE_RES:
        if rx.search(tk):
            return name
    if category and str(category).lower() == "sports":
        return "Sports"
    return None


def is_non_sport_ticker(ticker):
    return bool(NON_SPORT_RE.match(ticker or ""))


def notional(price, count):
    try:
        return float(price) * float(count)
    except Exception:
        return 0.0


def median(xs):
    xs = sorted(x for x in xs if x is not None)
    if not xs:
        return None
    n = len(xs)
    mid = n // 2
    return xs[mid] if n % 2 else (xs[mid - 1] + xs[mid]) / 2.0


def parse_trade_role(tr, nick):
    """Return (action, side, is_maker) from the capper's point of view, or None."""
    nl = (nick or "").lower()
    taker = (tr.get("taker_nickname") or "").lower()
    maker = (tr.get("maker_nickname") or "").lower()
    action = (tr.get("taker_action") or "").lower()
    side = (tr.get("taker_side") or "").lower()
    if side not in ("yes", "no") or action not in ("buy", "sell"):
        return None
    if taker == nl:
        return action, side, False
    if maker == nl:
        opp = "sell" if action == "buy" else "buy"
        return opp, side, True
    return None


def apply_fill(inv, action, side, price, qty, ts):
    """Track signed YES inventory (long YES +, long NO -). Return realized $."""
    # Represent long NO as negative YES at complementary price.
    signed = qty if side == "yes" else -qty
    px_yes = price if side == "yes" else (1.0 - price)
    if action == "sell":
        signed = -signed
        # selling NO is covering a short YES / adding YES
    realized = 0.0
    pos = inv["pos"]
    cost = inv["cost"]  # dollars tied to current pos (positive cash outlay)
    # New signed delta:
    if action == "buy" and side == "yes":
        delta, trade_px = qty, price
    elif action == "sell" and side == "yes":
        delta, trade_px = -qty, price
    elif action == "buy" and side == "no":
        delta, trade_px = -qty, (1.0 - price)
    else:  # sell no
        delta, trade_px = qty, (1.0 - price)

    if pos == 0 or (pos > 0 and delta > 0) or (pos < 0 and delta < 0):
        # Adding to the same direction
        inv["pos"] = pos + delta
        inv["cost"] = cost + abs(delta) * trade_px
        inv["last_ts"] = ts
        return 0.0

    # Reducing or flipping
    close_qty = min(abs(pos), abs(delta))
    avg = (cost / abs(pos)) if pos else trade_px
    # If we were long YES (pos>0), selling YES (or buying NO) realizes trade_px - avg
    # If we were short YES / long NO (pos<0), covering realizes avg - trade_px (entry was 1-no or sell yes)
    if pos > 0:
        realized = close_qty * (trade_px - avg)
    else:
        realized = close_qty * (avg - trade_px)
    remain = abs(pos) - close_qty
    leftover_delta = abs(delta) - close_qty
    if remain <= 1e-9:
        inv["pos"] = 0.0
        inv["cost"] = 0.0
        if leftover_delta > 1e-9:
            sign = 1 if delta > 0 else -1
            inv["pos"] = sign * leftover_delta
            inv["cost"] = leftover_delta * trade_px
    else:
        sign = 1 if pos > 0 else -1
        inv["pos"] = sign * remain
        inv["cost"] = remain * avg
    inv["last_ts"] = ts
    return realized


def mm_flags(trades, nick):
    """Return (is_mm, reasons) from a trade sample."""
    if not trades:
        return False, []
    reasons = []
    times = []
    maker_n = 0
    near = 0
    for tr in trades:
        role = parse_trade_role(tr, nick)
        if not role:
            continue
        _a, _s, is_maker = role
        ts = iso_ts(tr.get("create_date"))
        if ts:
            times.append(ts)
        if is_maker:
            maker_n += 1
        try:
            px = float(tr.get("price_dollars") or (float(tr.get("price") or 0) / 100.0))
        except Exception:
            px = 0
        if px >= 0.95 or px <= 0.05:
            near += 1
    n = max(len(trades), 1)
    maker_share = maker_n / n
    near_share = near / n
    # Many fills in a short window
    burst = False
    if len(times) >= 40:
        times.sort()
        j = 0
        for i, t in enumerate(times):
            while times[j] < t - 600:
                j += 1
            if i - j + 1 >= 40:
                burst = True
                break
        span = times[-1] - times[0]
        if len(times) >= 80 and span <= 15 * 60:
            burst = True
    if burst:
        reasons.append("many fills in minutes")
    if near_share >= 0.45 and n >= 30:
        reasons.append("lots of 99¢ size")
    if maker_share >= 0.70 and n >= 40:
        reasons.append("mostly maker fills")
    # Need a cluster of HFT/MM signals. A clipped entry burst alone is not enough.
    is_mm = (
        len(reasons) >= 2
        or (maker_share >= 0.80 and n >= 80)
        or (burst and near_share >= 0.40)
        or (burst and maker_share >= 0.60 and n >= 40)
    )
    return is_mm, reasons


def early_mm(trades, nick):
    """Cheap first-page MM screen so we don't paginate HFT books."""
    if len(trades) < 60:
        return False
    is_mm, _ = mm_flags(trades, nick)
    return is_mm


def fetch_leaderboards(http):
    out = {}
    coverage = {}
    for period in ("monthly", "weekly", "all_time"):
        data = http.get(f"{SOCIAL}/leaderboard", {
            "metric_name": "projected_pnl",
            "category": "Sports",
            "time_period": period,
            "limit": 100,
        }) or {}
        rows = data.get("rank_list") or []
        coverage[period] = len(rows)
        for row in rows:
            nick = (row.get("nickname") or "").strip()
            if not nick:
                continue
            rec = out.setdefault(nick, {"nickname": nick, "ranks": {}, "pnl": {}})
            rec["ranks"][period] = row.get("rank")
            rec["pnl"][period] = row.get("value")
            rec["is_anonymous"] = bool(row.get("is_anonymous"))
    return out, coverage


def holdings_visible(http, nick, limit=20):
    data = http.get(f"{SOCIAL}/profile/holdings", {"nickname": nick, "limit": limit}) or {}
    vis = data.get("visibility_state")
    return vis, data


def paginate_holdings(http, nick):
    holdings, cursor, vis = [], None, None
    for _ in range(8):
        params = {"nickname": nick, "limit": 100}
        if cursor:
            params["cursor"] = cursor
        data = http.get(f"{SOCIAL}/profile/holdings", params) or {}
        vis = data.get("visibility_state") or vis
        if vis == "hidden":
            return "hidden", []
        batch = data.get("holdings") or []
        holdings.extend(batch)
        cursor = data.get("cursor")
        if not cursor or not batch:
            break
    return vis or "visible", holdings


def paginate_trades(http, nick, now, stop_ts):
    trades, cursor = [], None
    vis = None
    for page in range(MAX_TRADE_PAGES):
        params = {"nickname": nick, "page_size": 100}
        if cursor:
            params["cursor"] = cursor
        data = http.get(f"{SOCIAL}/trades", params) or {}
        vis = data.get("visibility_state") or vis
        if vis == "hidden":
            return "hidden", []
        batch = data.get("trades") or []
        if not batch:
            break
        trades.extend(batch)
        if page == 0 and early_mm(batch, nick):
            return vis or "visible", trades  # caller will MM-drop
        oldest = iso_ts(batch[-1].get("create_date"))
        if oldest is not None and oldest < stop_ts:
            break
        cursor = data.get("cursor")
        if not cursor:
            break
    return vis or "visible", trades


def market_quote(http, ticker, cache):
    if ticker in cache:
        return cache[ticker]
    data = http.get(f"{TRADE}/markets/{urllib.parse.quote(ticker, safe='')}") or {}
    m = data.get("market") or data
    cache[ticker] = m if m and m.get("ticker") else {}
    return cache[ticker]


def event_info(http, event_ticker, cache):
    if not event_ticker:
        return {}
    if event_ticker in cache:
        return cache[event_ticker]
    data = http.get(f"{TRADE}/events/{urllib.parse.quote(event_ticker, safe='')}") or {}
    ev = data.get("event") or data
    cache[event_ticker] = ev if ev else {}
    return cache[event_ticker]


def hydrate_market(http, ticker, mcache, ecache):
    m = market_quote(http, ticker, mcache)
    ev_tk = m.get("event_ticker") or ""
    ev = event_info(http, ev_tk, ecache) if ev_tk else {}
    category = ev.get("category") or m.get("category")
    yes_ask = None
    no_ask = None
    try:
        yes_ask = float(m.get("yes_ask_dollars"))
    except Exception:
        pass
    try:
        no_ask = float(m.get("no_ask_dollars"))
    except Exception:
        pass
    start = iso_ts(m.get("occurrence_datetime") or m.get("occurrence_time") or m.get("event_time"))
    if not start:
        start = iso_ts(ev.get("occurrence_datetime") or ev.get("strike_date") or ev.get("target_datetime"))
    close = iso_ts(m.get("close_time") or m.get("latest_expiration_time") or ev.get("close_time"))
    status = (m.get("status") or ev.get("status") or "").lower()
    return {
        "ticker": ticker,
        "event_ticker": ev_tk,
        "title": m.get("title") or "",
        "event_title": ev.get("title") or "",
        "yes_sub_title": m.get("yes_sub_title") or "",
        "no_sub_title": m.get("no_sub_title") or "",
        "yes_ask": yes_ask,
        "no_ask": no_ask,
        "status": status,
        "category": category,
        "start_ts": start,
        "close_ts": close,
        "result": m.get("result"),
    }


def is_sports_market(info, ticker):
    if is_non_sport_ticker(ticker):
        return False
    cat = (info.get("category") or "").strip().lower()
    if cat in ("crypto", "economics", "economy", "politics", "climate", "weather", "culture", "elections", "financials", "mentions", "companies", "world"):
        return False
    if cat == "combos":
        return False
    if cat == "sports":
        return True
    if league_of(ticker):
        return True
    # Unknown ticker and no category: exclude unless it already looked like sports
    return False


def open_state(info, now):
    status = (info.get("status") or "").lower()
    if status in ("finalized", "determined", "settled", "closed", "deactivated", "inactive"):
        return "final"
    if info.get("result"):
        return "final"
    start = info.get("start_ts") or 0
    close = info.get("close_ts") or 0
    if close and now >= close:
        return "final"
    if start and now >= start:
        return "live"
    return "upcoming"


def build_inventory(trades, nick):
    by = defaultdict(lambda: {"pos": 0.0, "cost": 0.0, "last_ts": None, "realized": 0.0, "realized_recent": 0.0, "fills": 0, "entries": []})
    ordered = sorted(trades, key=lambda t: iso_ts(t.get("create_date")) or 0)
    for tr in ordered:
        role = parse_trade_role(tr, nick)
        if not role:
            continue
        action, side, _ = role
        ticker = tr.get("ticker")
        if not ticker:
            continue
        try:
            px = float(tr.get("price_dollars") or (float(tr.get("price") or 0) / 100.0))
            qty = float(tr.get("count_fp") or tr.get("count") or 0)
        except Exception:
            continue
        if qty <= 0 or px <= 0:
            continue
        ts = iso_ts(tr.get("create_date"))
        inv = by[ticker]
        realized = apply_fill(inv, action, side, px, qty, ts)
        inv["realized"] += realized
        inv["fills"] += 1
        inv["entries"].append((ts, action, side, px, qty, realized))
    return by



def is_sports_ticker(tk):
    return bool(tk) and not is_non_sport_ticker(tk)


def age_days(joined_at, now):
    if not joined_at:
        return None
    try:
        d = dt.date.fromisoformat(str(joined_at)[:10])
        return (dt.datetime.fromtimestamp(int(now), PT).date() - d).days
    except Exception:
        return None


def closed_cycles(trades, nick):
    """Replay sports fills and emit one cycle each time a market position flattens."""
    by_tk = defaultdict(list)
    for tr in trades:
        tk = tr.get("ticker") or ""
        if not is_sports_ticker(tk):
            continue
        if not parse_trade_role(tr, nick):
            continue
        by_tk[tk].append(tr)
    cycles = []
    for tk, rows in by_tk.items():
        inv = {"pos": 0.0, "cost": 0.0, "last_ts": None}
        cycle_realized = 0.0
        cycle_risked = 0.0
        cycle_ts0 = None
        open_cyc = False
        for tr in sorted(rows, key=lambda r: iso_ts(r.get("create_date")) or 0):
            role = parse_trade_role(tr, nick)
            if not role:
                continue
            action, side, _ = role
            try:
                px = float(tr.get("price_dollars") or (float(tr.get("price") or 0) / 100.0))
                qty = float(tr.get("count_fp") or tr.get("count") or 0)
            except Exception:
                continue
            if qty <= 0 or px <= 0:
                continue
            ts = iso_ts(tr.get("create_date"))
            before = inv["pos"]
            realized = apply_fill(inv, action, side, px, qty, ts)
            cycle_realized += realized
            if action == "buy" or (abs(before) <= 1e-9 and abs(inv["pos"]) > 1e-9):
                cycle_risked += notional(px, qty)
            if cycle_ts0 is None:
                cycle_ts0 = ts
            open_cyc = True
            if open_cyc and abs(inv["pos"]) <= 1e-6:
                cycles.append({"ticker": tk, "risked": cycle_risked, "profit": cycle_realized, "ts": cycle_ts0, "end": ts})
                cycle_realized = 0.0
                cycle_risked = 0.0
                cycle_ts0 = None
                open_cyc = False
    return cycles


def grade_big_bets(cycles, floor):
    big = [c for c in cycles if (c.get("risked") or 0) >= floor]
    profit = sum(c["profit"] for c in big)
    risked = sum(c["risked"] for c in big)
    wins = sum(1 for c in big if c["profit"] > 0)
    losses = sum(1 for c in big if c["profit"] < 0)
    roi = (100.0 * profit / risked) if risked > 0 else None
    first_ts = min((c["ts"] for c in big if c.get("ts")), default=None)
    last_ts = max((c["end"] or c["ts"] for c in big if c.get("ts") or c.get("end")), default=None)
    return {
        "n": len(big), "w": wins, "l": losses, "push": max(0, len(big) - wins - losses),
        "profit": profit, "risked": risked, "roi": roi, "firstTs": first_ts, "lastTs": last_ts,
        "cycles": len(cycles),
    }


def recent_realized(inv_map, now, days=FORM_DAYS):
    cutoff = now - days * 86400
    total = 0.0
    n_closed = 0
    for inv in inv_map.values():
        for ts, action, side, px, qty, realized in inv.get("entries") or []:
            if realized and ts and ts >= cutoff:
                total += realized
                n_closed += 1
    return total, n_closed


def pick_entry_and_cost(inv, signed_pos):
    """VWAP and dollar cost for the current signed YES position."""
    pos = signed_pos
    if abs(pos) < 1e-9:
        return None, 0.0
    if inv and abs(inv.get("pos") or 0) > 1e-9:
        # Prefer inventory if sign matches
        if (inv["pos"] > 0 and pos > 0) or (inv["pos"] < 0 and pos < 0):
            avg = inv["cost"] / abs(inv["pos"])
            # If holding NO, display entry is the NO price (1 - yes-avg)
            entry = avg if pos > 0 else (1.0 - avg if avg <= 1 else avg)
            cost = abs(pos) * entry
            return entry, cost
    if inv and inv.get("cost") and abs(inv.get("pos") or 0) > 1e-9:
        avg = inv["cost"] / abs(inv["pos"])
        entry = avg if pos > 0 else 1.0 - avg
        return entry, abs(pos) * entry
    return None, 0.0


def build(now=None):
    now = int(now or time.time())
    t0 = time.time()
    http = Http()
    cfg = load_config()
    blocked = blocked_set(cfg)
    stop_ts = now - RECORD_DAYS * 86400

    boards, board_cov = fetch_leaderboards(http)
    nicks = sorted(boards.keys(), key=lambda n: (boards[n]["ranks"].get("monthly") or 9999,
                                                 boards[n]["ranks"].get("weekly") or 9999,
                                                 boards[n]["ranks"].get("all_time") or 9999,
                                                 n.lower()))

    cov = {
        "leaderboardNames": len(nicks),
        "boards": board_cov,
        "visible": 0,
        "hidden": 0,
        "blocked": 0,
        "blockedNames": [],
        "mmDropped": 0,
        "tooYoung": 0,
        "noPnl": 0,
        "negativePnl": 0,
        "smallPnl": 0,
        "thinRecord": 0,
        "negativeRoi": 0,
        "avgEntryHigh": 0,
        "failedFilters": 0,
        "passed": 0,
        "shown": 0,
        "picks": 0,
        "calls": 0,
        "retries429": 0,
        "secs": 0,
    }

    visible_rows = []
    mcache, ecache = {}, {}

    for nick in nicks:
        if nick.lower() in blocked:
            cov["blocked"] += 1
            cov["blockedNames"].append(nick)
            # Still need to know visibility? No — skip entirely as requested.
            continue
        vis, hold_data = holdings_visible(http, nick, limit=5)
        if vis != "visible":
            cov["hidden"] += 1
            continue
        cov["visible"] += 1

        # Detail only for visible nicknames
        prof = (http.get(f"{SOCIAL}/profile", {"nickname": nick}) or {}).get("social_profile") or {}
        metrics = (http.get(f"{SOCIAL}/profile/metrics", {"nickname": nick}) or {}).get("metrics") or {}
        vis2, holdings = paginate_holdings(http, nick)
        if vis2 == "hidden":
            cov["visible"] -= 1
            cov["hidden"] += 1
            continue
        vis3, trades = paginate_trades(http, nick, now, stop_ts)
        if vis3 == "hidden":
            cov["visible"] -= 1
            cov["hidden"] += 1
            continue

        is_mm, mm_why = mm_flags(trades, nick)
        if is_mm:
            cov["mmDropped"] += 1
            print(f"kalshi_cappers MM drop {nick}: {', '.join(mm_why)} trades={len(trades)}", flush=True)
            continue

        inv_map = build_inventory(trades, nick)
        all_time_pnl = usd_units(metrics.get("pnl"))
        if all_time_pnl is None:
            all_time_pnl = boards[nick]["pnl"].get("all_time")
        weekly_pnl = boards[nick]["pnl"].get("weekly")
        monthly_pnl = boards[nick]["pnl"].get("monthly")

        age = age_days(prof.get("joined_at"), now)
        if age is None or age < MIN_AGE_DAYS:
            cov["tooYoung"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: age={age}d (need {MIN_AGE_DAYS}+)", flush=True)
            continue

        if all_time_pnl is None:
            cov["noPnl"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: no all-time PnL", flush=True)
            continue
        if all_time_pnl <= 0:
            cov["negativePnl"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: all-time PnL ${all_time_pnl:,.0f}", flush=True)
            continue
        if all_time_pnl < MIN_PNL:
            cov["smallPnl"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: all-time PnL ${all_time_pnl:,.0f} below ${MIN_PNL:,.0f}", flush=True)
            continue

        cycles = closed_cycles(trades, nick)
        cycle_risked = [c["risked"] for c in cycles if c.get("risked")]
        med = median(cycle_risked) if cycle_risked else None
        floor = MIN_BIG if (med is None or len(cycle_risked) < 3) else max(MIN_BIG, 1.5 * med)
        graded = grade_big_bets(cycles, floor)
        if graded["n"] < MIN_GRADED:
            cov["thinRecord"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: thin record {graded['n']} graded big bets (need {MIN_GRADED}+)", flush=True)
            continue
        if graded["roi"] is None or graded["roi"] <= 0:
            cov["negativeRoi"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: big-bet ROI {graded['roi']} on {graded['n']} bets", flush=True)
            continue

        entry_pxs = []
        sports_trades = 0
        for tr in trades:
            tk = tr.get("ticker") or ""
            if not is_sports_ticker(tk):
                continue
            role = parse_trade_role(tr, nick)
            if not role:
                continue
            try:
                px = float(tr.get("price_dollars") or (float(tr.get("price") or 0) / 100.0))
                qty = float(tr.get("count_fp") or tr.get("count") or 0)
            except Exception:
                continue
            if px <= 0 or qty <= 0:
                continue
            sports_trades += 1
            if role[0] == "buy" and px < 0.95:
                entry_pxs.append(px)
        avg_entry = (sum(entry_pxs) / len(entry_pxs)) if entry_pxs else None
        if avg_entry is not None and avg_entry >= MAX_ENTRY:
            cov["avgEntryHigh"] += 1
            cov["failedFilters"] += 1
            print(f"kalshi_cappers drop {nick}: avg entry {avg_entry:.2f}", flush=True)
            continue

        rec_n = int(metrics.get("num_markets_traded") or 0)
        realized_14, closed_14 = recent_realized(inv_map, now, FORM_DAYS)
        visible_rows.append({
            "nickname": nick,
            "profile": prof,
            "metrics": metrics,
            "boards": boards[nick],
            "holdings": holdings,
            "trades": trades,
            "inv": inv_map,
            "floor": floor,
            "median": med,
            "avg_entry": avg_entry,
            "all_time_pnl": all_time_pnl,
            "weekly_pnl": weekly_pnl,
            "monthly_pnl": monthly_pnl,
            "sports_trades": sports_trades,
            "realized_14": realized_14,
            "closed_14": closed_14,
            "rec_n": rec_n,
            "age": age,
            "graded": graded,
        })

    # Hydrate unique open holding tickers for remaining candidates
    need = set()
    for row in visible_rows:
        for h in row["holdings"] or []:
            for mh in h.get("market_holdings") or []:
                tk = mh.get("market_ticker")
                if tk:
                    need.add(tk)
    infos = {}
    for tk in sorted(need):
        infos[tk] = hydrate_market(http, tk, mcache, ecache)

    cappers = []
    for row in visible_rows:
        nick = row["nickname"]
        picks = []
        mtm = 0.0
        for h in row["holdings"] or []:
            ev_tk = h.get("event_ticker") or ""
            for mh in h.get("market_holdings") or []:
                tk = mh.get("market_ticker")
                if not tk:
                    continue
                try:
                    signed = float(mh.get("signed_open_position") or 0)
                except Exception:
                    signed = 0.0
                if abs(signed) < 0.5:
                    continue
                info = infos.get(tk) or hydrate_market(http, tk, mcache, ecache)
                if not is_sports_market(info, tk):
                    continue
                state = open_state(info, now)
                if state == "final":
                    continue
                inv = row["inv"].get(tk)
                entry, cost = pick_entry_and_cost(inv, signed)
                side = "yes" if signed > 0 else "no"
                ask = info.get("yes_ask") if side == "yes" else info.get("no_ask")
                if entry is None and ask is not None:
                    entry = ask
                    cost = abs(signed) * entry
                if entry is not None and entry >= MAX_ENTRY:
                    continue
                if cost < row["floor"]:
                    continue
                if ask is None:
                    continue
                last_ts = (inv or {}).get("last_ts")
                # fallback: latest trade on this ticker
                if not last_ts:
                    for tr in row["trades"]:
                        if tr.get("ticker") == tk:
                            last_ts = iso_ts(tr.get("create_date"))
                            break
                slip = None
                if entry is not None and ask is not None:
                    slip = round((ask - entry) * 100, 1)
                if entry is not None:
                    mtm += (ask - entry) * abs(signed) if side == "yes" else ((1 - ask) - (1 - entry)) * abs(signed)
                    # For NO: entry is NO price, ask is NO ask; MTM = (ask-entry)*qty is wrong if we want PnL on the NO contracts...
                    # Buying NO at entry, current NO ask: unrealized = (ask - entry) * qty? That's mark-to-exit if selling NO. Use (current - entry)*contracts.
                    mtm = mtm  # already using (ask-entry)*abs(signed) if we set it correctly
                # Fix MTM uniformly: (current_side_ask - entry) * contracts
                # Recompute cleanly:
                backing = info.get("yes_sub_title") if side == "yes" else info.get("no_sub_title")
                backing = backing or info.get("title") or tk
                game = info.get("event_title") or info.get("title") or ev_tk or tk
                league = league_of(tk, info.get("category")) or "Sports"
                start_ts = info.get("start_ts") or 0
                stale = bool(last_ts and (now - last_ts) > STALE_SEC)
                price_moved = bool(slip is not None and abs(slip) >= 1.0)
                picks.append({
                    "id": nick + "|" + tk + "|" + side,
                    "ticker": tk,
                    "eventTicker": info.get("event_ticker") or ev_tk,
                    "marketTitle": info.get("event_title") or info.get("title") or "",
                    "contractTitle": info.get("title") or "",
                    "backing": backing,
                    "action": "BUY YES" if side == "yes" else "BUY NO",
                    "side": side,
                    "yesNo": "Yes" if side == "yes" else "No",
                    "label": backing,
                    "entry": round(entry, 4) if entry is not None else None,
                    "price": round(ask, 4),
                    "yesAsk": info.get("yes_ask"),
                    "noAsk": info.get("no_ask"),
                    "yesSubTitle": info.get("yes_sub_title") or "",
                    "noSubTitle": info.get("no_sub_title") or "",
                    "cost": round(cost, 2),
                    "contracts": round(abs(signed), 2),
                    "lastTs": last_ts,
                    "startTs": start_ts or 0,
                    "start": pt(start_ts) if start_ts else "",
                    "state": state,
                    "league": league,
                    "game": game,
                    "stale": stale,
                    "slip": slip,
                    "priceMoved": price_moved,
                })

        # Recompute MTM cleanly from picks
        mtm = 0.0
        for p in picks:
            if p.get("entry") is not None and p.get("price") is not None:
                mtm += (p["price"] - p["entry"]) * p["contracts"]
        form_pnl = (row["realized_14"] or 0) + mtm
        cov["passed"] += 1
        if not picks:
            continue

        picks.sort(key=lambda p: (0 if p["state"] == "live" else 1, p.get("startTs") or 9e15, -(p.get("cost") or 0)))
        prof = row["profile"]
        pnl = row["all_time_pnl"]
        g = row["graded"]
        rec_line_bits = []
        if g and g.get("n"):
            rec_line_bits.append("%d–%d big" % (g.get("w") or 0, g.get("l") or 0))
            if g.get("roi") is not None:
                rec_line_bits.append("%s%.0f%% big-bet ROI" % ("+" if g["roi"] >= 0 else "", g["roi"]))
        if pnl is not None:
            rec_line_bits.append(("+" if pnl >= 0 else "") + ("$%s" % f"{pnl:,.0f}") + " all-time")
        if row.get("age") is not None:
            rec_line_bits.append("%dd account" % row["age"])
        if row["avg_entry"] is not None:
            rec_line_bits.append("avg entry %s¢" % (round(row["avg_entry"] * 1000) / 10))
        score = 0.0
        if g and g.get("roi") is not None:
            score += max(0, min(40, g["roi"]))
        if g and g.get("n"):
            score += min(20, g["n"] / 3.0)
        if pnl is not None:
            score += max(0, min(30, pnl / 50000.0 * 10))
        if row["weekly_pnl"]:
            score += max(0, min(10, row["weekly_pnl"] / 5000.0 * 5))
        cappers.append({
            "nickname": nick,
            "profileUrl": "https://kalshi.com/ideas/profiles/" + urllib.parse.quote(nick, safe="."),
            "joinedAt": prof.get("joined_at") or "",
            "followers": prof.get("follower_count") or 0,
            "ranks": row["boards"]["ranks"],
            "pnl": pnl,
            "weeklyPnl": row["weekly_pnl"],
            "monthlyPnl": row["monthly_pnl"],
            "markets": row["rec_n"],
            "avgEntry": round(row["avg_entry"], 4) if row["avg_entry"] is not None else None,
            "medStake": round(row["median"], 2) if row["median"] is not None else None,
            "floor": round(row["floor"], 2),
            "ageDays": row.get("age"),
            "graded": {"n": g.get("n"), "w": g.get("w"), "l": g.get("l"), "roi": None if g.get("roi") is None else round(g["roi"], 1), "profit": round(g.get("profit") or 0, 2), "risked": round(g.get("risked") or 0, 2)},
            "recordLine": " · ".join(rec_line_bits) or "Record n/a",
            "formPnl": round(form_pnl, 2),
            "score": round(score, 2),
            "picks": picks,
        })

    cappers.sort(key=lambda c: (-(c.get("score") or 0), -(c.get("pnl") or 0), c["nickname"].lower()))
    cov["shown"] = len(cappers)
    cov["picks"] = sum(len(c["picks"]) for c in cappers)

    # Suggested $2 two-leg combos from upcoming, non-stale, <2¢ slip, different events
    legs = []
    for c in cappers:
        for p in c["picks"]:
            if p.get("state") != "upcoming":
                continue
            if p.get("stale"):
                continue
            if p.get("slip") is not None and p["slip"] >= SLIP_COMBO_MAX:
                continue
            if not p.get("price"):
                continue
            legs.append((c, p))
    legs.sort(key=lambda x: (-(x[0].get("score") or 0), -(x[1].get("price") or 0), -(x[1].get("cost") or 0)))
    combos = []
    used_events = set()
    used_pair = set()
    for i in range(len(legs)):
        if len(combos) >= 3:
            break
        c1, p1 = legs[i]
        ev1 = p1.get("eventTicker") or p1.get("ticker")
        if ev1 in used_events:
            continue
        for j in range(i + 1, len(legs)):
            c2, p2 = legs[j]
            ev2 = p2.get("eventTicker") or p2.get("ticker")
            if ev2 == ev1 or ev2 in used_events:
                continue
            key = tuple(sorted([p1["id"], p2["id"]]))
            if key in used_pair:
                continue
            combined = (p1["price"] or 0) * (p2["price"] or 0)
            if combined <= 0:
                continue
            used_pair.add(key)
            used_events.add(ev1)
            used_events.add(ev2)
            combos.append({
                "combined": round(combined, 4),
                "legs": [
                    {"nickname": c1["nickname"], "pickId": p1["id"], "game": p1["game"], "league": p1["league"],
                     "label": p1["label"], "price": p1["price"], "ticker": p1["ticker"], "action": p1["action"],
                     "marketTitle": p1["marketTitle"], "backing": p1["backing"], "yesNo": p1["yesNo"],
                     "yesSubTitle": p1["yesSubTitle"], "noSubTitle": p1["noSubTitle"], "contractTitle": p1["contractTitle"]},
                    {"nickname": c2["nickname"], "pickId": p2["id"], "game": p2["game"], "league": p2["league"],
                     "label": p2["label"], "price": p2["price"], "ticker": p2["ticker"], "action": p2["action"],
                     "marketTitle": p2["marketTitle"], "backing": p2["backing"], "yesNo": p2["yesNo"],
                     "yesSubTitle": p2["yesSubTitle"], "noSubTitle": p2["noSubTitle"], "contractTitle": p2["contractTitle"]},
                ],
            })
            break

    cov["calls"] = http.calls
    cov["retries429"] = http.retries_429
    cov["secs"] = round(time.time() - t0, 1)
    payload = {
        "updatedAt": pt(now),
        "updatedTs": now,
        "blocklist": cfg["blocklist"],
        "coverage": cov,
        "cappers": cappers,
        "combos": combos,
    }
    print(
        "kalshiCappers visible {visible} hidden {hidden} blocked {blocked} mm {mmDropped} "
        "failed {failedFilters} passed {passed} shown {shown} picks {picks} "
        "calls {calls} 429s {retries429} secs {secs}".format(**cov),
        flush=True,
    )
    return payload


def attach(emb, now=None):
    try:
        data = build(now=now)
    except Exception as e:
        print("kalshiCappers failed:", e, flush=True)
        data = {
            "updatedAt": pt(int(now or time.time())),
            "updatedTs": int(now or time.time()),
            "blocklist": load_config()["blocklist"],
            "coverage": {"error": str(e)},
            "cappers": [],
            "combos": [],
        }
    emb["kalshiCappers"] = data
    return data


if __name__ == "__main__":
    payload = build()
    out_path = os.path.join(HERE, "kalshi_cappers.json")
    json.dump(payload, open(out_path, "w"), indent=2)
    print("wrote", out_path, "cappers", len(payload.get("cappers") or []), "picks", payload.get("coverage", {}).get("picks"))
