#!/usr/bin/env python3
"""Refresh the current picks WITHOUT calling OrcaLayer (saves usage).
ESPN: live status/score, final result, and ESPN's win probability (live) or matchup predictor (pre-game) per pick.
Kalshi: one public price check per pick's matched contract. Marks W/L in history.json, then rewrites page_embed.json -> page_data_line.txt.
Usage: python3 refresh.py"""
import json, os, re, sys, time, subprocess, urllib.request, datetime as dt
HERE = os.path.dirname(os.path.abspath(__file__))
PT = dt.timezone(dt.timedelta(hours=-8)); NOW = int(time.time())
def pt(ts): return dt.datetime.fromtimestamp(ts, PT).strftime('%a %b %-d, %-I:%M %p PT')
def pub(url):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'orca-scanner/1.0'}), timeout=20) as r: return json.load(r)
        except Exception: time.sleep(1 + i)
    return None
EP = {'NBA': 'basketball/nba', 'NFL': 'football/nfl', 'NHL': 'hockey/nhl', 'MLB': 'baseball/mlb', 'CFB': 'football/college-football', 'CBB': 'basketball/mens-college-basketball',
      'CWBB': 'basketball/womens-college-basketball', 'WNBA': 'basketball/wnba', 'EPL': 'soccer/eng.1', 'UCL': 'soccer/uefa.champions', 'UEL': 'soccer/uefa.europa', 'UECL': 'soccer/uefa.europa.conf',
      'LAL': 'soccer/esp.1', 'BUN': 'soccer/ger.1', 'BL2': 'soccer/ger.2', 'SEA': 'soccer/ita.1', 'ITB': 'soccer/ita.2', 'FL1': 'soccer/fra.1', 'FL2': 'soccer/fra.2',
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
      'CFL': 'football/cfl'}
def norm(x): return re.sub(r'[^a-z0-9 ]', '', (x or '').lower()).strip()
def teams_of(q):
    for part in (re.sub(r'^[^:]*:\s*', '', q), re.sub(r':.*$', '', q)):
        part = re.sub(r'\s*\(BO\d\).*$|\s+-\s+.*$', '', part)
        if re.search(r'\svs\.?\s', part): return [t.strip() for t in re.split(r'\s+vs\.?\s+', part)]
    m = re.match(r'Will (.+?) win', q or '')
    return [m.group(1)] if m else []
def hit(name, comp):
    n = norm(name); words = n.split()
    blob = norm(' '.join([comp['team'].get(k, '') for k in ('displayName', 'shortDisplayName', 'abbreviation', 'name', 'location')]) if 'team' in comp else (comp.get('athlete') or {}).get('displayName', ''))
    return bool(words) and (n in blob or words[-1] in blob.split())
SB = {}
def sc(c):
    v = c.get('score')
    if isinstance(v, dict): v = v.get('displayValue')
    if v is None and c.get('linescores'): v = ' '.join(str(int(x.get('value', 0))) for x in c['linescores'])
    return v or ''
def find_game(p):
    lg = p['league']
    if lg not in EP: return None, 'no feed for ' + lg
    names = teams_of(p['q'])
    if not names: return None, 'no team names to match'
    d0 = dt.datetime.fromtimestamp(p.get('startTs') or NOW, dt.timezone(dt.timedelta(hours=-5))).date()
    for d in (d0, d0 - dt.timedelta(days=1), d0 + dt.timedelta(days=1)):
        k = (lg, d)
        if k not in SB:
            extra = '&groups=50&limit=400' if lg == 'CBB' else ''
            evs = (pub(f"https://site.api.espn.com/apis/site/v2/sports/{EP[lg]}/scoreboard?dates={d.strftime('%Y%m%d')}{extra}") or {}).get('events', [])
            flat = []
            for e in evs:  # tennis/MMA nest matches under groupings
                comps = e.get('competitions') or [c for g in e.get('groupings', []) for c in g.get('competitions', [])]
                for c in comps:
                    flat.append(dict(id=c.get('id') or e.get('id'), status=c.get('status') or e.get('status') or {'type': {}}, competitions=[c], shortName=e.get('shortName') or e.get('name'), nested=not e.get('competitions')))
            SB[k] = flat
        for e in SB[k]:
            comp = e['competitions'][0]; cs = comp.get('competitors', [])
            if sum(any(hit(n, c) for c in cs) for n in names) >= min(2, len(names)): return e, None
    return None, 'game not on the scoreboard yet'
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
def kalshi_now(tk):
    if not tk: return None
    m = (pub(f"https://api.elections.kalshi.com/trade-api/v2/markets/{tk}") or {}).get('market') or {}
    try: return dict(yes=float(m.get('yes_ask_dollars')), no=float(m.get('no_ask_dollars')), status=m.get('status'), result=m.get('result'))
    except Exception: return None
emb = json.load(open(os.path.join(HERE, 'page_embed.json')))
HP = os.path.join(HERE, 'history.json'); hist = json.load(open(HP)) if os.path.exists(HP) else {'scans': [], 'picks': {}}
n_espn = n_k = 0
emb.setdefault('poly', [])
emb.setdefault('glue', [])
emb.setdefault('props', [])
emb.setdefault('longshots', [])
emb.setdefault('biggest', [])
def pick_lists(): return emb['signals'] + emb['fun'] + emb['poly'] + emb['glue'] + emb['props'] + emb['longshots'] + emb['biggest']
def pick_tier(p):
    if p in emb['longshots']: return 'longshots'
    if p in emb['props']: return 'props'
    if p in emb['poly']: return 'poly'
    if p in emb['fun']: return 'fun'
    if p in emb['glue']: return 'glue'
    if p in emb['signals']: return 'top'
    if p in emb['biggest']: return 'biggest'
    return 'top'
def has_started(p):
    r = p.get('refresh') or {}
    g = p.get('game') or {}
    if r.get('state') in ('in', 'post') or g.get('state') in ('in', 'post'): return True
    if r.get('ended') or r.get('final'): return True
    ts = p.get('startTs')
    if ts and ts <= NOW: return True
    return False
for p in pick_lists():
    e, why = find_game(p)
    r = dict(at=NOW)
    if e:
        comp = e['competitions'][0]; st = e['status']['type']; cs = comp['competitors']
        pick_name = p['label']
        pc = next((c for c in cs if hit(pick_name, c)), None)
        r.update(state=st.get('state'), detail=st.get('shortDetail'), score=' – '.join(f"{(c.get('team') or {}).get('abbreviation') or (c.get('athlete') or {}).get('shortName') or (c.get('athlete') or {}).get('displayName', '')} {sc(c)}" for c in cs) if st.get('state') != 'pre' else '')
        p['game'].update(state=r['state'], detail=r['detail'], score=r['score'], name=e.get('shortName'))
        n_espn += 1
        if pc and st.get('state') != 'post':
            r['pct'], r['src'] = win_pct(p['league'], e, pc); r['team'] = pick_name
        if st.get('state') == 'post' and pc is not None:
            r['final'] = 'W' if pc.get('winner') else ('L' if any(c.get('winner') for c in cs) else 'push')
    else:
        r['why'] = why
    k = p.get('kalshi') or {}
    if k.get('status') == 'ok' and k.get('ticker'):
        kn = kalshi_now(k['ticker']); n_k += 1
        if kn:
            r['kNow'] = kn['yes'] if (k.get('action') or '').endswith('YES') else kn['no']
            if kn.get('status') in ('closed', 'settled', 'finalized', 'determined'): r['ended'] = True
            if kn.get('result') in ('yes', 'no') and 'final' not in r:
                r['final'] = 'W' if kn['result'] == ('yes' if (k.get('action') or '').endswith('YES') else 'no') else 'L'
    if r.get('state') == 'post' or r.get('final'): r['ended'] = True
    p['refresh'] = r
    h = hist['picks'].get(p['id'])
    if h is None:  # make sure every pick is in the journal before it can be removed
        h = hist['picks'][p['id']] = dict(q=p['q'], label=p['label'], side=p['id'].split(':')[-1], score=p.get('score'), whales=p.get('whales'), invested=p.get('invested'),
                                          start=p['game'].get('start'), kalshi=f"{k.get('action')} {k.get('contract')} @ {round(100*k['price'])}¢" if k.get('price') else ('Polymarket only' if pick_tier(p) == 'poly' else 'No Kalshi match'),
                                          kprice=k.get('price'), first_seen=emb.get('ts'), last_seen=emb.get('ts'), scans=1, result=None, tier=pick_tier(p))
    if r.get('final') in ('W', 'L') and not h.get('result'): h['result'] = r['final']; h['graded'] = NOW
    if r.get('ended'): h['ended'] = NOW; h['finalScore'] = r.get('score') or ''; h['active'] = False
# Ended games: W/L already written to the journal above; drop from every list including Bets/Buys.
# Started (live) games: drop from Top 20, Fun, Polymarket, Glue, Props, Longshots and Biggest Bets; keep on Bets with a Live tag.
ENDED = {p['id'].rsplit(':', 1)[0] for p in pick_lists() if (p.get('refresh') or {}).get('ended')}
before = (len(emb['signals']), len(emb['fun']), len(emb['poly']), len(emb.get('glue') or []), len(emb.get('props') or []), len(emb.get('longshots') or []), len(emb.get('biggest') or []), len(emb['bets']), len(emb['buys']))
emb['signals'] = [p for p in emb['signals'] if not has_started(p)]
emb['fun'] = [p for p in emb['fun'] if not has_started(p)]
emb['poly'] = [p for p in emb['poly'] if not has_started(p)]
emb['glue'] = [p for p in emb['glue'] if not has_started(p)]
emb['props'] = [p for p in emb['props'] if not has_started(p)]
emb['longshots'] = [p for p in emb['longshots'] if not has_started(p)]
emb['biggest'] = [p for p in emb['biggest'] if not has_started(p)]
emb['bets'] = [b for b in emb['bets'] if b.get('cid') not in ENDED and (b.get('game') or {}).get('state') != 'post']
emb['buys'] = [b for b in emb['buys'] if b.get('cid') not in ENDED and (b.get('game') or {}).get('state') != 'post']
removed = [a - len(x) for a, x in zip(before, (emb['signals'], emb['fun'], emb['poly'], emb['glue'], emb['props'], emb['longshots'], emb['biggest'], emb['bets'], emb['buys']))]
known = {h['id'] for h in emb.get('history', [])}
for pid, hp in hist['picks'].items():
    if pid not in known and hp.get('ended'):
        emb.setdefault('history', []).append(dict(id=pid, **{kk: hp.get(kk) for kk in ('tier', 'q', 'label', 'score', 'whales', 'invested', 'start', 'kalshi', 'kprice', 'first_seen', 'last_seen', 'scans', 'result', 'graded')}))
for h in emb.get('history', []):
    hp = hist['picks'].get(h['id']) or {}
    if hp.get('result'): h['result'] = hp['result']; h['graded'] = hp.get('graded')
    if hp.get('ended'): h['active'] = False
emb['refreshedAt'] = pt(NOW); emb['refreshTs'] = NOW
emb.setdefault('refreshes', []).append(dict(ts=NOW, espnGames=n_espn, kalshiChecks=n_k, removedStartedOrEnded=removed))
json.dump(hist, open(HP, 'w'), indent=1)
json.dump(emb, open(os.path.join(HERE, 'page_embed.json'), 'w'), separators=(',', ':'))
subprocess.run([sys.executable, os.path.join(HERE, 'compact.py')])
print(f"refreshed {pt(NOW)}: {len(emb['signals'])} top + {len(emb['fun'])} fun + {len(emb['poly'])} poly + {len(emb.get('glue') or [])} glue + {len(emb.get('props') or [])} props + {len(emb.get('longshots') or [])} longshots + {len(emb.get('biggest') or [])} biggest, ESPN games matched {n_espn}, Kalshi checks {n_k}, started/ended removed (top/fun/poly/glue/props/longshots/biggest/bets/buys) {removed}, OrcaLayer calls 0")
