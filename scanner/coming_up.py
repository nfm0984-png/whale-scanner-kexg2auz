#!/usr/bin/env python3
"""Coming Up tab: one card per upcoming game, both sides, Hot and Elite cappers only.

$100+ open positions, live games (started within ~3 hours, not final) plus
the next 36 hours. Market makers / bots and one-offs are excluded. Cards are
ranked by hot-capper count, then capper ROI (not dollars). Separate from All
Picks ($500/$300) pick rules.
"""
import collections, json, re, urllib.request
import wallet_flags as wf
import capper_history as ch
import kalshi_names as kn

LEAN_MIN = 500  # Noel Nov 17: $500 minimum on Coming Up / Elite / combos too
LIVE_SECS = int(3 * 3600)
# Longest a game normally runs after its start (fallback when no final signal exists). Anything past this is treated as over.
_LIVE_HOURS = {'NFL': 4, 'CFB': 4, 'NCAAF': 4, 'MLB': 3.5, 'ATP': 3.5, 'WTA': 3.5, 'UFC': 6, 'CBB': 2.75, 'NCAAMB': 2.75, 'NBA': 3, 'NHL': 3,
               'CS2': 3.5, 'DOTA2': 3.5, 'LOL': 3.5, 'VAL': 3.5}
def live_secs(league):
    return int(3600 * _LIVE_HOURS.get((league or '').upper(), 3))
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
    """Noel Nov 18: every tracked capper with a positive profit feeds Coming Up / All Picks (not only the proven floor).
    Market makers, one-off records and Cooling cappers stay out."""
    if not c or c.get('mm') or c.get('oneOff') or c.get('badge') == 'Cooling':
        return False
    return (c.get('profit') or 0) > 0

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
        if c.get('badge') == 'Cooling':
            # Noel Nov 17: Cooling cappers never feed Coming Up or combos
            if w:
                blocked.add(w)
            continue
        if is_hot_or_elite(c, elite) and w:
            out[w] = c
    # Noel Nov 17: no free pass for elites missing from capperHistory; the full proven floor applies to everyone.
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
    return bool(ts and ts <= now and (now - ts) <= live_secs(b.get('league')))

def _in_window(b, now, win_end):
    k = b.get('kalshi') or {}
    if k.get('status') != 'ok' or k.get('price') is None:
        return False
    if (b.get('cost') or 0) < LEAN_MIN:
        return False
    kp = k.get('price')
    if kp < 0.03 or kp > 0.97:
        return False  # resolved / priced out
    ts0 = b.get('startTs') or 0
    last = b.get('lastTs') or b.get('firstTs') or 0
    # Stale pre-game buys no longer block (Noel, Nov 17); slip below is the freshness guard.
    # Noel Nov 17: no price check. How far Kalshi is from the capper's entry is shown on the card as a note, never a filter.
    ts = b.get('startTs') or 0
    if not ts or ts > win_end:
        return False
    if ts > now:
        return True
    return _is_live(b, now)

def _lens_skip(wallet):
    try:
        import orca_lenses as _ol
        return _ol.skip(wallet)
    except Exception:
        return False

def _uniq(rows):
    best = {}
    for b in rows:
        w = (b.get('wallet') or '').lower()
        if not w or _lens_skip(w):
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

def _orca_flags(wallet):
    try:
        import orca_lenses as _ol
        return _ol.flags(wallet)
    except Exception:
        return None

def _backer(b, rec, sport_map):

    sport = sport_of(b.get('league'), sport_map)
    sr = ((rec or {}).get('sports') or {}).get(sport) or {}
    return dict(
        wallet=b.get('wallet'),
        name=b.get('name') or (b.get('wallet') or '')[:10],
        cost=round(b.get('cost') or 0),
        avg=round(b['avg'], 3) if b.get('avg') is not None else None,
        lastTs=b.get('lastTs') or b.get('firstTs') or None,
        buysOk=True if b.get('buysOk') else None,
        buyTs=b.get('buyTs'),
        buy3h=b.get('buy3h'),
        buy24h=b.get('buy24h'),
        sport=sport,
        sw=sr.get('w') or 0,
        sl=sr.get('l') or 0,
        sn=sr.get('n') or 0,
        sroi=sr.get('roi'),
        roi=_capper_roi(rec),
        wr=(rec or {}).get('wr'),
        elite=bool((rec or {}).get('proven')),
        orca=_orca_flags(b.get('wallet')),
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

def _name_tokens(s):
    return kn.tokens(s)
def _name_hit(name, team):
    return kn.name_hit(name, team)

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
        sm = re.match(r'Spread:\s*(.+?)\s*\(([+-]?[\d.]+)\)', q)
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


QUALITY_SEVEN_SECS = 7 * 86400


def _qnum(v):
    try:
        if v is None:
            return None
        return float(v)
    except (TypeError, ValueError):
        return None


def _qts(v, now):
    try:
        n = float(v)
    except (TypeError, ValueError):
        return None
    if n > 1e12:
        n = n / 1000.0
    if n < 1e9 or (now is not None and n > float(now) + 86400):
        return None
    return n


def _win_pnl(rec, key):
    w = (rec or {}).get("win") or {}
    v = w.get(key)
    if isinstance(v, dict):
        return _qnum(v.get("pnl"))
    return _qnum(v)


def capper_quality_ok(rec, now, backer=None, stats=None):
    """Keep unless all-time or year dollar PnL is negative, month dollar PnL is not positive, or there are no bets in 7 days.

    Missing fields: keep the capper and count them on stats.
    """
    rec = rec or {}
    backer = backer or {}
    stats = stats if stats is not None else {}
    wallet = (backer.get("wallet") or rec.get("wallet") or "").lower()

    def miss(key):
        seen = stats.setdefault("_seen_" + key, set())
        if wallet and wallet in seen:
            return
        if wallet:
            seen.add(wallet)
        stats[key] = stats.get(key, 0) + 1

    # Dollar PnL only — never W-L or scanner graded profit.
    all_time = _win_pnl(rec, "all")
    if all_time is None:
        all_time = _qnum(rec.get("pnl"))
        if all_time == 0:
            all_time = None
    year = _win_pnl(rec, "year")
    if all_time is None and year is None:
        miss("missingAllTime")
    else:
        if all_time is not None and all_time < 0:
            stats.setdefault("droppedNames", set()).add(rec.get("name") or wallet)
            return False
        if year is not None and year < 0:
            stats.setdefault("droppedNames", set()).add(rec.get("name") or wallet)
            return False

    month = _win_pnl(rec, "month")
    if month is None:
        month = _qnum(rec.get("pnl30"))
    if month is None:
        miss("missingMonth")
    elif month <= 0:
        stats.setdefault("droppedNames", set()).add(rec.get("name") or wallet)
        return False

    last = _qts(backer.get("lastTs") or backer.get("firstTs") or rec.get("lastTs")
                or (rec.get("big") or {}).get("lastTs") or (rec.get("bf") or {}).get("ts"), now)
    if last is None:
        miss("missingLastBet")
    elif now is not None and last < float(now) - QUALITY_SEVEN_SECS:
        stats.setdefault("droppedNames", set()).add(rec.get("name") or wallet)
        return False
    return True


def filter_quality_games(games, capper_history, now, log=print):
    """Drop failing cappers from sides; drop a pick/game if no qualifying capper remains."""
    recs = {}
    for c in (capper_history or {}).get("cappers") or []:
        w = (c.get("wallet") or "").lower()
        if w:
            recs[w] = c
    stats = {}
    out = []
    for g in games or []:
        markets = []
        for m in g.get("markets") or []:
            sides = []
            for s in m.get("sides") or []:
                keep = []
                for b in s.get("backers") or []:
                    rec = recs.get((b.get("wallet") or "").lower()) or {}
                    if capper_quality_ok(rec, now, b, stats):
                        keep.append(b)
                if not keep:
                    continue
                s = dict(s)
                s["backers"] = keep
                s["cappers"] = len(keep)
                s["usd"] = round(sum(b.get("cost") or 0 for b in keep))
                s["names"] = [b.get("name") for b in keep]
                sides.append(s)
            if not sides:
                continue
            m = dict(m)
            m["sides"] = sides
            markets.append(m)
        if not markets:
            continue
        wallets = {}
        for m in markets:
            for s in m.get("sides") or []:
                for b in s.get("backers") or []:
                    w = (b.get("wallet") or "").lower()
                    if w:
                        wallets[w] = b
        g = dict(g)
        g["markets"] = markets
        g["capperCount"] = len(wallets)
        out.append(g)
    names = sorted(stats.get("droppedNames") or [])
    miss_n = len(set().union(
        stats.get("_seen_missingAllTime") or [],
        stats.get("_seen_missingMonth") or [],
        stats.get("_seen_missingLastBet") or [],
    ))
    log("quality filter: dropped %d cappers, kept %d with a missing field (all-time/year %d, month %d, last bet %d)%s" % (
        len(names),
        miss_n,
        stats.get("missingAllTime") or 0,
        stats.get("missingMonth") or 0,
        stats.get("missingLastBet") or 0,
        (": " + ", ".join(names[:20]) + ("..." if len(names) > 20 else "")) if names else "",
    ))
    return out

def build(lean_bets, capper_history, now, win_end, proven=None, hot_override=None):
    """Return one card per upcoming game, both sides, ranked by capper count then ROI."""
    hot = hot_override if hot_override is not None else hot_wallets(capper_history, proven)
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
    try:
        games = drop_finished(games, now)
    except Exception as _e:
        print('drop_finished failed:', _e)
    try:
        games = filter_quality_games(games, capper_history, now)
    except Exception as _e:
        print('quality filter failed:', _e)
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
    wrapped = []
    for m in cands:
        wrapped.append({"yes_sub_title": m.get('yes_sub_title') or m.get('title') or '', "_m": m})
    hit = kn.find_team_market(wrapped, label)
    return hit.get("_m") if hit else None

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

def _wins_by_parse(title):
    m = re.search(r'^(.*?)\s+wins by (?:over|more than)\s+([\d.]+)', (title or '').strip(), re.I)
    if not m:
        return None, None
    return m.group(1).strip(), float(m.group(2))

def _match_spread_market(markets, team, line):
    if not markets or not team or line is None:
        return None
    hits = []
    for m in markets:
        title = (m.get('yes_sub_title') or m.get('title') or '').strip()
        t, ln = _wins_by_parse(title)
        fs = _kfp(m.get('floor_strike'))
        if ln is None:
            ln = fs
        if ln is None or abs(ln - float(line)) > 0.06:
            continue
        name = t or re.sub(r'\s+wins by.*$', '', title, flags=re.I)
        if _name_hit(team, name):
            hits.append(m)
    return hits[0] if hits else None

def _rematch_spread_sides(sides, q, ev_ms):
    """Point both sides at the favorite's Kalshi 'wins by over/more than N' contract.

    Polymarket 'Spread: PSV (-1.5)' YES = PSV covers -1.5 = BUY YES on PSV wins by more than 1.5.
    The NO side ('Real Madrid +1.5') is BUY NO on that same PSV contract, not on Real Madrid's line.
    A plus line on the named team ('Spread: Real Madrid (+1.5)') inverts the YES/NO mapping.
    """
    sm = re.match(r'Spread:\s*(.+?)\s*\(([+-]?[\d.]+)\)', q or '', re.I)
    if not sm or not ev_ms:
        return False
    named, raw = sm.group(1).strip(), float(sm.group(2))
    line = abs(raw)
    named_is_fav = raw <= 0
    fav = named if named_is_fav else None
    if not fav:
        for m in ev_ms:
            t, ln = _wins_by_parse(m.get('yes_sub_title') or m.get('title') or '')
            if t and ln is not None and abs(ln - line) < 0.06 and not _name_hit(named, t):
                fav = t
                break
    mkt = _match_spread_market(ev_ms, fav, line) if fav else None
    if not mkt:
        return False
    title = mkt.get('yes_sub_title') or mkt.get('title') or ''
    yes_ask, no_ask = _asks(mkt if (mkt.get('yes_ask_dollars') or mkt.get('no_ask_dollars')) else fetch_market(mkt.get('ticker')))
    invert = not named_is_fav
    for s in sides:
        poly_no = (s.get('side') or '').lower() == 'no'
        want_yes = (not poly_no) if not invert else poly_no
        s['ticker'] = mkt.get('ticker')
        s['contract'] = title
        s['action'] = 'BUY YES' if want_yes else 'BUY NO'
        s['yesSubTitle'] = mkt.get('yes_sub_title')
        s['noSubTitle'] = mkt.get('no_sub_title')
        s['marketTitle'] = title
        px = yes_ask if want_yes else no_ask
        if px is not None:
            apply_price(s, px)
        if yes_ask is not None:
            s['yesAsk'] = yes_ask
        if no_ask is not None:
            s['noAsk'] = no_ask
    return True

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
    if (kind or '').lower() == 'spread' or re.match(r'Spread:', q or '', re.I):
        if _rematch_spread_sides(sides, q, ev_ms):
            src = next((s for s in sides if s.get('ticker') and s.get('action')), src)
            ticker = src.get('ticker')
            market = fetch_market(ticker) if ticker else market
            ev_tk = event_ticker_of(ticker, market) or ev_tk
            ev = fetch_event(ev_tk) if ev_tk else ev
            ev_ms = fetch_event_markets(ev_tk) if ev_tk else ev_ms
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
    return bool(ts and ts <= now and (now - ts) <= live_secs(g.get('league')))

_KFINAL = ('closed', 'settled', 'finalized', 'determined')
DECIDED_PX = 0.97
def drop_finished(games, now, log=print):
    """Remove games that have ended: any Kalshi market closed/settled/finalized or with a result, or (for started games) a moneyline already priced
    at 97c+ on a side (decided; nothing left to bet). Games not started yet are never touched here."""
    out = []; dropped = []
    for g in games or []:
        ts = g.get('startTs') or 0
        if not ts or ts > now:
            out.append(g); continue
        done = None
        seen = set()
        for m in g.get('markets') or []:
            for s in m.get('sides') or []:
                for tk in (s.get('ticker'), s.get('oppTicker')):
                    if not tk or tk in seen:
                        continue
                    seen.add(tk)
                    km = fetch_market(tk)
                    if not km:
                        continue
                    if (km.get('status') or '') in _KFINAL or km.get('result') in ('yes', 'no'):
                        done = 'kalshi ' + (km.get('status') or km.get('result')); break
                    if (m.get('kind') or '') == 'moneyline' and (g.get('league') or '').upper() not in ('UFC', 'BOXING'):  # fight cards start hours before each bout
                        ya, na = _kfp(km.get('yes_ask_dollars')), _kfp(km.get('no_ask_dollars'))
                        if (ya is not None and ya >= DECIDED_PX) or (na is not None and na >= DECIDED_PX):
                            done = 'decided at %s/%s' % (ya, na); break
                if done: break
            if done: break
        if done:
            dropped.append('%s (%s)' % (g.get('game'), done))
        else:
            out.append(g)
    if dropped:
        log('finished games removed: %d: %s' % (len(dropped), '; '.join(dropped[:12])))
    return out

def refresh(games, now, win_end, kalshi_now=None, capper_history=None):
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
    try:
        out = drop_finished(out, now)
    except Exception as _e:
        print('drop_finished failed:', _e)
    try:
        out = filter_quality_games(out, capper_history or {}, now)
    except Exception as _e:
        print('quality filter failed:', _e)
    return out


def stamp_first_seen(games, prev_map, now, keep_days=4):
    """Nov 23 (Noel): stamp each Coming Up side with when the scanner first showed it (side['firstTs']).

    prev_map is the previous run's {side id: first ts}. None means no history yet (first deploy):
    sides seen then are stored as 0 = unknown so they never get a false 'LIVE · added after start' tag.
    Returns the updated map (entries older than keep_days dropped).
    """
    seed = prev_map is None
    fs = dict(prev_map or {})
    for g in games or []:
        for m in g.get('markets') or []:
            for sd in m.get('sides') or []:
                sid = sd.get('id')
                if not sid or not (sd.get('backers') or []):
                    continue
                if sid not in fs:
                    fs[sid] = 0 if seed else int(now)
                sd['firstTs'] = int(fs[sid] or 0)
    live_ids = {sd.get('id') for g in games or [] for m in g.get('markets') or [] for sd in m.get('sides') or []}
    cut = now - keep_days * 86400
    out = {}
    for k, v in fs.items():
        if k in live_ids or (v and v >= cut):
            out[k] = v
    return out
