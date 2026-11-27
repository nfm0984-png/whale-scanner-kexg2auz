#!/usr/bin/env python3
"""Market-maker / bot and one-off (jackpot) flags from Polymarket v2 user-stats.

Thresholds were set so today's 14 elites (and primm) stay clear, while known
makers (swisstony, RN1, ferrariChampions2026, HomeRunHazard) and World Cup
one-hit wallets are flagged. Public API, no Orca key.
"""
import json, os, time, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

HERE = os.path.dirname(os.path.abspath(__file__))
STATS = os.path.join(HERE, 'wallet_stats.json')
UA = {'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'}

# Market maker / bot (eligibility drop)
MM_TRADE_COUNT = 100000     # individual fills; elites max ~29k, primm ~20k; RN1/swisstony are millions
MM_MARKETS = 10000          # distinct markets; elites max ~4.4k, primm ~4.2k
MM_MAKER_REBATE = 50000     # USD; elites max ~$10.5k
# Huge directional sports books can earn a large rebate just from volume (gmpm2: $105k rebate
# on $132M volume, 99% sports buys, Orca market_maker=False). Only treat rebate as an MM
# signal when it is also a meaningful share of volume, like a liquidity provider.
MM_MAKER_REBATE_SHARE = 0.002  # 0.20% of volume
MM_FEE_REFUND = 100000      # USD; primm ~$29k, PowerSupplyUnit ~$72k; swisstony/RN1 are millions
MM_HEDGE_N = 20             # open hedged positions
MM_HEDGE_MIN = 8
MM_HEDGE_SHARE = 0.25

# One-off / jackpot (elite exclusion only; still listed, tagged)
ONEOFF_BIGGEST = 0.40       # biggest win / lifetime profit; Selfish-Herbs is 39.8% and stays
ONEOFF_THIN_MARKETS = 20
ONEOFF_FEW_MARKETS = 5      # fewer than this means all profit is in 1-5 bets

# Copy-price / freshness (shared with proven, refresh, and the page)
KALSHI_TAKER = 0.07
SLIP_CAP_CENTS = 2.0
STALE_SECS = 3600
STATS_TTL = 12 * 3600

def kalshi_fee(p):
    try:
        p = float(p)
    except (TypeError, ValueError):
        return None
    return KALSHI_TAKER * p * (1.0 - p)

def slip_cents(kprice, entry):
    fee = kalshi_fee(kprice)
    if fee is None or entry is None:
        return None
    try:
        return (float(kprice) + fee - float(entry)) * 100.0
    except (TypeError, ValueError):
        return None

# Ranked / Coming Up hide a pick when Kalshi is more than this many cents worse than entry (after fee).
# Golden Picks keeps the stricter SLIP_CAP_CENTS = 2.0 gate and does not use this.
RANKED_STALE_CENTS = 6.0

def too_expensive(kprice, entry, cap=None):
    """True when Kalshi (plus taker fee) is more than `cap` cents worse than the whale's entry.

    Default cap is RANKED_STALE_CENTS (6¢) for Ranked / Coming Up / future scorecards.
    Pass cap=SLIP_CAP_CENTS (2.0) for Golden Picks. cap=None disables the check.
    """
    if cap is None:
        return False
    sl = slip_cents(kprice, entry)
    return sl is not None and sl > cap

def load_stats():
    try:
        return json.load(open(STATS))
    except Exception:
        return {'updatedTs': 0, 'wallets': {}}

def save_stats(store):
    store['updatedTs'] = int(time.time())
    json.dump(store, open(STATS, 'w'), separators=(',', ':'))

def _get(url, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def _fetch_one(w):
    d = _get('https://data-api.polymarket.com/v2/user-stats?user=' + w) or {}
    s = d.get('data') or {}
    pnl = s.get('all_time_pnl') or {}
    return {
        'ts': int(time.time()),
        'markets': s.get('trades'),
        'tradeCount': pnl.get('trade_count'),
        'pnl': pnl.get('realized_pnl') if pnl.get('realized_pnl') is not None else pnl.get('realized_market_pnl'),
        'biggestWin': s.get('biggest_win'),
        'makerRebate': pnl.get('maker_rebate') or 0,
        'takerRebate': pnl.get('taker_rebate') or 0,
        'feesRefunded': pnl.get('fees_refunded') or 0,
        'volume': pnl.get('volume') or pnl.get('volume_usdc'),
    }

def ensure(wallets, force=False, ttl=STATS_TTL, workers=8):
    """Refresh cached user-stats for the given wallets. Returns the store."""
    store = load_stats()
    byw = store.setdefault('wallets', {})
    now = time.time()
    need = []
    for w in wallets:
        w = (w or '').lower()
        if not w:
            continue
        row = byw.get(w) or {}
        if force or not row or (now - (row.get('ts') or 0)) > ttl:
            need.append(w)
    if not need:
        return store
    ok = err = 0
    with ThreadPoolExecutor(max_workers=workers) as ex:
        futs = {ex.submit(_fetch_one, w): w for w in need}
        for f in as_completed(futs):
            w = futs[f]
            try:
                byw[w] = _fetch_one_result(f)
                ok += 1
            except Exception:
                err += 1
    save_stats(store)
    print(f"wallet_flags: refreshed {ok} user-stats, {err} failed, cache {len(byw)}", flush=True)
    return store

def _fetch_one_result(fut):
    return fut.result()

def mm_why(st, roi=None, hedged=None, loaded=None):
    """Return a short reason if this looks like a market maker or bot, else None."""
    if not st:
        return None
    fills = st.get('tradeCount') or 0
    mkts = st.get('markets') or 0
    maker = st.get('makerRebate') or 0
    refund = st.get('feesRefunded') or 0
    reasons = []
    if fills >= MM_TRADE_COUNT:
        reasons.append('%s trades' % _num(fills))
    if mkts >= MM_MARKETS:
        reasons.append('%s markets' % _num(mkts))
    vol = st.get('volume') or 0
    try:
        share = (float(maker) / float(vol)) if vol else None
    except (TypeError, ValueError):
        share = None
    if maker >= MM_MAKER_REBATE and (share is None or share >= MM_MAKER_REBATE_SHARE):
        reasons.append('$%s maker rebate' % _num(maker))
    if refund >= MM_FEE_REFUND:
        reasons.append('$%s fee refunds' % _num(refund))
    if hedged is not None:
        try:
            h = int(hedged)
        except (TypeError, ValueError):
            h = 0
        share = (h / loaded) if loaded else None
        if h >= MM_HEDGE_N or (h >= MM_HEDGE_MIN and share is not None and share >= MM_HEDGE_SHARE):
            reasons.append('%d hedged positions' % h)
    return '; '.join(reasons) if reasons else None

def oneoff_why(st):
    """Return a short reason if profit is concentrated in a few bets, else None."""
    if not st:
        return None
    pnl = st.get('pnl')
    big = st.get('biggestWin')
    mkts = st.get('markets')
    share = None
    try:
        if pnl and float(pnl) > 0 and big is not None:
            share = float(big) / float(pnl)
    except (TypeError, ValueError):
        share = None
    try:
        n = int(mkts) if mkts is not None else None
    except (TypeError, ValueError):
        n = None
    if share is not None and share > ONEOFF_BIGGEST:
        # Keep the 40% jackpot gate for thin books. A veteran sports book (dozens+
        # markets) can have one large win without being a one-off; still flag a
        # true jackpot (>=80% of lifetime profit) even on a deep book.
        thin = n is None or n <= max(ONEOFF_THIN_MARKETS, 40)
        if thin or share >= 0.80:
            return 'biggest win is %.0f%% of lifetime profit' % (share * 100)
    if n is not None and n <= ONEOFF_FEW_MARKETS:
        return 'only %d markets (profit is in a handful of bets)' % n
    return None

def _num(x):
    try:
        x = float(x)
    except (TypeError, ValueError):
        return str(x)
    if abs(x) >= 1000000:
        return '%.1fM' % (x / 1000000)
    if abs(x) >= 1000:
        return '%.0fk' % (x / 1000)
    return '%.0f' % x

def attach(cappers, traders=None, store=None):
    """Set mm / oneOff (and reasons) on each capper row. Fetches stats as needed."""
    wallets = [(c.get('wallet') or '').lower() for c in (cappers or []) if c.get('wallet')]
    store = store or ensure(wallets)
    byw = (store or {}).get('wallets') or {}
    tmap = {((t.get('wallet') or '').lower()): t for t in (traders or [])}
    n_mm = n_off = 0
    for c in cappers or []:
        w = (c.get('wallet') or '').lower()
        st = byw.get(w) or {}
        t = tmap.get(w) or {}
        roi = None
        try:
            roi = ((c.get('win') or {}).get('all') or {}).get('roi')
        except Exception:
            pass
        why_mm = mm_why(st, roi=roi, hedged=t.get('hedged'), loaded=t.get('loaded') or t.get('bets'))
        why_off = oneoff_why(st)
        c['mm'] = bool(why_mm)
        c['mmWhy'] = why_mm
        c['oneOff'] = bool(why_off)
        c['oneOffWhy'] = why_off
        if st:
            c['polyStats'] = {k: st.get(k) for k in ('markets', 'tradeCount', 'pnl', 'biggestWin', 'makerRebate', 'feesRefunded')}
        if why_mm:
            n_mm += 1
        if why_off:
            n_off += 1
    print(f"wallet_flags: {n_mm} market makers, {n_off} one-off among {len(cappers or [])} cappers", flush=True)
    return cappers
