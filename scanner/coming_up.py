#!/usr/bin/env python3
"""Coming Up tab: flat list of upcoming Kalshi picks from Hot and Elite cappers.

$100+ open positions, next 36 hours, games not started. Market makers / bots
and one-offs are excluded. Several cappers on the same pick collapse to one row
with backing vs against counts. Separate from All Picks ($500/$300) rules.
"""
import collections, re
import wallet_flags as wf

LEAN_MIN = 100
STALE_SECS = wf.STALE_SECS
SPORT_BAR_N = 10
SPORT_BAR_ROI = 20
SPORT_BAR_ROI_VOL = 10
SPORT_BAR_VOL_N = 100
SPORT_EX = {
    'NBA': 'NBA', 'WNBA': 'WNBA', 'CBB': 'NCAAB', 'CWBB': 'NCAAB', 'NFL': 'NFL', 'CFB': 'NCAAF',
    'NHL': 'NHL', 'MLB': 'MLB', 'ATP': 'Tennis', 'WTA': 'Tennis', 'ITF': 'Tennis', 'UFC': 'MMA',
    'CS2': 'Esports', 'DOTA2': 'Esports', 'LOL': 'Esports', 'VAL': 'Esports', 'OW': 'Esports',
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

def sport_of(lg, sport_map=None):
    L = (lg or '').upper()
    if isinstance(sport_map, dict) and L in sport_map:
        return sport_map[L]
    if L in SPORT_EX:
        return SPORT_EX[L]
    return 'Basketball (intl)' if L.startswith('BK') else ('Soccer' if L else 'Other')

def sport_bar_roi(c):
    return SPORT_BAR_ROI_VOL if (c.get('n') or 0) >= SPORT_BAR_VOL_N else SPORT_BAR_ROI

def best_sport(c):
    best = None
    bar = sport_bar_roi(c)
    for sport, sr in (c.get('sports') or {}).items():
        if not sr:
            continue
        if (sr.get('n') or 0) >= SPORT_BAR_N and sr.get('roi') is not None and sr['roi'] >= bar:
            if best is None or sr['roi'] > best[1]['roi'] or (sr['roi'] == best[1]['roi'] and (sr.get('n') or 0) > (best[1].get('n') or 0)):
                best = (sport, sr)
    return best

def is_hot_tab_capper(c):
    """Same rule as src/app.tsx isHotTabCapper."""
    f = (c or {}).get('f14') or {}
    if (f.get('n') or 0) < 10 or f.get('roi') is None or f['roi'] <= 0:
        return False
    if not best_sport(c):
        return False
    if (c.get('n') or 0) < 20:
        return False
    if c.get('wr') is None or c['wr'] < 55:
        return False
    if c.get('avgEntry') is None or c['avgEntry'] >= 0.90:
        return False
    return True

def elite_wallets(proven):
    out = set()
    for e in (proven or {}).get('elite') or []:
        w = (e.get('wallet') or '').lower()
        if w:
            out.add(w)
    return out

def is_hot_or_elite(c, elite):
    if not c or c.get('mm') or c.get('oneOff'):
        return False
    w = (c.get('wallet') or '').lower()
    if w in elite:
        return True
    return is_hot_tab_capper(c)

def hot_wallets(capper_history, proven):
    elite = elite_wallets(proven)
    blocked = set()
    out = {}
    for c in (capper_history or {}).get('cappers') or []:
        w = (c.get('wallet') or '').lower()
        if c.get('mm') or c.get('oneOff'):
            if w:
                blocked.add(w)
            continue
        if is_hot_or_elite(c, elite) and w:
            out[w] = c
    # Elites missing from capperHistory still count, unless already flagged mm/one-off.
    for w in elite:
        if w not in blocked:
            out.setdefault(w, {'wallet': w})
    return out

def _in_window(b, now, win_end):
    k = b.get('kalshi') or {}
    if k.get('status') != 'ok' or k.get('price') is None:
        return False
    if (b.get('cost') or 0) < LEAN_MIN:
        return False
    ts = b.get('startTs') or 0
    if not ts or ts <= now or ts > win_end:
        return False
    g = b.get('game') or {}
    if g.get('state') in ('in', 'post') or b.get('phase') == 'live':
        return False
    return True

def _uniq(rows):
    best = {}
    for b in rows:
        w = (b.get('wallet') or '').lower()
        if not w:
            continue
        if w not in best or (b.get('cost') or 0) > (best[w].get('cost') or 0):
            best[w] = b
    return list(best.values())

def _backer(b, rec, sport_map):
    sport = sport_of(b.get('league'), sport_map)
    sr = ((rec or {}).get('sports') or {}).get(sport) or {}
    return dict(
        wallet=b.get('wallet'),
        name=b.get('name') or (b.get('wallet') or '')[:10],
        cost=round(b.get('cost') or 0),
        avg=round(b['avg'], 3) if b.get('avg') is not None else None,
        lastTs=b.get('lastTs') or b.get('firstTs') or None,
        sport=sport,
        sw=sr.get('w') or 0,
        sl=sr.get('l') or 0,
        sn=sr.get('n') or 0,
        sroi=sr.get('roi'),
        elite=bool((rec or {}).get('proven')),
    )

def _side_blob(rows, hot, sport_map):
    uniq = _uniq(rows)
    usd = sum(b.get('cost') or 0 for b in uniq)
    inv = sum((b.get('cost') or 0) * (b.get('avg') or 0) for b in uniq if b.get('avg') is not None)
    avg = (inv / usd) if usd and inv else None
    uniq.sort(key=lambda x: -(x.get('cost') or 0))
    backers = [_backer(b, hot.get((b.get('wallet') or '').lower()), sport_map) for b in uniq]
    last_ts = max((b.get('lastTs') or b.get('firstTs') or 0) for b in uniq) if uniq else 0
    return dict(
        n=len(uniq),
        usd=round(usd),
        avg=round(avg, 3) if avg is not None else None,
        names=[x['name'] for x in backers],
        backers=backers,
        lastTs=last_ts or None,
    )

def capper_count(rows):
    seen = set()
    for r in rows or []:
        for b in r.get('backers') or []:
            w = (b.get('wallet') or '').lower()
            if w:
                seen.add(w)
        for name in r.get('oppNames') or []:
            pass
        for b in r.get('oppBackers') or []:
            w = (b.get('wallet') or '').lower()
            if w:
                seen.add(w)
    return len(seen)

def _pick_row(cid, side, rows, opp_rows, hot, sport_map):
    fav = _side_blob(rows, hot, sport_map)
    opp = _side_blob(opp_rows, hot, sport_map)
    src = rows[0]
    k = dict(src.get('kalshi') or {})
    kprice = k.get('price')
    slip = wf.slip_cents(kprice, fav.get('avg'))
    if slip is not None:
        slip = round(slip, 1)
    g = src.get('game') or {}
    title = game_title(src)
    ts = src.get('startTs') or 0
    return dict(
        id=str(cid) + ':' + side,
        gameId=game_key(src),
        game=title,
        league=(src.get('league') or '').upper(),
        startTs=int(ts or 0),
        start=g.get('start') or '',
        side=side,
        label=src.get('label') or src.get('outcome') or side.upper(),
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
        backers=fav['backers'],
        oppCappers=opp['n'],
        oppUsd=opp['usd'],
        oppNames=opp['names'],
        oppBackers=opp['backers'],
        lastTs=fav.get('lastTs'),
    )

def build(lean_bets, capper_history, now, win_end, proven=None):
    """Return a flat list of pick rows, soonest first."""
    hot = hot_wallets(capper_history, proven)
    sport_map = (capper_history or {}).get('sportMap')
    if not isinstance(sport_map, dict):
        sport_map = {}
    kept = []
    for b in lean_bets or []:
        w = (b.get('wallet') or '').lower()
        if w not in hot:
            continue
        if not _in_window(b, now, win_end):
            continue
        kept.append(b)
    by_cid_side = collections.defaultdict(list)
    for b in kept:
        cid = b.get('cid') or b.get('q') or game_key(b)
        side = b.get('side') or 'yes'
        by_cid_side[(cid, side)].append(b)
    rows = []
    for (cid, side), bs in by_cid_side.items():
        opp_side = 'no' if side == 'yes' else 'yes'
        opp = by_cid_side.get((cid, opp_side), [])
        rec = _pick_row(cid, side, bs, opp, hot, sport_map)
        if rec.get('kPrice') is None or rec.get('cappers', 0) < 1:
            continue
        rows.append(rec)
    rows.sort(key=lambda r: (r.get('startTs') or 10**12, -(r.get('cappers') or 0), -(r.get('usd') or 0)))
    return rows

def apply_price(row, kprice):
    if kprice is None:
        return row
    row = dict(row)
    row['kPrice'] = kprice
    slip = wf.slip_cents(kprice, row.get('avgEntry'))
    row['slip'] = round(slip, 1) if slip is not None else None
    return row

def refresh(rows, now, win_end, kalshi_now=None):
    """Drop started picks and refresh Kalshi prices. Works on the flat list (and ignores leftover game-grouped rows)."""
    out = []
    for r in rows or []:
        # Legacy game-grouped payload from the first Coming Up version: skip; a scan rebuilds the list.
        if r.get('favor') and not r.get('label') and not r.get('backers'):
            continue
        ts = r.get('startTs') or 0
        if not ts or ts <= now or ts > win_end:
            continue
        px = r.get('kPrice')
        tk = r.get('ticker')
        if kalshi_now and tk:
            try:
                kn = kalshi_now(tk)
            except Exception:
                kn = None
            if kn is not None:
                if isinstance(kn, dict):
                    act = (r.get('action') or '')
                    px = kn.get('no') if act.endswith('NO') else kn.get('yes', kn.get('price', kn.get('no')))
                else:
                    px = kn
        rec = apply_price(r, px)
        if rec.get('kPrice') is None:
            continue
        out.append(rec)
    out.sort(key=lambda r: (r.get('startTs') or 10**12, -(r.get('cappers') or 0), -(r.get('usd') or 0)))
    return out
