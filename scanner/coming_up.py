#!/usr/bin/env python3
"""Coming Up tab: one card per upcoming game, both sides, Hot and Elite cappers only.

$100+ open positions, next 36 hours, games not started. Market makers / bots
and one-offs are excluded. Cards are ranked by hot-capper count, then capper ROI
(not dollars). Separate from All Picks ($500/$300) pick rules.
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

def _capper_roi(rec):
    if not rec:
        return None
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

def _side_blob(rows, hot, sport_map, label, side, src, kalshi=None):
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
    cid = (src or {}).get('cid') or ''
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
                sides.append(_side_blob(rows, hot, sport_map, label, side, src))
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

def refresh(games, now, win_end, kalshi_now=None):
    """Drop started games and refresh Kalshi prices on each side."""
    out = []
    for g in games or []:
        ts = g.get('startTs') or 0
        if not ts or ts <= now or ts > win_end:
            continue
        # Skip leftover flat-list rows; a new scan rebuilds cards.
        if not g.get('markets') and g.get('label'):
            continue
        markets = []
        for m in g.get('markets') or []:
            # New shape: markets[].sides
            if m.get('sides'):
                sides = [_refresh_side(s, kalshi_now) for s in m['sides']]
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
