#!/usr/bin/env python3
"""Coming Up tab: upcoming Kalshi games where eligible pool cappers hold $100+ positions.

This is a lean view, separate from All Picks ($500/$300, GOOD/OK rules).
Market makers / bots stay out. Grouped by game, soonest first.
"""
import collections, re
import wallet_flags as wf

LEAN_MIN = 100
# "Clear lean": one side has more cappers and more $, at least 55% of the money,
# and Kalshi (plus taker fee) is under 2¢ worse than the average entry.
CLEAR_SHARE = 0.55
KIND_RANK = {
    'moneyline': 0, 'teamwin': 1, 'draw': 2, 'spread': 3, 'total': 4, 'other': 5, 'prop': 6,
}

def evkey(slug):
    m = re.match(r'(.+-20\d\d-\d\d-\d\d)', slug or '')
    return m.group(1) if m else (slug or '')

def _clean(s):
    return re.sub(r'\s+', ' ', (s or '').strip())

def game_title(b):
    g = b.get('game') or {}
    name = _clean(g.get('name') or '')
    if re.search(r'\s(?:vs\.?|@)\s', name, re.I):
        return re.sub(r'\s+@\s+', ' vs ', name, flags=re.I)
    teams = g.get('teams') or []
    if len(teams) >= 2:
        return _clean(teams[0]) + ' vs ' + _clean(teams[1])
    q = b.get('q') or ''
    s = re.sub(r'\s*\(BO\d\)', '', q)
    s = re.sub(r'^[A-Za-z0-9 .]+:\s+(?=.+\svs\.?\s)', '', s)
    m = re.search(r'(.+?)\s+vs\.?\s+(.+?)(?:\s+[-–:].*)?$', s, re.I)
    if m:
        left, right = _clean(m.group(1)), _clean(m.group(2))
        left = re.sub(r'^[A-Za-z0-9 .]+:\s+', '', left)
        return left + ' vs ' + re.sub(r'\s+[-–:].*$', '', right)
    m = re.match(r'Will (.+?) win\b', q, re.I)
    if m:
        return _clean(m.group(1))
    return _clean(q) or (b.get('label') or 'Game')

def game_key(b):
    ek = evkey(b.get('slug'))
    if ek and re.search(r'-20\d\d-\d\d-\d\d$', ek):
        return ek
    ts = int(b.get('startTs') or 0)
    title = re.sub(r'[^a-z0-9]+', '-', game_title(b).lower()).strip('-')
    return (b.get('league') or 'na').lower() + '|' + str(ts) + '|' + title

def verdict_of(n, usd, opp_n, opp_usd, slip):
    total = (usd or 0) + (opp_usd or 0)
    most_caps = (n or 0) > (opp_n or 0)
    most_usd = (usd or 0) > (opp_usd or 0)
    share = ((usd or 0) / total) if total else 1.0
    pricey = slip is not None and slip >= wf.SLIP_CAP_CENTS
    if pricey:
        return 'Pricey' if most_usd or most_caps else 'Split'
    if (n or 0) >= 2 and most_caps and most_usd and share >= CLEAR_SHARE and slip is not None and slip < wf.SLIP_CAP_CENTS:
        return 'Clear lean'
    if (usd or 0) < (opp_usd or 0) or (total and share < 0.5):
        return 'Split'
    return 'Lean'

def _uniq_wallets(rows):
    best = {}
    for b in rows:
        w = (b.get('wallet') or '').lower()
        if not w:
            continue
        if w not in best or (b.get('cost') or 0) > (best[w].get('cost') or 0):
            best[w] = b
    return list(best.values())

def _side_stats(rows):
    uniq = _uniq_wallets(rows)
    usd = sum(b.get('cost') or 0 for b in uniq)
    inv = sum((b.get('cost') or 0) * (b.get('avg') or 0) for b in uniq if b.get('avg') is not None)
    avg = (inv / usd) if usd and inv else None
    names = [b.get('name') or (b.get('wallet') or '')[:10] for b in sorted(uniq, key=lambda x: -(x.get('cost') or 0))]
    last_ts = max((b.get('lastTs') or b.get('firstTs') or 0) for b in uniq) if uniq else 0
    return dict(n=len(uniq), usd=round(usd), avg=round(avg, 3) if avg is not None else None,
                names=names[:6], lastTs=last_ts or None)

def _market_row(cid, rows):
    b0 = rows[0]
    by_side = collections.defaultdict(list)
    for b in rows:
        by_side[b.get('side') or 'yes'].append(b)
    sides = {side: _side_stats(sbs) for side, sbs in by_side.items()}
    # Favored side: more $, then more cappers.
    fav_side = max(sides.keys(), key=lambda s: (sides[s]['usd'], sides[s]['n']))
    fav = sides[fav_side]
    opp_side = 'no' if fav_side == 'yes' else 'yes'
    opp = sides.get(opp_side) or dict(n=0, usd=0, avg=None, names=[], lastTs=None)
    # Prefer a row on the favored side for Kalshi/label (same market).
    src = next((b for b in rows if b.get('side') == fav_side), b0)
    k = dict(src.get('kalshi') or {})
    kprice = k.get('price')
    slip = wf.slip_cents(kprice, fav.get('avg'))
    if slip is not None:
        slip = round(slip, 1)
    label = src.get('label') or src.get('outcome') or fav_side.upper()
    return dict(
        id=str(cid) + ':' + fav_side,
        cid=cid,
        side=fav_side,
        label=label,
        kind=src.get('kind') or 'other',
        q=src.get('q') or '',
        kPrice=kprice,
        avgEntry=fav.get('avg'),
        slip=slip,
        action=k.get('action'),
        contract=k.get('contract'),
        ticker=k.get('ticker'),
        cappers=fav['n'],
        usd=fav['usd'],
        names=fav['names'],
        oppCappers=opp['n'],
        oppUsd=opp['usd'],
        oppNames=opp['names'],
        verdict=verdict_of(fav['n'], fav['usd'], opp['n'], opp['usd'], slip),
        lastTs=fav.get('lastTs'),
    )

def _favor_market(markets):
    if not markets:
        return None
    best_usd = max(m['usd'] for m in markets) or 1
    def key(m):
        clear = 0 if m.get('verdict') == 'Clear lean' else 1
        kind = KIND_RANK.get(m.get('kind') or 'other', 5)
        # Prefer moneyline when it has a decent share of the biggest market's money.
        ml_ok = 0 if kind <= 1 and (m['usd'] >= 0.4 * best_usd) else 1
        return (ml_ok, clear, kind, -m['usd'], -m['cappers'])
    return min(markets, key=key)

def _eligible_wallets(capper_history):
    import capper_history as ch
    out = set()
    for c in (capper_history or {}).get('cappers') or []:
        if ch.eligibility(c):
            continue
        w = (c.get('wallet') or '').lower()
        if w:
            out.add(w)
    return out

def slim_game(g, ts, league, title, favor, markets):
    start = (g or {}).get('start') or ''
    return dict(
        id=None,  # filled by caller
        game=title,
        league=(league or '').upper(),
        startTs=int(ts or 0),
        start=start,
        favor=favor,
        markets=markets,
    )

def build(lean_bets, capper_history, now, win_end):
    """Return a list of game dicts, soonest first."""
    elig = _eligible_wallets(capper_history)
    rows = []
    for b in lean_bets or []:
        w = (b.get('wallet') or '').lower()
        if w not in elig:
            continue
        if (b.get('cost') or 0) < LEAN_MIN:
            continue
        k = b.get('kalshi') or {}
        if k.get('status') != 'ok' or k.get('price') is None:
            continue
        ts = b.get('startTs') or 0
        if not ts or ts <= now or ts > win_end:
            continue
        g = b.get('game') or {}
        if g.get('state') in ('in', 'post') or b.get('phase') == 'live':
            continue
        rows.append(b)
    groups = collections.OrderedDict()
    for b in rows:
        groups.setdefault(game_key(b), []).append(b)
    games = []
    for gk, bs in groups.items():
        by_cid = collections.defaultdict(list)
        for b in bs:
            by_cid[b.get('cid') or b.get('q') or game_key(b)].append(b)
        markets = [_market_row(cid, mbs) for cid, mbs in by_cid.items()]
        markets = [m for m in markets if m.get('kPrice') is not None]
        if not markets:
            continue
        markets.sort(key=lambda m: (0 if m.get('verdict') == 'Clear lean' else 1, -m['usd'], -m['cappers']))
        favor = _favor_market(markets)
        if not favor:
            continue
        b0 = bs[0]
        title = game_title(b0)
        ts = min((b.get('startTs') or 0) for b in bs if b.get('startTs')) or (b0.get('startTs') or 0)
        # Prefer a named ESPN/Kalshi game blob.
        g = b0.get('game') or {}
        for b in bs:
            gb = b.get('game') or {}
            if gb.get('name') and (not g.get('name') or ' vs ' not in str(g.get('name'))):
                g = gb
        rec = slim_game(g, ts, b0.get('league'), title, favor, markets)
        rec['id'] = gk
        games.append(rec)
    games.sort(key=lambda x: (x.get('startTs') or 10**12, 0 if (x.get('favor') or {}).get('verdict') == 'Clear lean' else 1, -((x.get('favor') or {}).get('usd') or 0)))
    return games

def apply_price(market, kprice):
    """Update a market/favor row after a Kalshi refresh and recompute slip + verdict."""
    if kprice is None:
        return market
    market = dict(market)
    market['kPrice'] = kprice
    slip = wf.slip_cents(kprice, market.get('avgEntry'))
    market['slip'] = round(slip, 1) if slip is not None else None
    market['verdict'] = verdict_of(market.get('cappers') or 0, market.get('usd') or 0,
                                   market.get('oppCappers') or 0, market.get('oppUsd') or 0,
                                   market['slip'])
    return market

def refresh(games, now, win_end, kalshi_now=None):
    """Drop started games and refresh Kalshi prices in place. kalshi_now(ticker) -> {yes,no} or price."""
    out = []
    for g in games or []:
        ts = g.get('startTs') or 0
        if not ts or ts <= now or ts > win_end:
            continue
        markets = []
        for m in g.get('markets') or []:
            px = m.get('kPrice')
            tk = m.get('ticker')
            if kalshi_now and tk:
                try:
                    kn = kalshi_now(tk)
                except Exception:
                    kn = None
                if kn is not None:
                    if isinstance(kn, dict):
                        act = (m.get('action') or '')
                        px = kn.get('no') if act.endswith('NO') else kn.get('yes', kn.get('price', kn.get('no')))
                    else:
                        px = kn
            markets.append(apply_price(m, px))
        markets = [m for m in markets if m.get('kPrice') is not None]
        if not markets:
            continue
        favor_id = (g.get('favor') or {}).get('id')
        favor = next((m for m in markets if m.get('id') == favor_id), None) or _favor_market(markets)
        rec = dict(g, markets=markets, favor=favor)
        out.append(rec)
    out.sort(key=lambda x: (x.get('startTs') or 10**12, 0 if (x.get('favor') or {}).get('verdict') == 'Clear lean' else 1, -((x.get('favor') or {}).get('usd') or 0)))
    return out
