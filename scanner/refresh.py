#!/usr/bin/env python3
"""Refresh the current picks WITHOUT calling OrcaLayer (saves usage).
ESPN: live status/score, final result, start time, both-team matchup, and ESPN's win probability (live) or matchup predictor (pre-game) per pick.
Kalshi: one public price check per pick's matched contract, plus event start time when ESPN misses. Marks W/L in history.json, then rewrites page_embed.json -> page_data_line.txt.
Usage: python3 refresh.py"""
import json, os, re, sys, time, subprocess, urllib.request, datetime as dt
HERE = os.path.dirname(os.path.abspath(__file__))
PT = dt.timezone(dt.timedelta(hours=-8)); NOW = int(time.time())
def pt(ts):
    return dt.datetime.fromtimestamp(ts, PT).strftime('%a %b %-d · %-I:%M %p PT')
def pub(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'orca-scanner/1.0'}), timeout=20) as r: return json.load(r)
        except Exception: time.sleep(1 + i)
    return None
EP = {'NBA': 'basketball/nba', 'NFL': 'football/nfl', 'NHL': 'hockey/nhl', 'MLB': 'baseball/mlb', 'CFB': 'football/college-football', 'CBB': 'basketball/mens-college-basketball',
      'CWBB': 'basketball/womens-college-basketball', 'WNBA': 'basketball/wnba', 'EPL': 'soccer/eng.1', 'UCL': 'soccer/uefa.champions', 'UEL': 'soccer/uefa.europa', 'UECL': 'soccer/uefa.europa.conf',
      'LAL': 'soccer/esp.1', 'ES2': 'soccer/esp.2', 'BUN': 'soccer/ger.1', 'BL2': 'soccer/ger.2', 'SEA': 'soccer/ita.1', 'ITB': 'soccer/ita.2', 'FL1': 'soccer/fra.1', 'FL2': 'soccer/fra.2',
      'ERE': 'soccer/ned.1', 'POR': 'soccer/por.1', 'MEX': 'soccer/mex.1', 'BRA': 'soccer/bra.1', 'ARG': 'soccer/arg.1', 'MLS': 'soccer/usa.1',
      'UNL': 'soccer/uefa.nations', 'UWCL': 'soccer/uefa.wchampions', 'CDR': 'soccer/esp.copa_del_rey', 'FIF': 'soccer/fifa.friendly', 'EFL': 'soccer/eng.2', 'ELC': 'soccer/eng.2',
      'EFA': 'soccer/eng.fa', 'FACUP': 'soccer/eng.fa', 'LCUP': 'soccer/eng.league_cup', 'TUR': 'soccer/tur.1', 'SCO': 'soccer/sco.1',
      'BEL': 'soccer/bel.1', 'DEN': 'soccer/den.1', 'NOR': 'soccer/nor.1', 'SWE': 'soccer/swe.1', 'JAP': 'soccer/jpn.1', 'AUS': 'soccer/aus.1',
      'LIB': 'soccer/conmebol.libertadores', 'SUD': 'soccer/conmebol.sudamericana', 'COF': 'soccer/fra.coupe_de_france',
      'DFB': 'soccer/ger.dfb_pokal', 'ITC': 'soccer/ita.coppa_italia', 'NWSL': 'soccer/usa.nwsl', 'SPL': 'soccer/ksa.1',
      'EUROLEAGUE': 'basketball/euroleague', 'EURO': 'basketball/euroleague',
      'ATP': 'tennis/atp', 'WTA': 'tennis/wta', 'UFC': 'mma/ufc',
      'PGA': 'golf/pga', 'GOLF': 'golf/pga', 'LPGA': 'golf/lpga',
      'F1': 'racing/f1', 'NASCAR': 'racing/nascar-premier', 'INDYCAR': 'racing/irl', 'INDY': 'racing/irl',
      'CFL': 'football/cfl', 'CONL': 'soccer/concacaf.nations'}
TZOFF = {'EST': -5, 'EDT': -4, 'CST': -6, 'CDT': -5, 'MST': -7, 'MDT': -6, 'PST': -8, 'PDT': -7, 'ET': -5, 'PT': -8}
def norm(x): return re.sub(r'[^a-z0-9 ]', '', (x or '').lower()).strip()
def clean_name(n):
    s = re.sub(r'\s*\((?:[^)]*(?:Prelims|Main Card|Early Prelims|[A-Za-z]*weight)[^)]*)\)\s*', ' ', n or '', flags=re.I)
    s = re.sub(r'\s*\([A-Za-z]{1,3}\)\s*$', '', s)
    return re.sub(r'\s+', ' ', s).strip()
def teams_of(q, label=''):
    q = q or ''
    for part in (re.sub(r'^[^:]*:\s*', '', q), re.sub(r':.*$', '', q), q):
        part = re.sub(r'\s*\(BO\d\).*$|\s+-\s+.*$', '', part)
        part = clean_name(part)
        if re.search(r'\svs\.?\s', part):
            return [clean_name(t) for t in re.split(r'\s+vs\.?\s+', part) if clean_name(t)]
    m = re.match(r'Will (.+?) win', q)
    if m: return [clean_name(m.group(1))]
    m = re.match(r'^Spread:\s*(.+?)\s*\(', q)
    if m: return [clean_name(m.group(1))]
    if label: return [clean_name(label)]
    return []
def hit(name, comp):
    n = norm(clean_name(name)); words = n.split()
    if 'team' in comp:
        blob = norm(' '.join(comp['team'].get(k, '') for k in ('displayName', 'shortDisplayName', 'abbreviation', 'name', 'location')))
    else:
        a = comp.get('athlete') or {}
        blob = norm(' '.join(a.get(k, '') for k in ('displayName', 'shortName', 'fullName', 'lastName')))
    return bool(words) and (n in blob or words[-1] in blob.split())
def iso_ts(raw):
    if not raw: return None
    try: return int(dt.datetime.fromisoformat(str(raw).replace('Z', '+00:00')).timestamp())
    except Exception: return None
def parse_espn_time(detail, fallback_iso):
    m = re.search(r'(?:(\d{1,2})/(\d{1,2})\s*[-–]\s*)?(\d{1,2}):(\d{2})\s*(AM|PM)\s*([A-Z]{2,3})', detail or '', re.I)
    fb = iso_ts(fallback_iso)
    if not m: return fb
    month = day = None
    if m.group(1):
        month, day = int(m.group(1)), int(m.group(2))
    elif fallback_iso:
        try:
            d0 = dt.datetime.fromisoformat(str(fallback_iso).replace('Z', '+00:00'))
            month, day = d0.month, d0.day
        except Exception:
            pass
    if not month: return fb
    year = dt.datetime.fromtimestamp(fb or NOW, dt.timezone.utc).year
    hh = int(m.group(3)) % 12 + (12 if m.group(5).upper() == 'PM' else 0)
    off = TZOFF.get(m.group(6).upper())
    if off is None: return fb
    try:
        ts = int(dt.datetime(year, month, day, hh, int(m.group(4)), tzinfo=dt.timezone(dt.timedelta(hours=off))).timestamp())
        return ts
    except Exception:
        return fb
def event_ts(e, comp=None):
    c = comp or ((e.get('competitions') or [None])[0]) or {}
    detail = ((c.get('status') or e.get('status') or {}).get('type') or {}).get('shortDetail') or ''
    raw = c.get('date') or e.get('date')
    return parse_espn_time(detail, raw) or iso_ts(raw)
def competitor_names(cs):
    out = []
    for c in cs or []:
        if 'team' in c:
            t = c['team']
            out.append(t.get('displayName') or t.get('shortDisplayName') or t.get('abbreviation') or '')
        else:
            a = c.get('athlete') or {}
            out.append(a.get('displayName') or a.get('shortName') or '')
    return [x for x in out if x]
def vs_name(cs, short=None):
    names = competitor_names(cs)
    if len(names) >= 2: return names[0] + ' vs ' + names[1]
    return (short or '').replace(' @ ', ' vs ') or (names[0] if names else None)
def date_guess(p):
    ts = p.get('startTs')
    if ts:
        return dt.datetime.fromtimestamp(int(ts), dt.timezone(dt.timedelta(hours=-5))).date()
    g = p.get('game') or {}
    blob = ' '.join([g.get('start') or '', p.get('q') or p.get('question') or '', p.get('slug') or ''])
    m = re.search(r'(20\d\d-\d\d-\d\d)', blob)
    if m:
        try: return dt.date.fromisoformat(m.group(1))
        except Exception: pass
    m = re.search(r'(20\d\d)(\d\d)(\d\d)', blob)
    if m:
        try: return dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except Exception: pass
    return dt.datetime.fromtimestamp(NOW, dt.timezone(dt.timedelta(hours=-5))).date()
def espn_extra(lg):
    if lg in ('CBB', 'CWBB'): return '&groups=50&limit=400'
    if lg == 'CFB': return '&groups=80&limit=300'
    return ''
SB = {}
def sc(c):
    v = c.get('score')
    if isinstance(v, dict): v = v.get('displayValue')
    if v is None and c.get('linescores'): v = ' '.join(str(int(x.get('value', 0))) for x in c['linescores'])
    return v or ''
def find_game(p):
    lg = (p.get('league') or '').upper()
    if lg not in EP: return None, 'no feed for ' + lg
    names = teams_of(p.get('q') or p.get('question') or '', p.get('label') or '')
    if not names: return None, 'no team names to match'
    d0 = date_guess(p)
    hits = []
    for d in (d0, d0 - dt.timedelta(days=1), d0 + dt.timedelta(days=1)):
        k = (lg, d)
        if k not in SB:
            evs = (pub(f"https://site.api.espn.com/apis/site/v2/sports/{EP[lg]}/scoreboard?dates={d.strftime('%Y%m%d')}{espn_extra(lg)}") or {}).get('events', [])
            flat = []
            for e in evs:
                comps = e.get('competitions') or [c for g in e.get('groupings', []) for c in g.get('competitions', [])] or [None]
                for c in comps:
                    if not c: continue
                    flat.append(dict(id=c.get('id') or e.get('id'), status=c.get('status') or e.get('status') or {'type': {}}, competitions=[c], shortName=e.get('shortName') or e.get('name'), name=e.get('name'), date=c.get('date') or e.get('date'), nested=not e.get('competitions'), links=e.get('links')))
            SB[k] = flat
        for e in SB[k]:
            comp = e['competitions'][0]; cs = comp.get('competitors', [])
            n_hit = sum(any(hit(n, c) for c in cs) for n in names)
            if n_hit >= min(2, len(names)):
                hits.append((n_hit, e))
    if not hits: return None, 'game not on the scoreboard yet'
    hits.sort(key=lambda x: -x[0])
    if len(names) >= 2: return hits[0][1], None
    # single-team (spread / teamwin): only accept a unique event
    uniq, seen = [], set()
    for n_hit, e in hits:
        if e['id'] not in seen:
            seen.add(e['id']); uniq.append(e)
    if len(uniq) == 1: return uniq[0], None
    return None, 'team name matched more than one game'
def apply_event(p, e):
    g = p.setdefault('game', {})
    comp = e['competitions'][0]; st = (e.get('status') or {}).get('type') or {}; cs = comp.get('competitors') or []
    ts = event_ts(e, comp)
    name = vs_name(cs, e.get('shortName') or e.get('name'))
    if name: g['name'] = name
    g['teams'] = competitor_names(cs)
    if ts:
        p['startTs'] = int(ts)
        g['start'] = pt(ts)
        g['src'] = 'ESPN'
    elif g.get('start') and 'time not supplied' in str(g.get('start')):
        g['start'] = re.sub(r'\s*\(time not supplied\)', '', g['start'])
        g['src'] = g.get('src') or 'market date only'
    g['state'] = st.get('state')
    g['detail'] = st.get('shortDetail') or g.get('detail') or ''
    g['score'] = ' – '.join(f"{(c.get('team') or {}).get('abbreviation') or (c.get('athlete') or {}).get('shortName') or (c.get('athlete') or {}).get('displayName', '')} {sc(c)}" for c in cs) if st.get('state') != 'pre' else (g.get('score') or '')
    return st, cs, ts
def evkey(slug):
    m_ = re.match(r'(.+?-20\d\d-\d\d-\d\d)', slug or '')
    return m_.group(1) if m_ else (slug or '')
def win_pct(lg, e, pick_comp):
    """ESPN live win probability (in-game) or matchup predictor (pre-game) for the picked team."""
    if e.get('nested'): return None, 'ESPN has no win probability for this match'
    s = pub(f"https://site.api.espn.com/apis/site/v2/sports/{EP[lg]}/summary?event={e['id']}") or {}
    home = pick_comp.get('homeAway') == 'home'
    wp = s.get('winprobability') or []
    if wp and wp[-1].get('homeWinPercentage') is not None:
        h = wp[-1]['homeWinPercentage']; return round(100 * (h if home else 1 - h - (wp[-1].get('tiePercentage') or 0)), 1), 'ESPN live win probability'
    pr = s.get('predictor') or {}
    side = pr.get('homeTeam' if home else 'awayTeam') or {}
    v = side.get('gameProjection') or side.get('teamChanceLoss')
    if side.get('gameProjection') is not None: return round(float(side['gameProjection']), 1), 'ESPN matchup predictor'
    return None, 'ESPN has no win probability for this game'
def kalshi_market(tk):
    if not tk: return None
    return (pub(f"https://api.elections.kalshi.com/trade-api/v2/markets/{tk}") or {}).get('market') or {}
def kalshi_now(tk, cached=None):
    m = cached if cached is not None else kalshi_market(tk)
    if not m: return None
    try: return dict(yes=float(m.get('yes_ask_dollars')), no=float(m.get('no_ask_dollars')), status=m.get('status'), result=m.get('result'), market=m)
    except Exception: return None
MON = {m: i for i, m in enumerate(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'], 1)}
def kalshi_start(m):
    if not m: return None, None
    # Only use actual event/occurrence times, never market close/expiration (those are later than kickoff).
    for key in ('occurrence_time', 'occurrence_datetime', 'event_time'):
        ts = iso_ts(m.get(key))
        if ts: return ts, 'Kalshi ' + key.replace('_', ' ')
    rule = m.get('rules_primary') or m.get('rules_secondary') or m.get('title') or ''
    rm_ = re.search(r'scheduled for (\w{3}) (\d{1,2}), (\d{4}) at (\d{1,2}):(\d\d) (AM|PM) E[SD]T', rule)
    if rm_:
        hh = int(rm_.group(4)) % 12 + (12 if rm_.group(6) == 'PM' else 0)
        off = -4 if 'EDT' in rule else -5
        ts = int(dt.datetime(int(rm_.group(3)), MON[rm_.group(1).upper()], int(rm_.group(2)), hh, int(rm_.group(5)), tzinfo=dt.timezone(dt.timedelta(hours=off))).timestamp())
        return ts, 'Kalshi contract rules'
    return None, None
emb = json.load(open(os.path.join(HERE, 'page_embed.json')))
HP = os.path.join(HERE, 'history.json'); hist = json.load(open(HP)) if os.path.exists(HP) else {'scans': [], 'picks': {}}
n_espn = n_k = n_filled = 0
emb.setdefault('poly', [])
emb.setdefault('glue', [])
emb.setdefault('props', [])
emb.setdefault('longshots', [])
emb.setdefault('biggest', [])
emb.setdefault('upcoming', [])
def pick_lists(): return emb['signals'] + emb['fun'] + emb['poly'] + emb['glue'] + emb['props'] + emb['longshots'] + emb['biggest'] + emb['upcoming']
def pick_tier(p):
    if p in emb['upcoming'] and p not in emb['signals'] and p not in emb['fun'] and p not in emb['poly'] and p not in emb['glue'] and p not in emb['props'] and p not in emb['longshots'] and p not in emb['biggest']: return 'upcoming'
    if p in emb['longshots']: return 'longshots'
    if p in emb['props']: return 'props'
    if p in emb['poly']: return 'poly'
    if p in emb['fun']: return 'fun'
    if p in emb['glue']: return 'glue'
    if p in emb['signals']: return 'top'
    if p in emb['biggest']: return 'biggest'
    if p in emb['upcoming']: return 'upcoming'
    return 'top'
def has_started(p):
    r = p.get('refresh') or {}
    g = p.get('game') or {}
    if r.get('state') in ('in', 'post') or g.get('state') in ('in', 'post'): return True
    if r.get('ended') or r.get('final'): return True
    ts = p.get('startTs')
    if ts and ts <= NOW: return True
    return False
def enrich_row(p, do_wp=False, do_kalshi=False):
    global n_espn, n_k, n_filled
    e, why = find_game(p)
    r = dict(at=NOW)
    st = {}; cs = []; pc = None
    if e:
        st, cs, ts = apply_event(p, e)
        pick_name = p.get('label') or ''
        pc = next((c for c in cs if hit(pick_name, c)), None)
        r.update(state=st.get('state'), detail=st.get('shortDetail'), score=(p.get('game') or {}).get('score') or '')
        n_espn += 1
        if ts: n_filled += 1
        if do_wp and pc and st.get('state') != 'post':
            r['pct'], r['src'] = win_pct(p['league'], e, pc); r['team'] = pick_name
        if st.get('state') == 'post' and pc is not None:
            r['final'] = 'W' if pc.get('winner') else ('L' if any(c.get('winner') for c in cs) else 'push')
    else:
        r['why'] = why
    k = p.get('kalshi') or {}
    kn = None
    if do_kalshi and k.get('status') == 'ok' and k.get('ticker'):
        kn = kalshi_now(k['ticker']); n_k += 1
        if kn:
            r['kNow'] = kn['yes'] if (k.get('action') or '').endswith('YES') else kn['no']
            if kn.get('status') in ('closed', 'settled', 'finalized', 'determined'): r['ended'] = True
            if kn.get('result') in ('yes', 'no') and 'final' not in r:
                r['final'] = 'W' if kn['result'] == ('yes' if (k.get('action') or '').endswith('YES') else 'no') else 'L'
            if not p.get('startTs'):
                ts, src = kalshi_start(kn.get('market'))
                if ts:
                    p['startTs'] = ts
                    g = p.setdefault('game', {})
                    g['start'] = pt(ts)
                    g['src'] = src
                    n_filled += 1
    if r.get('state') == 'post' or r.get('final'): r['ended'] = True
    return r
# Enrich tab picks (ESPN status + times + Kalshi prices)
for p in pick_lists():
    r = enrich_row(p, do_wp=True, do_kalshi=True)
    p['refresh'] = r
    k = p.get('kalshi') or {}
    h = hist['picks'].get(p['id'])
    if h is None:
        h = hist['picks'][p['id']] = dict(q=p['q'], label=p['label'], side=p['id'].split(':')[-1], score=p.get('score'), whales=p.get('whales'), invested=p.get('invested'),
                                          start=(p.get('game') or {}).get('start'), kalshi=f"{k.get('action')} {k.get('contract')} @ {round(100*k['price'])}¢" if k.get('price') else ('Polymarket only' if pick_tier(p) == 'poly' else 'No Kalshi match'),
                                          kprice=k.get('price'), first_seen=emb.get('ts'), last_seen=emb.get('ts'), scans=1, result=None, tier=pick_tier(p))
    if r.get('final') in ('W', 'L') and not h.get('result'): h['result'] = r['final']; h['graded'] = NOW
    if r.get('ended'): h['ended'] = NOW; h['finalScore'] = r.get('score') or ''; h['active'] = False
# Enrich unique bets/buys so Bets, Buys, Cappers and Upcoming get matchups + times (no win-prob calls)
seen_g = set()
for b in (emb.get('bets') or []) + (emb.get('buys') or []):
    key = ((b.get('league') or ''), (b.get('q') or ''), (b.get('slug') or ''), (b.get('startTs') or 0), (b.get('game') or {}).get('start') or '')
    if key in seen_g:
        continue
    seen_g.add(key)
    enrich_row(b, do_wp=False, do_kalshi=False)
    # if still missing time and we have a ticker, one Kalshi lookup
    if not b.get('startTs'):
        tk = (b.get('kalshi') or {}).get('ticker')
        if tk:
            ts, src = kalshi_start(kalshi_market(tk))
            if ts:
                b['startTs'] = ts
                g = b.setdefault('game', {})
                g['start'] = pt(ts)
                g['src'] = src
                n_filled += 1
# Copy filled name/time onto other bets/buys with the same question or evkey
by_q, by_ev = {}, {}
def consider(row):
    g = row.get('game') or {}
    ts = row.get('startTs')
    name = g.get('name')
    if not ts and not name: return
    q = row.get('q') or ''
    if q:
        cur = by_q.get(q)
        if not cur or (ts and (not cur[0] or (g.get('src') == 'ESPN' and cur[2] != 'ESPN'))):
            by_q[q] = (ts, name, g.get('src'), g.get('start'), g.get('teams'), g.get('state'), g.get('detail'), g.get('score'))
    ek = evkey(row.get('slug') or '')
    if ek:
        cur = by_ev.get(ek)
        if not cur or (ts and (not cur[0] or (g.get('src') == 'ESPN' and cur[2] != 'ESPN'))):
            by_ev[ek] = (ts, name, g.get('src'), g.get('start'), g.get('teams'), g.get('state'), g.get('detail'), g.get('score'))
for row in pick_lists() + (emb.get('bets') or []) + (emb.get('buys') or []):
    consider(row)
def stamp(row, pack, via):
    ts, name, src, start, teams, state, detail, score = pack
    g = row.setdefault('game', {})
    if name and (not g.get('name') or ' vs ' not in str(g.get('name'))):
        g['name'] = name
    if teams and not g.get('teams'): g['teams'] = teams
    if ts and not row.get('startTs'):
        row['startTs'] = ts
        g['start'] = start or pt(ts)
        g['src'] = (src or '') + ' (' + via + ')'
    elif ts and (not g.get('src') or 'market date' in str(g.get('src')) or 'time not supplied' in str(g.get('start') or '')):
        row['startTs'] = ts
        g['start'] = start or pt(ts)
        g['src'] = (src or '') + ' (' + via + ')'
    if state: g['state'] = g.get('state') or state
    if detail: g['detail'] = g.get('detail') or detail
    if score: g['score'] = g.get('score') or score
for row in pick_lists() + (emb.get('bets') or []) + (emb.get('buys') or []):
    q = row.get('q') or ''
    ek = evkey(row.get('slug') or '')
    if q in by_q: stamp(row, by_q[q], 'same market')
    elif ek and ek in by_ev: stamp(row, by_ev[ek], 'same match')
# Rebuild Upcoming: unstarted $500+ whale picks starting within the next 24 hours, soonest first, up to 30
HORIZON = 24 * 3600
seen_u, upcoming = set(), []
def u_key(p): return p.get('id') or ((p.get('q') or '') + '|' + (p.get('label') or ''))
def u_ok(p):
    if has_started(p): return False
    if not (p.get('backers') or p.get('whales')): return False
    ts = p.get('startTs') or 0
    return bool(ts and NOW < ts <= NOW + HORIZON)
for p in emb['signals'] + emb['fun'] + emb['poly'] + emb['glue'] + emb['props'] + emb['longshots'] + emb['biggest'] + list(emb.get('upcoming') or []):
    k = u_key(p)
    if k in seen_u or not u_ok(p): continue
    seen_u.add(k); upcoming.append(p)
upcoming.sort(key=lambda p: (p.get('startTs') or 10**12, -(p.get('invested') or 0)))
emb['upcoming'] = upcoming[:30]
emb['totalUpcoming'] = len(upcoming)
# Ended games: W/L already written to the journal above; drop from every list including Bets/Buys.
# Started (live) games: drop from Top 20, Fun, Polymarket, Glue, Props, Longshots, Biggest Bets and Upcoming; keep on Bets with a Live tag.
ENDED = {p['id'].rsplit(':', 1)[0] for p in pick_lists() if (p.get('refresh') or {}).get('ended')}
before = (len(emb['signals']), len(emb['fun']), len(emb['poly']), len(emb.get('glue') or []), len(emb.get('props') or []), len(emb.get('longshots') or []), len(emb.get('biggest') or []), len(emb.get('upcoming') or []), len(emb['bets']), len(emb['buys']))
emb['signals'] = [p for p in emb['signals'] if not has_started(p)]
emb['fun'] = [p for p in emb['fun'] if not has_started(p)]
emb['poly'] = [p for p in emb['poly'] if not has_started(p)]
emb['glue'] = [p for p in emb['glue'] if not has_started(p)]
emb['props'] = [p for p in emb['props'] if not has_started(p)]
emb['longshots'] = [p for p in emb['longshots'] if not has_started(p)]
emb['biggest'] = [p for p in emb['biggest'] if not has_started(p)]
emb['upcoming'] = [p for p in emb['upcoming'] if not has_started(p) and (p.get('startTs') or 0) and NOW < p['startTs'] <= NOW + HORIZON]
emb['bets'] = [b for b in emb['bets'] if b.get('cid') not in ENDED and (b.get('game') or {}).get('state') != 'post']
emb['buys'] = [b for b in emb['buys'] if b.get('cid') not in ENDED and (b.get('game') or {}).get('state') != 'post']
removed = [a - len(x) for a, x in zip(before, (emb['signals'], emb['fun'], emb['poly'], emb['glue'], emb['props'], emb['longshots'], emb['biggest'], emb['upcoming'], emb['bets'], emb['buys']))]
known = {h['id'] for h in emb.get('history', [])}
for pid, hp in hist['picks'].items():
    if pid not in known and hp.get('ended'):
        emb.setdefault('history', []).append(dict(id=pid, **{kk: hp.get(kk) for kk in ('tier', 'q', 'label', 'score', 'whales', 'invested', 'start', 'kalshi', 'kprice', 'first_seen', 'last_seen', 'scans', 'result', 'graded')}))
for h in emb.get('history', []):
    hp = hist['picks'].get(h['id']) or {}
    if hp.get('result'): h['result'] = hp['result']; h['graded'] = hp.get('graded')
    if hp.get('ended'): h['active'] = False
emb['refreshedAt'] = pt(NOW); emb['refreshTs'] = NOW
emb.setdefault('refreshes', []).append(dict(ts=NOW, espnGames=n_espn, kalshiChecks=n_k, timesFilled=n_filled, removedStartedOrEnded=removed))
json.dump(hist, open(HP, 'w'), indent=1)
import capper_history as _ch
_ch_store = _ch.update_store(emb, hist)
emb['capperHistory'] = _ch.page_payload(emb, hist, _ch_store)
json.dump(emb, open(os.path.join(HERE, 'page_embed.json'), 'w'), separators=(',', ':'))
subprocess.run([sys.executable, os.path.join(HERE, 'compact.py')])
print(f"refreshed {pt(NOW)}: {len(emb['signals'])} top + {len(emb['fun'])} fun + {len(emb['poly'])} poly + {len(emb.get('glue') or [])} glue + {len(emb.get('props') or [])} props + {len(emb.get('longshots') or [])} longshots + {len(emb.get('biggest') or [])} biggest + {len(emb.get('upcoming') or [])} upcoming, ESPN games matched {n_espn}, times/opponents filled {n_filled}, Kalshi checks {n_k}, started/ended removed (top/fun/poly/glue/props/longshots/biggest/upcoming/bets/buys) {removed}, OrcaLayer calls 0")
