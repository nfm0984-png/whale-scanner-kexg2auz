#!/usr/bin/env python3
"""Coming Up tab: one card per upcoming game, both sides, Hot and Elite cappers only.

$100+ open positions, live games (started within ~3.5 hours, not final) plus
the next 36 hours. Market makers / bots and one-offs are excluded. Cards are
ranked by hot-capper count, then capper ROI (not dollars). Separate from All
Picks ($500/$300) pick rules.
"""
import collections, json, re, urllib.request
import wallet_flags as wf
import capper_history as ch

LEAN_MIN = 100
LIVE_SECS = int(3.5 * 3600)
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
    if ch.eligibility(c):
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

def _espn_final(b):
    raw = b.get('game')
    g = raw if isinstance(raw, dict) else {}
    r = b.get('refresh') or {}
    if g.get('state') == 'post' or b.get('state') == 'post' or r.get('state') == 'post' or r.get('ended') or r.get('final'):
        return True
    return False

def _is_live(b, now):
    if _espn_final(b):
        return False
    g = b.get('game') or {}
    r = b.get('refresh') or {}
    if g.get('state') == 'in' or r.get('state') == 'in' or b.get('phase') == 'live':
        return True
    ts = b.get('startTs') or 0
    return bool(ts and ts <= now and (now - ts) <= LIVE_SECS)

def _in_window(b, now, win_end):
    k = b.get('kalshi') or {}
    if k.get('status') != 'ok' or k.get('price') is None:
        return False
    if (b.get('cost') or 0) < LEAN_MIN:
        return False
    ts = b.get('startTs') or 0
    if not ts or ts > win_end:
        return False
    if ts > now:
        return True
    return _is_live(b, now)

def _uniq(rows):
    best = {}
    for b in rows:
        w = (b.get('wallet') or '').lower()
        if not w:
            continue
        if w not in best or (b.get('cost') or 0) > (best[w].get('cost') or 0):
            best[w] = b
    return list(best.values())

def _capper_roi(rec):
    if not rec:
        return None
    b = rec.get('big') or {}
    if b.get('roi') is not None:
        return b['roi']
    f = rec.get('f14') or {}
    if f.get('roi') is not None:
        return f['roi']
    return rec.get('roi')

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
        roi=_capper_roi(rec),
        wr=(rec or {}).get('wr'),
        elite=bool((rec or {}).get('proven')),
    )

def _uniq(rows):
    best = {}
    for b in rows:
        w = (b.get('wallet') or '').lower()
        if not w:
            continue
        if w not in best or (b.get('cost') or 0) > (best[w].get('cost') or 0):
            best[w] = b
    return list(best.values())

def _side_blob(rows, hot, sport_map, label, side, src, kalshi=None, cid=None):
    uniq = _uniq(rows)
    usd = sum(b.get('cost') or 0 for b in uniq)
    inv = sum((b.get('cost') or 0) * (b.get('avg') or 0) for b in uniq if b.get('avg') is not None)
    avg = (inv / usd) if usd and inv else None
    # List by capper ROI first (then $ only as a weak tiebreak, never for card rank).
    def bkey(b):
        rec = hot.get((b.get('wallet') or '').lower()) or {}
        return (-(_capper_roi(rec) if _capper_roi(rec) is not None else -999), -(b.get('cost') or 0))
    uniq.sort(key=bkey)
    backers = [_backer(b, hot.get((b.get('wallet') or '').lower()), sport_map) for b in uniq]
    last_ts = max((b.get('lastTs') or b.get('firstTs') or 0) for b in uniq) if uniq else 0
    k = dict(kalshi or (src.get('kalshi') if src else {}) or {})
    kprice = k.get('price') if src else None
    slip = wf.slip_cents(kprice, avg) if kprice is not None else None
    if slip is not None:
        slip = round(slip, 1)
    cid = cid or (src or {}).get('cid') or ''
    return dict(
        id=str(cid) + ':' + side,
        side=side,
        label=label,
        kPrice=kprice,
        avgEntry=round(avg, 3) if avg is not None else None,
        slip=slip,
        action=k.get('action') if src else None,
        contract=k.get('contract') if src else None,
        ticker=k.get('ticker') if src else None,
        cappers=len(uniq),
        usd=round(usd),
        names=[x['name'] for x in backers],
        backers=backers,
        lastTs=last_ts or None,
    )

def _other_side(side):
    return 'no' if side == 'yes' else 'yes'

def _title_teams(title):
    if not title:
        return []
    s = re.sub(r'^[A-Za-z0-9 .]+:\s+(?=.+\svs)', '', title)
    s = re.sub(r'\s*\(BO\d\).*$', '', s, flags=re.I)
    parts = [p.strip() for p in re.split(r'\s+vs\.?\s+', s, flags=re.I) if p.strip()]
    return parts[:2] if len(parts) >= 2 else parts

def _name_hit(name, team):
    if not name or not team:
        return False
    a, b = name.lower(), team.lower()
    return a == b or a in b or b in a

def _other_team_label(known, teams, nick=False):
    if not known or len(teams) < 2:
        return None
    hit = next((t for t in teams if _name_hit(known, t)), None)
    rest = [t for t in teams if t is not hit]
    if not rest:
        return None
    other = rest[0]
    if nick and hit:
        hp, op = hit.split(), other.split()
        known_last = (known.split() or [''])[-1]
        if len(hp) >= 2 and len(op) >= 2 and hp[-1].lower() == known_last.lower():
            return op[-1]
    return other

def _will_team(q, contract, lab):
    m = re.match(r'Will (.+?) win\b', q or '', re.I)
    if m:
        return _clean(m.group(1))
    m = re.search(r'^(.+?)\s+(?:NOT TO WIN|to win|not to win|WIN)\s*$', lab or '', re.I)
    if m:
        return _clean(m.group(1))
    if contract and not re.search(r'^(tie|draw)$|over|under|wins? by over', contract, re.I):
        return _clean(contract)
    return None

def _ctx_contract(ctx, *rowsets):
    for src in [ctx] + [r for rows in rowsets for r in (rows or [])]:
        if not src:
            continue
        c = src.get('contract') or ((src.get('kalshi') or {}).get('contract'))
        if c:
            return c
    return ''

def _row_label(rows):
    for b in rows or []:
        if b.get('label'):
            return b['label']
        if b.get('outcome'):
            return b['outcome']
    return None

def market_labels(ctx, yes_lab=None, no_lab=None, title=None):
    """YES/NO labels from the Kalshi/Polymarket market itself, never a vs-title guess."""
    ctx = ctx or {}
    q = ctx.get('q') or ''
    kind = ctx.get('kind') or ''
    contract = _ctx_contract(ctx)
    info = ctx.get('_info') or {}
    title = title or game_title(ctx)
    yes_lab = yes_lab or info.get('yes')
    no_lab = no_lab or info.get('no')
    teams = _title_teams(title) or _title_teams(q)

    if kind == 'draw' or re.search(r'\bend in a (?:tie|draw)\b', q, re.I) or re.search(r'^(tie|draw)$', contract, re.I) \
            or (yes_lab and re.search(r'^draw$', yes_lab, re.I)) or (no_lab and re.search(r'no\s*draw', no_lab, re.I)):
        return 'DRAW', 'NO DRAW'

    team = _will_team(q, contract, yes_lab or no_lab or '')
    if kind == 'teamwin' or re.match(r'Will .+ win\b', q, re.I) or re.search(r'(?:NOT TO WIN|not to win|\bWIN|\bto win)\s*$', (yes_lab or no_lab or ''), re.I):
        if team and (kind == 'teamwin' or re.match(r'Will .+ win\b', q, re.I) or re.search(r'NOT TO WIN|not to win', (yes_lab or no_lab or ''), re.I)):
            return team + ' to win', team + ' not to win'

    is_spread = kind == 'spread' or re.match(r'Spread:', q, re.I) or re.search(r'wins? by over', contract, re.I) \
        or bool(re.search(r'[+-][\d.]+', (yes_lab or '') + ' ' + (no_lab or ''))) and not re.search(r'\bO/?U\s+', q, re.I)
    if is_spread:
        yes = contract.strip() if re.search(r'wins? by over', contract, re.I) else None
        sm = re.match(r'Spread:\s*(.+?)\s*\((-?[\d.]+)\)', q)
        fav = _clean(sm.group(1)) if sm else None
        line = abs(float(sm.group(2))) if sm else None
        if line is None:
            m = re.search(r'wins? by over\s+([\d.]+)', contract, re.I) or re.search(r'([+-])([\d.]+)', (no_lab or yes_lab or ''))
            if m:
                line = abs(float(m.group(2) if m.lastindex >= 2 else m.group(1)))
        if not fav:
            m = re.search(r'^(.+?)\s+[+-][\d.]+', no_lab or yes_lab or '')
            fav = _clean(m.group(1)) if m else None
        dog = _other_team_label(fav or '', teams, nick=True) if fav else None
        if not yes and fav and line is not None:
            fav_full = next((t for t in teams if _name_hit(fav, t)), fav)
            yes = fav_full + ' wins by over ' + ('%g' % line)
        no = (dog + ' +' + ('%g' % line)) if dog and line is not None else None
        if yes and no:
            return yes, no
        if yes:
            return yes, no or (fav + ' +' + ('%g' % line) if fav and line is not None else 'Under the spread')
        if no and fav and line is not None:
            return fav + ' -' + ('%g' % line), no

    if kind == 'total' or re.search(r'\bO/?U\s+[\d.]+', q, re.I) or re.search(r'^(?:Over|Under)\s+[\d.]+', contract, re.I) \
            or (yes_lab and re.search(r'^over$', yes_lab, re.I)) or (no_lab and re.search(r'^under$', no_lab, re.I)):
        lm = re.search(r'O/?U\s+([\d.]+)', q, re.I) or re.search(r'^(?:Over|Under)\s+([\d.]+)', contract or '', re.I)
        if lm:
            line = lm.group(1)
            return 'Over ' + line, 'Under ' + line
        return 'Over', 'Under'

    if yes_lab and no_lab and not re.search(r'or better for the other side|^Other side$', (yes_lab or '') + ' ' + (no_lab or ''), re.I):
        return yes_lab, no_lab
    known = yes_lab or no_lab
    if known and teams and len(teams) >= 2 and kind in ('moneyline', 'teamwin', 'other', '') \
            and not re.search(r'draw|over|under|not to win|[+-][\d.]+', known, re.I):
        other = _other_team_label(known, teams)
        if other:
            return (yes_lab or (known if not no_lab else other), no_lab or (other if yes_lab else known))
    if info.get('yes') or info.get('no'):
        return info.get('yes') or yes_lab or 'Yes', info.get('no') or no_lab or 'No'
    if known:
        flipped = None
        if re.search(r'\bover\b', known, re.I):
            flipped = re.sub(r'\bover\b', 'Under', known, flags=re.I)
        elif re.search(r'\bunder\b', known, re.I):
            flipped = re.sub(r'\bunder\b', 'Over', known, flags=re.I)
        elif re.search(r'no\s*draw', known, re.I):
            flipped = 'DRAW'
        elif re.search(r'^draw$', known, re.I):
            flipped = 'NO DRAW'
        else:
            flipped = 'Not ' + known
        if yes_lab:
            return yes_lab, no_lab or flipped
        return yes_lab or flipped, no_lab
    return yes_lab or 'Yes', no_lab or 'No'

def _side_label(side, rows, other_rows, sample):
    yes_rows = rows if side == 'yes' else other_rows
    no_rows = rows if side == 'no' else other_rows
    y, n = market_labels(sample, _row_label(yes_rows), _row_label(no_rows))
    return y if side == 'yes' else n

def capper_count(games):
    seen = set()
    for g in games or []:
        for m in g.get('markets') or []:
            for side in m.get('sides') or []:
                for b in side.get('backers') or []:
                    w = (b.get('wallet') or '').lower()
                    if w:
                        seen.add(w)
        # flat-list leftover
        for b in g.get('backers') or []:
            w = (b.get('wallet') or '').lower()
            if w:
                seen.add(w)
        for b in g.get('oppBackers') or []:
            w = (b.get('wallet') or '').lower()
            if w:
                seen.add(w)
    return len(seen)

def _avg_roi(backers):
    vals = [b.get('roi') for b in backers if b.get('roi') is not None]
    # Prefer sport ROI when the capper has a real sample in this sport.
    sport = [b.get('sroi') for b in backers if b.get('sroi') is not None and (b.get('sn') or 0) >= 5]
    use = sport if sport else vals
    if not use:
        return None
    return round(sum(use) / len(use), 1)

KIND_RANK = {
    'moneyline': 0, 'teamwin': 1, 'draw': 2, 'spread': 3, 'total': 4, 'other': 5, 'prop': 6,
}

def _market_rank(m):
    sides = m.get('sides') or []
    n = sum(s.get('cappers') or 0 for s in sides)
    kind = KIND_RANK.get(m.get('kind') or 'other', 5)
    return (kind if n else 9, -n)

def _sort_key(g):
    n = g.get('capperCount') or 0
    roi = g.get('capperRoi')
    return (-n, -(roi if roi is not None else -999), g.get('startTs') or 10**12)

def build(lean_bets, capper_history, now, win_end, proven=None):
    """Return one card per upcoming game, both sides, ranked by capper count then ROI."""
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
    by_game = collections.OrderedDict()
    for b in kept:
        by_game.setdefault(game_key(b), []).append(b)
    games = []
    for gk, bs in by_game.items():
        by_cid = collections.defaultdict(list)
        for b in bs:
            by_cid[b.get('cid') or b.get('q') or gk].append(b)
        markets = []
        for cid, mbs in by_cid.items():
            by_side = collections.defaultdict(list)
            for b in mbs:
                by_side[b.get('side') or 'yes'].append(b)
            sample = mbs[0]
            yes_rows, no_rows = by_side.get('yes') or [], by_side.get('no') or []
            ctx = dict(sample)
            ctx['contract'] = _ctx_contract(sample, mbs)
            yes_lab, no_lab = market_labels(ctx, _row_label(yes_rows), _row_label(no_rows), title=game_title(sample))
            sides = []
            for side, rows, label in (('yes', yes_rows, yes_lab), ('no', no_rows, no_lab)):
                src = rows[0] if rows else None
                sides.append(_side_blob(rows, hot, sport_map, label, side, src, cid=cid))
            sides = complete_sides(sides, kind=sample.get('kind') or 'other', game_title=game_title(sample), q=sample.get('q') or '')
            if not any(s.get('cappers') for s in sides):
                continue
            # Leading side first (count, then ROI) so the lean is on the left.
            sides.sort(key=lambda s: (-(s.get('cappers') or 0), -(_avg_roi(s.get('backers') or []) or -999)))
            markets.append(dict(
                id=str(cid),
                kind=sample.get('kind') or 'other',
                q=sample.get('q') or '',
                sides=sides,
            ))
        if not markets:
            continue
        markets.sort(key=_market_rank)
        wallets = {}
        rois = []
        for m in markets:
            for s in m.get('sides') or []:
                for b in s.get('backers') or []:
                    w = (b.get('wallet') or '').lower()
                    if w:
                        wallets[w] = b
                    if b.get('sroi') is not None and (b.get('sn') or 0) >= 5:
                        rois.append(b['sroi'])
                    elif b.get('roi') is not None:
                        rois.append(b['roi'])
        sample = bs[0]
        gblob = sample.get('game') or {}
        for b in bs:
            gb = b.get('game') or {}
            if gb.get('name') and (not gblob.get('name') or ' vs ' not in str(gblob.get('name'))):
                gblob = gb
        ts = min((b.get('startTs') or 0) for b in bs if b.get('startTs')) or (sample.get('startTs') or 0)
        games.append(dict(
            id=gk,
            game=game_title(dict(sample, game=gblob)),
            league=(sample.get('league') or '').upper(),
            startTs=int(ts or 0),
            start=gblob.get('start') or '',
            capperCount=len(wallets),
            capperRoi=round(sum(rois) / len(rois), 1) if rois else None,
            markets=markets,
        ))
    games.sort(key=_sort_key)
    return games


# ---------- Kalshi how-to on both sides of a card ----------
_KMARKET = {}
_KEVENT = {}
_KEV_MARKETS = {}
_KURL = 'https://api.elections.kalshi.com/trade-api/v2/'

def _kjson(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.load(r)
    except Exception:
        return None

def _kfp(x):
    try:
        return float(x)
    except Exception:
        return None

def fetch_market(ticker):
    if not ticker:
        return None
    if ticker in _KMARKET:
        return _KMARKET[ticker]
    d = _kjson(_KURL + 'markets/' + ticker)
    m = (d or {}).get('market') if isinstance(d, dict) else None
    _KMARKET[ticker] = m
    return m

def fetch_event(event_ticker):
    if not event_ticker:
        return None
    if event_ticker in _KEVENT:
        return _KEVENT[event_ticker]
    d = _kjson(_KURL + 'events/' + event_ticker)
    e = (d or {}).get('event') if isinstance(d, dict) else None
    _KEVENT[event_ticker] = e
    return e

def fetch_event_markets(event_ticker):
    if not event_ticker:
        return []
    if event_ticker in _KEV_MARKETS:
        return _KEV_MARKETS[event_ticker]
    d = _kjson(_KURL + 'markets?event_ticker=' + event_ticker + '&limit=200')
    ms = (d or {}).get('markets') if isinstance(d, dict) else None
    ms = ms or []
    _KEV_MARKETS[event_ticker] = ms
    for m in ms:
        tk = m.get('ticker')
        if tk and tk not in _KMARKET:
            _KMARKET[tk] = m
    return ms

def event_ticker_of(ticker, market=None):
    if market and market.get('event_ticker'):
        return market.get('event_ticker')
    if not ticker or ticker.count('-') < 2:
        return None
    return ticker.rsplit('-', 1)[0]

def flip_action(act):
    a = (act or '').upper().strip()
    if a.endswith('NO'):
        return 'BUY YES'
    if a.endswith('YES'):
        return 'BUY NO'
    return None

def _asks(m):
    if not m:
        return None, None
    yes = _kfp(m.get('yes_ask_dollars'))
    no = _kfp(m.get('no_ask_dollars'))
    yes_bid = _kfp(m.get('yes_bid_dollars'))
    no_bid = _kfp(m.get('no_bid_dollars'))
    if no is None and yes_bid is not None:
        no = round(1 - yes_bid, 4)
    if yes is None and no_bid is not None:
        yes = round(1 - no_bid, 4)
    if yes is not None and yes <= 0:
        yes = None
    if no is not None and no <= 0:
        no = None
    return yes, no

def _px_for_action(yes, no, action):
    a = (action or '').upper()
    if a.endswith('NO'):
        return no
    if a.endswith('YES'):
        return yes
    return None

def _binary_market(kind, contract=None, q=None):
    kind = (kind or '').lower()
    if kind in ('spread', 'total', 'draw', 'teamwin', 'prop'):
        return True
    t = ((contract or '') + ' ' + (q or '')).lower()
    if re.search(r'wins?\s+by\s+over|\bo/?u\s+|end in a (?:tie|draw)|^(?:over|under)\s+', t) or re.search(r'\b(?:over|under)\s+[\d.]+', t):
        return True
    if re.search(r'^(?:tie|draw)$', (contract or '').strip(), re.I):
        return True
    return False

def _match_team_market(markets, label, exclude_ticker=None):
    if not markets or not label:
        return None
    cands = [m for m in markets if m and m.get('ticker') != exclude_ticker and (m.get('ticker') or '').rsplit('-', 1)[-1] != 'TIE']
    def title_of(m):
        return m.get('yes_sub_title') or m.get('title') or ''
    exact = [m for m in cands if _name_hit(label, title_of(m)) or _name_hit(title_of(m), label)]
    if len(exact) == 1:
        return exact[0]
    if exact:
        return exact[0]
    if len(cands) == 1:
        return cands[0]
    return None

def _moneyline_title(src_market, event, game_title, src, peer=None):
    if event and event.get('title'):
        return _clean(event.get('title'))
    a = (src_market or {}).get('yes_sub_title') or (src or {}).get('contract') or ''
    b = (peer or {}).get('yes_sub_title') or ''
    if a and b and not _name_hit(a, b):
        return _clean(a) + ' vs ' + _clean(b) + ' winner'
    if game_title and re.search(r'\svs\.?\s', game_title, re.I):
        return _clean(game_title) + ' winner'
    return None

def complete_sides(sides, kind='other', game_title='', q=''):
    """Copy the matched Kalshi market onto the empty side and attach the real complementary ask."""
    sides = [dict(s or {}) for s in (sides or [])]
    if len(sides) < 2:
        return sides
    src = next((s for s in sides if s.get('ticker') and s.get('action')), None)
    if not src:
        src = next((s for s in sides if s.get('ticker') or s.get('contract') or s.get('action')), None)
    if not src:
        return sides
    ticker = src.get('ticker')
    market = fetch_market(ticker) if ticker else None
    ev_tk = event_ticker_of(ticker, market)
    ev = fetch_event(ev_tk) if ev_tk else None
    ev_ms = fetch_event_markets(ev_tk) if ev_tk else []
    yes, no = _asks(market)
    two_contract = (kind or '').lower() == 'moneyline' and not _binary_market(kind, src.get('contract'), q)
    team_for = {}
    if two_contract and ev_ms:
        for s in sides:
            team_for[id(s)] = _match_team_market(ev_ms, s.get('label') or '')
    # Title from the event, not from a single team's contract.
    other_team = next((team_for.get(id(s)) for s in sides if s is not src and team_for.get(id(s))), None)
    market_title = src.get('marketTitle')
    if two_contract:
        market_title = market_title or _moneyline_title(market, ev, game_title, src, other_team)
    if not market_title:
        market_title = (market or {}).get('title') or src.get('contract') or (ev or {}).get('title')
    src_id = src.get('id') or ''
    src_cid = src_id.rsplit(':', 1)[0] if ':' in src_id else src_id

    for i, s in enumerate(sides):
        if (s.get('id') or '').startswith(':'):
            s['id'] = (src_cid or '') + ':' + (s.get('side') or s['id'][1:])
        is_src = s is src or s.get('id') == src.get('id')
        has_own = bool(s.get('cappers') and s.get('ticker') and s.get('action'))
        if is_src or has_own:
            if market_title and not s.get('marketTitle'):
                s['marketTitle'] = market_title
            # Prefer Yes on this side's own team contract when Kalshi has per-team markets.
            own_m = team_for.get(id(s)) if two_contract else None
            if two_contract and own_m:
                p_yes, p_no = _asks(own_m if own_m.get('yes_ask_dollars') or own_m.get('no_ask_dollars') else fetch_market(own_m.get('ticker')))
                s['ticker'] = own_m.get('ticker')
                s['contract'] = own_m.get('yes_sub_title') or own_m.get('title') or s.get('label')
                s['action'] = 'BUY YES'
                s['yesSubTitle'] = own_m.get('yes_sub_title')
                s['noSubTitle'] = own_m.get('no_sub_title')
                if ev and ev.get('title'):
                    s['marketTitle'] = _clean(ev.get('title'))
                if p_yes is not None:
                    s['yesAsk'] = p_yes
                if p_no is not None:
                    s['noAsk'] = p_no
                s = apply_price(s, p_yes)
            else:
                own = fetch_market(s.get('ticker')) if s.get('ticker') else market
                oy, on = _asks(own) if own is not None else (yes, no)
                if oy is not None:
                    s['yesAsk'] = oy
                if on is not None:
                    s['noAsk'] = on
                if own:
                    s['yesSubTitle'] = own.get('yes_sub_title') or s.get('yesSubTitle')
                    s['noSubTitle'] = own.get('no_sub_title') or s.get('noSubTitle')
                live = _px_for_action(oy, on, s.get('action'))
                if live is not None:
                    s = apply_price(s, live)
            # Opp = the other side's team contract, matched by that side's label.
            empty = next((x for x in sides if x is not s and x.get('id') != s.get('id')), None)
            opp_m = team_for.get(id(empty)) if empty is not None else None
            if two_contract and opp_m:
                s['oppTicker'] = opp_m.get('ticker')
                s['oppContract'] = opp_m.get('yes_sub_title') or opp_m.get('title')
                s['oppAction'] = 'BUY YES'
                py, _pn = _asks(opp_m if opp_m.get('yes_ask_dollars') or opp_m.get('no_ask_dollars') else fetch_market(opp_m.get('ticker')))
                if py is not None:
                    s['oppPrice'] = py
            sides[i] = s
            continue
        # Empty / opposite side: Buy YES on this side's own team contract when we can.
        own_m = team_for.get(id(s)) if two_contract else None
        if two_contract and own_m:
            p_yes, p_no = _asks(own_m if own_m.get('yes_ask_dollars') or own_m.get('no_ask_dollars') else fetch_market(own_m.get('ticker')))
            s['ticker'] = own_m.get('ticker')
            s['contract'] = own_m.get('yes_sub_title') or own_m.get('title') or s.get('label')
            s['action'] = 'BUY YES'
            s['marketTitle'] = market_title
            if p_yes is not None:
                s['yesAsk'] = p_yes
            if p_no is not None:
                s['noAsk'] = p_no
            s = apply_price(s, p_yes)
        else:
            act = flip_action(src.get('action')) or ('BUY NO' if (s.get('side') == 'no') else 'BUY YES')
            s['ticker'] = s.get('ticker') or ticker
            s['contract'] = s.get('contract') or src.get('contract') or (market or {}).get('title')
            s['action'] = s.get('action') or act
            s['marketTitle'] = market_title or s.get('contract')
            if yes is not None:
                s['yesAsk'] = yes
            if no is not None:
                s['noAsk'] = no
            s = apply_price(s, _px_for_action(yes, no, s.get('action')))
        sides[i] = s
    return sides


def complete_games(games):
    """Fill Kalshi how-to + complementary prices on every side of existing cards (no rescan)."""
    out = []
    for g in games or []:
        markets = []
        for m in g.get('markets') or []:
            if not m.get('sides'):
                markets.append(m)
                continue
            sides = complete_sides(list(m['sides']), kind=m.get('kind') or 'other', game_title=g.get('game') or '', q=m.get('q') or '')
            markets.append(dict(m, sides=sides))
        out.append(dict(g, markets=markets))
    return out


def apply_price(side, kprice):
    if kprice is None:
        return side
    side = dict(side)
    side['kPrice'] = kprice
    slip = wf.slip_cents(kprice, side.get('avgEntry'))
    side['slip'] = round(slip, 1) if slip is not None else None
    return side

def _refresh_side(side, kalshi_now):
    px = side.get('kPrice')
    tk = side.get('ticker')
    if kalshi_now and tk:
        try:
            kn = kalshi_now(tk)
        except Exception:
            kn = None
        if kn is not None:
            if isinstance(kn, dict):
                act = (side.get('action') or '')
                px = kn.get('no') if act.endswith('NO') else kn.get('yes', kn.get('price', kn.get('no')))
            else:
                px = kn
    return apply_price(side, px)

def _game_is_live(g, now):
    if _espn_final(g):
        return False
    state = (g.get('game') or {}).get('state') if isinstance(g.get('game'), dict) else g.get('state')
    if state == 'in' or g.get('phase') == 'live':
        return True
    ts = g.get('startTs') or 0
    return bool(ts and ts <= now and (now - ts) <= LIVE_SECS)

def refresh(games, now, win_end, kalshi_now=None):
    """Keep live (not final) and upcoming games; refresh Kalshi prices on each side."""
    out = []
    for g in games or []:
        ts = g.get('startTs') or 0
        if not ts or ts > win_end:
            continue
        if ts <= now and not _game_is_live(g, now):
            continue
        # Skip leftover flat-list rows; a new scan rebuilds cards.
        if not g.get('markets') and g.get('label'):
            continue
        markets = []
        for m in g.get('markets') or []:
            # New shape: markets[].sides
            if m.get('sides'):
                sides = complete_sides(list(m['sides']), kind=m.get('kind') or 'other', game_title=g.get('game') or '', q=m.get('q') or '')
                sides = [_refresh_side(s, kalshi_now) for s in sides]
                if not any(s.get('cappers') for s in sides):
                    continue
                markets.append(dict(m, sides=sides))
                continue
            # Very old favor/markets shape is dropped; scan rebuilds.
        if not markets:
            continue
        markets.sort(key=_market_rank)
        out.append(dict(g, markets=markets))
    out.sort(key=_sort_key)
    return out
