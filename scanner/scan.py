#!/usr/bin/env python3
"""OrcaLayer whale scanner (snapshot). Whale data: OrcaLayer API only. Kalshi: contract match + price. ESPN: schedule/scores.
Usage: python3 scan.py [--cappers 100 (any positive integer)] [--min 500]
Whales = top N sports whales by 30-day P&L (OrcaLayer /api/v2/business/pnl-leaderboard?window=30), processed #1 first."""
import json, time, math, re, sys, os, argparse, urllib.request, collections, datetime as dt
from concurrent.futures import ThreadPoolExecutor
from orca import orca, CALLS
HERE = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser(); ap.add_argument('--cappers', type=int, default=100); ap.add_argument('--min', type=float, default=500)
ap.add_argument('--markets', type=int, default=60); ap.add_argument('--wallets', type=int, default=2); A = ap.parse_args()
if A.cappers < 1: sys.exit('--cappers must be a positive integer')  # presets 20/40/60/80/100 or any custom number; default 100
T0 = time.time(); NOW = int(T0)
PT = dt.timezone(dt.timedelta(hours=-8))
def pt(ts): return dt.datetime.fromtimestamp(ts, PT).strftime('%a %b %-d, %-I:%M %p PT')
ESPORTS = ('cs2', 'dota2', 'lol', 'val', 'r6siege', 'rl', 'cod', 'ow', 'mlbb', 'hok', 'kog', 'sc2', 'apex', 'pubg', 'fortnite')
def pub(url):
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'orca-scanner/1.0'}), timeout=30) as r: return json.load(r)
        except Exception: time.sleep(2 * (i + 1))
    return None
# ---------- 1. Whale universe: top N SPORTS whales ranked by 30-day P&L, processed in rank order (#1 first) ----------
# OrcaLayer GET /api/v2/business/pnl-leaderboard?window=30&order=desc (30 Polymarket days, realized P&L). Walk the list from rank 1 down;
# open positions are loaded 20 wallets at a time in that same order (POST /api/v2/wallets/positions), so the biggest whales are always covered first.
# A wallet counts as a sports whale when >= 50% of its open position cost is in SPORTS markets.
cappers, POS = {}, {}
LB30 = dict(endpoint='/api/v2/business/pnl-leaderboard', params='window=30, order=desc', asOf=None, start=None, end=None, scanned=0, skippedNonSports=0, skippedNoPositions=0, deepestRank=0, pendingRetried=0, unavailable=0)
def fetch_pos(ws, wait):
    d = orca('/api/v2/wallets/positions', body={'wallets': ws}, tries=2 if wait else 1, timeout=60, wait202=wait)
    if d is None or d.get('_pending'): return None
    return {(x.get('wallet') or '').lower(): ((x.get('data') or {}).get('positions') or []) for x in d.get('results', []) if x.get('status') == 'ok'}
CAND, PENDING = [], []
def classify(r, ps):
    LB30['scanned'] += 1
    ps = [p for p in ps if not p.get('closed')]
    tot = sum(p.get('cost') or p.get('initial_value') or 0 for p in ps)
    sp = sum(p.get('cost') or p.get('initial_value') or 0 for p in ps if p.get('category') == 'SPORTS')
    if not ps or tot <= 0: LB30['skippedNoPositions'] += 1; return
    if sp / tot < 0.5: LB30['skippedNonSports'] += 1; return
    CAND.append((r, ps, round(100 * sp / tot, 1)))
_off = 0
while len(CAND) < A.cappers and _off < 5000:
    d = orca('/api/v2/business/pnl-leaderboard', {'window': 30, 'order': 'desc', 'limit': 500, 'offset': _off})
    rows = sorted((d or {}).get('rows') or [], key=lambda r: r['rank'])
    if not rows: break
    if not LB30['asOf']: LB30.update(asOf=d.get('as_of'), start=d.get('window_start'), end=d.get('window_end'))
    _off += len(rows)
    for i in range(0, len(rows), 20):
        if len(CAND) >= A.cappers: break
        chunk = rows[i:i + 20]; LB30['deepestRank'] = chunk[-1]['rank']
        _t = time.time(); got = fetch_pos([r['wallet'] for r in chunk], False)
        if got is None: PENDING.append(chunk); print(f"  30d ranks {chunk[0]['rank']}-{chunk[-1]['rank']}: OrcaLayer still computing, will retry", flush=True); continue
        for r in chunk: classify(r, got.get(r['wallet'].lower(), []))
        print(f"  30d ranks {chunk[0]['rank']}-{chunk[-1]['rank']}: positions in {time.time()-_t:.0f}s, sports whales so far {len(CAND)}", flush=True)
    if len(rows) < 500: break
for chunk in PENDING:  # higher-ranked wallets that were still being computed: retry (waiting this time), split if needed
    LB30['pendingRetried'] += len(chunk)
    got = fetch_pos([r['wallet'] for r in chunk], True)
    if got is None:
        got = {}
        for j in range(0, len(chunk), 5):
            g2 = fetch_pos([r['wallet'] for r in chunk[j:j + 5]], True)
            if g2 is None: LB30['unavailable'] += len(chunk[j:j + 5])
            else: got.update(g2)
    for r in chunk:
        if r['wallet'].lower() in got: classify(r, got[r['wallet'].lower()])
    print(f"  retried 30d ranks {chunk[0]['rank']}-{chunk[-1]['rank']}: sports whales so far {len(CAND)}", flush=True)
CAND.sort(key=lambda c_: c_[0]['rank'])
for r, ps, spct in CAND[:A.cappers]:  # rank order: #1 of the 30-day leaderboard first
    w = r['wallet'].lower(); res = r.get('resolved_markets') or 0; won = r.get('resolved_won') or 0
    cappers[w] = dict(wallet=w, name=None, rank=len(cappers) + 1, rank30=r['rank'], total_pnl=r.get('pnl_usd'), total_volume=r.get('volume_usd'),
                      win_rate=round(100 * won / res, 1) if res else None, resolved_markets=res, wins=won, losses=res - won, sports_pct=spct, trades=r.get('trades'))
    POS[w] = ps
print(f"whales: {len(cappers)} sports whales from 30d ranks 1-{LB30['deepestRank']} (skipped {LB30['skippedNonSports']} non-sports, {LB30['skippedNoPositions']} with no open positions)")
def qualifies(c): return bool(c)  # only the top-N 30-day whales count
def golden(c): return bool(c) and ((c.get('rank') or 999) <= 10 or ((c.get('win_rate') or 0) >= 60 and (c.get('resolved_markets') or 0) >= 20))
def qual_h(wallet, wr=None, pnl=None, known=True): return (wallet or '').lower() in cappers
def gold_h(wallet, wr=None, pnl=None, skill=False): return golden(cappers.get((wallet or '').lower()))
def wname(w):
    c = cappers.get((w or '').lower()) or {}
    return c.get('name') or ((w or '')[:6] + '…' + (w or '')[-4:])

# ---------- 2. Markets: OrcaLayer search (sports, 2+ whales, ending within 3 days) ----------
mk = []
for off in range(0, 500, 100):
    d = orca('/api/v2/markets/search', {'category': 'SPORTS', 'min_whales': 2, 'max_days': 3, 'limit': 100, 'offset': off})
    if not d: break
    mk += d['markets']
    if len(d['markets']) < 100: break
found_markets = len(mk); MK_ALL = {m['id']: m for m in mk}
def ets(x): return dt.datetime.fromisoformat(x.replace(' ', 'T').replace('Z', '+00:00')).timestamp()
WIN_END = NOW + 12 * 3600; WIN_START = NOW - 5 * 3600
mk = [m for m in mk if re.search(r'-20\d\d-\d\d-\d\d', m['slug']) and WIN_START <= ets(m['end_date']) <= WIN_END]
in_window = len(mk)

# ---------- 3. Parse market type / sides ----------
def parse(m):
    slug, q = m['slug'], m['question']
    mm = re.match(r'([a-z0-9]+)-(.+?)-(20\d\d-\d\d-\d\d)(?:-(.*))?$', slug)
    league, mid, date, tail = mm.group(1), mm.group(2), mm.group(3), (mm.group(4) or '')
    codes = mid.split('-')
    info = dict(league=league, codes=codes, date=date, tail=tail, kind='other')
    _parts = [re.sub(r'^[^:]*:\s*', '', q), re.sub(r':.*$', '', q)] if league in ESPORTS else [re.sub(r':.*$', '', q), re.sub(r'^[^:]*:\s*', '', q)]
    base = next((p_ for p_ in _parts if re.search(r'\svs\.?\s', p_)), _parts[0])
    base = re.sub(r'\s*\(BO\d\).*$|\s+-\s+.*$', '', base)
    teams = [t.strip() for t in re.split(r'\s+vs\.?\s+', base)] if ' vs' in base else []
    info['teams'] = teams
    tm_ = re.fullmatch(r'total-(\d+(?:pt\d+)?)', tail)
    if tm_:
        info.update(kind='total', line=float(tm_.group(1).replace('pt', '.')), yes='OVER', no='UNDER')
    elif tail.startswith('total'):
        pass
    elif re.fullmatch(r'spread-(home|away)-\d+(pt\d+)?', tail):
        sm = re.match(r'Spread:\s*(.+?)\s*\((-?[\d.]+)\)', q)
        side = 'home' if 'home' in tail else 'away'
        fav = sm.group(1) if sm else '?'; line = abs(float(sm.group(2))) if sm else None
        info.update(kind='spread', line=line, fav=fav, favcode=codes[1] if side == 'home' and len(codes) > 1 else codes[0],
                    yes=f"{fav} -{line:g}", no=f"{fav} +{line:g} or better for the other side")
        info['dogcode'] = codes[0] if info['favcode'] == codes[-1] else codes[-1]
    elif tail == '' and len(teams) == 2:
        info.update(kind='moneyline', yes=teams[0], no=teams[1])
    elif tail == 'draw':
        info.update(kind='draw', yes='DRAW', no='NO DRAW')
    elif re.fullmatch(r'[a-z0-9]+', tail or '') and q.lower().startswith('will '):
        tm = re.match(r'Will (.+?) win', q); info.update(kind='teamwin', team=tm.group(1) if tm else tail, code=tail,
                                                          yes=(tm.group(1) if tm else tail) + ' WIN', no=(tm.group(1) if tm else tail) + ' NOT TO WIN')
    if 'yes' not in info and len(teams) == 2 and not q.lower().startswith('will '):
        info.update(yes=teams[0], no=teams[1])
    return info
# ---------- 8. Recent buys by OUR whales (OrcaLayer whale-alerts filtered to the top-N wallets, 24h, >= min) ----------
RAW_BUYS, RAW_ALL = [], []
_wl = list(cappers.keys())
for i in range(0, len(_wl), 50):
    ra = orca('/api/v2/whale-alerts', {'wallets': ','.join(_wl[i:i + 50]), 'minutes': 1440, 'min_usd': 50, 'limit': 500, 'category': 'SPORTS'})
    for r in (ra or {}).get('alerts', []):
        tr, wh, mkt = r.get('trade') or {}, r.get('whale') or {}, r.get('market') or {}
        w = (wh.get('wallet') or '').lower()
        if w not in cappers: continue
        if wh.get('name') and not cappers[w].get('name'): cappers[w]['name'] = wh['name']
        row = dict(ts=r['timestamp'], wallet=w, name=None, wr=cappers[w].get('win_rate'), wpnl=cappers[w].get('total_pnl'), action=(tr.get('action') or '').upper(),
                   side=(tr.get('side') or '').lower(), price=tr.get('price'), usd=round(tr.get('usd_amount') or 0), shares=tr.get('shares'),
                   pos=(tr.get('position_now') or {}), market_id=mkt.get('id'), condition_id=mkt.get('condition_id'), q=mkt.get('question'), slug=mkt.get('slug') or '', now=mkt.get('price_now'))
        RAW_ALL.append(row)
        if row['action'] == 'BUY' and row['usd'] >= A.min: RAW_BUYS.append(row)
for r in RAW_ALL: r['name'] = wname(r['wallet'])
FLOW = collections.defaultdict(lambda: [0.0, 0.0])
for r in RAW_ALL: FLOW[(r['wallet'], r['condition_id'], r['side'])][1 if r['action'] == 'SELL' else 0] += r['usd']

# ---------- 9. Kalshi: contract match + price only ----------
KSER = {'nba': ('KXNBAGAME', 'KXNBATOTAL', 'KXNBASPREAD'), 'nfl': ('KXNFLGAME', 'KXNFLTOTAL', 'KXNFLSPREAD'),
        'nhl': ('KXNHLGAME', 'KXNHLTOTAL', 'KXNHLSPREAD'), 'cfb': ('KXNCAAFGAME', 'KXNCAAFTOTAL', 'KXNCAAFSPREAD'),
        'cbb': ('KXNCAAMBGAME', 'KXNCAAMBTOTAL', 'KXNCAAMBSPREAD'), 'cwbb': ('KXNCAAWBGAME', 'KXNCAAWBTOTAL', 'KXNCAAWBSPREAD'),
        'epl': ('KXEPLGAME', 'KXEPLTOTAL', 'KXEPLSPREAD'),
        'ucl': ('KXUCLGAME', 'KXUCLTOTAL', 'KXUCLSPREAD'), 'uel': ('KXUELGAME', 'KXUELTOTAL', 'KXUELSPREAD'), 'uecl': ('KXUECLGAME', 'KXUECLTOTAL', 'KXUECLSPREAD'),
        'lal': ('KXLALIGAGAME', 'KXLALIGATOTAL', 'KXLALIGASPREAD'),
        'unl': ('KXUEFANLGAME', 'KXUEFANLTOTAL', 'KXUEFANLSPREAD'), 'fif': ('KXFIFAGAME', 'KXFIFATOTAL', 'KXFIFASPREAD'), 'ifr': ('KXINTLFRIENDLYGAME', None, None),
        'cdr': ('KXCOPADELREYGAME', 'KXCOPADELREYTOTAL', 'KXCOPADELREYSPREAD'), 'uwcl': ('KXUCLWGAME', None, None),
        'bun': ('KXBUNDESLIGAGAME', 'KXBUNDESLIGATOTAL', 'KXBUNDESLIGASPREAD'), 'bl2': ('KXBUNDESLIGA2GAME', 'KXBUNDESLIGA2TOTAL', 'KXBUNDESLIGA2SPREAD'),
        'sea': ('KXSERIEAGAME', 'KXSERIEATOTAL', 'KXSERIEASPREAD'), 'itb': ('KXSERIEBGAME', 'KXSERIEBTOTAL', 'KXSERIEBSPREAD'),
        'fl1': ('KXLIGUE1GAME', 'KXLIGUE1TOTAL', 'KXLIGUE1SPREAD'), 'fl2': ('KXLIGUE2GAME', 'KXLIGUE2TOTAL', 'KXLIGUE2SPREAD'),
        'ere': ('KXEREDIVISIEGAME', 'KXEREDIVISIETOTAL', 'KXEREDIVISIESPREAD'), 'por': ('KXLIGAPORTUGALGAME', 'KXLIGAPORTUGALTOTAL', 'KXLIGAPORTUGALSPREAD'),
        'mex': ('KXLIGAMXGAME', 'KXLIGAMXTOTAL', 'KXLIGAMXSPREAD'), 'bra': ('KXBRASILEIROGAME', 'KXBRASILEIROTOTAL', 'KXBRASILEIROSPREAD'),
        'arg': ('KXARGPREMDIVGAME', 'KXARGPREMDIVTOTAL', 'KXARGPREMDIVSPREAD'), 'spl': ('KXSAUDIPLGAME', 'KXSAUDIPLTOTAL', 'KXSAUDIPLSPREAD'),
        'efl': ('KXEFLCHAMPIONSHIPGAME', 'KXEFLCHAMPIONSHIPTOTAL', 'KXEFLCHAMPIONSHIPSPREAD'), 'elc': ('KXEFLCHAMPIONSHIPGAME', 'KXEFLCHAMPIONSHIPTOTAL', 'KXEFLCHAMPIONSHIPSPREAD'),
        'efa': ('KXFACUPGAME', 'KXFACUPTOTAL', 'KXFACUPSPREAD'), 'facup': ('KXFACUPGAME', 'KXFACUPTOTAL', 'KXFACUPSPREAD'),
        'lcup': ('KXEFLCUPGAME', 'KXEFLCUPTOTAL', 'KXEFLCUPSPREAD'), 'tur': ('KXSUPERLIGGAME', 'KXSUPERLIGTOTAL', 'KXSUPERLIGSPREAD'),
        'sco': ('KXSCOTTISHPREMGAME', 'KXSCOTTISHPREMTOTAL', 'KXSCOTTISHPREMSPREAD'), 'bel': ('KXBELGIANPLGAME', 'KXBELGIANPLTOTAL', 'KXBELGIANPLSPREAD'),
        'den': ('KXDENSUPERLIGAGAME', 'KXDENSUPERLIGATOTAL', 'KXDENSUPERLIGASPREAD'), 'nor': ('KXELITESERIENGAME', 'KXELITESERIENTOTAL', 'KXELITESERIENSPREAD'),
        'swe': ('KXALLSVENSKANGAME', 'KXALLSVENSKANTOTAL', 'KXALLSVENSKANSPREAD'), 'jap': ('KXJLEAGUEGAME', 'KXJLEAGUETOTAL', 'KXJLEAGUESPREAD'),
        'kor': ('KXKLEAGUEGAME', 'KXKLEAGUETOTAL', 'KXKLEAGUESPREAD'), 'aus': ('KXALEAGUEGAME', 'KXALEAGUETOTAL', 'KXALEAGUESPREAD'),
        'lib': ('KXCONMEBOLLIBGAME', 'KXCONMEBOLLIBTOTAL', 'KXCONMEBOLLIBSPREAD'), 'sud': ('KXCONMEBOLSUDGAME', 'KXCONMEBOLSUDTOTAL', 'KXCONMEBOLSUDSPREAD'),
        'cof': ('KXCOUPEDEFRANCEGAME', 'KXCOUPEDEFRANCETOTAL', 'KXCOUPEDEFRANCESPREAD'), 'dfb': ('KXDFBPOKALGAME', 'KXDFBPOKALTOTAL', 'KXDFBPOKALSPREAD'),
        'itc': ('KXCOPPAITALIAGAME', 'KXCOPPAITALIATOTAL', 'KXCOPPAITALIASPREAD'), 'nwsl': ('KXNWSLGAME', 'KXNWSLTOTAL', 'KXNWSLSPREAD'),
        'mls': ('KXMLSGAME', 'KXMLSTOTAL', 'KXMLSSPREAD'), 'wnba': ('KXWNBAGAME', 'KXWNBATOTAL', 'KXWNBASPREAD'), 'mlb': ('KXMLBGAME', 'KXMLBTOTAL', 'KXMLBSPREAD'),
        'kbo': ('KXKBOGAME', 'KXKBOTOTAL', 'KXKBOSPREAD'), 'npb': ('KXNPBGAME', 'KXNPBTOTAL', 'KXNPBSPREAD'), 'khl': ('KXKHLGAME', None, None), 'shl': ('KXSHLGAME', None, None), 'ahl': ('KXAHLGAME', None, None),
        'euroleague': ('KXEUROLEAGUEGAME', 'KXEUROLEAGUETOTAL', 'KXEUROLEAGUESPREAD'), 'euro': ('KXEUROLEAGUEGAME', 'KXEUROLEAGUETOTAL', 'KXEUROLEAGUESPREAD'),
        'acb': ('KXACBGAME', 'KXACBTOTAL', 'KXACBSPREAD'), 'nbl': ('KXNBLGAME', 'KXNBLTOTAL', 'KXNBLSPREAD'), 'cba': ('KXCBAGAME', 'KXCBATOTAL', 'KXCBASPREAD'),
        'atp': ('KXATPMATCH', None, None), 'wta': ('KXWTAMATCH', None, None), 'ufc': ('KXUFCFIGHT', None, None), 'mma': ('KXMMAFIGHT', None, None), 'box': ('KXBOXINGFIGHT', None, None),
        'cs2': ('KXCS2GAME', None, None), 'dota2': ('KXDOTA2GAME', None, None), 'lol': ('KXLOLGAME', None, None), 'val': ('KXVALORANTGAME', None, None),
        'r6siege': ('KXR6GAME', None, None), 'cod': ('KXCODGAME', None, None), 'ow': ('KXOWGAME', None, None), 'rl': ('KXROCKETLEAGUEGAME', None, None),
        'cricipl': ('KXIPLGAME', None, None), 'afl': ('KXAFLGAME', None, None), 'cfl': ('KXCFLGAME', 'KXCFLTOTAL', 'KXCFLSPREAD'), 'nrl': ('KXRUGBYNRLMATCH', None, None),
        # golf / racing / darts: verified series (open or real past tickers). Player/driver markets use NAME_ONLY.
        'pga': ('KXGOLFTOURN', None, None), 'golf': ('KXGOLFTOURN', None, None), 'lpga': ('KXLPGATOUR', None, None),
        'f1': ('KXF1H2H', None, None), 'nascar': ('KXNASCARRACE', None, None), 'indycar': ('KXINDYCARRACE', None, None), 'indy': ('KXINDYCARRACE', None, None),
        'darts': ('KXDARTSMATCH', None, None), 'motogp': ('KXMOTOGPRACE', None, None)}
# tennis / MMA / boxing: Kalshi lists both singles and fights under one series; extra series tried in order when the first has no event
# F1: H2H first for two-driver markets; KXF1RACE (multi-runner) is only used for "will X win" teamwin
KALT = {'atp': ('KXATPCHALLENGERMATCH',), 'wta': ('KXWTACHALLENGERMATCH',), 'ufc': ('KXMMAFIGHT',), 'cs2': ('KXCSGOGAME',), 'lol': ('KXLOLLONGGAME', 'KXLOLSHORTGAME'), 'rl': ('KXRLGAME',),
        'f1': ('KXF1RACE',), 'pga': ('KXGOLFTOURN',), 'golf': ('KXGOLFTOURN',), 'lpga': ('KXLPGATOUR',)}
NAME_ONLY = ('atp', 'wta', 'ufc', 'mma', 'box', 'pga', 'golf', 'lpga', 'f1', 'nascar', 'indycar', 'indy', 'darts', 'motogp')  # player/fighter/driver markets: match by name, not slug code
KM = {}
def kmarkets(series):
    if not series: return []
    if series not in KM:
        out, cur = [], None
        for _ in range(5):
            d = pub(f"https://api.elections.kalshi.com/trade-api/v2/markets?series_ticker={series}&status=open&limit=1000" + (f"&cursor={cur}" if cur else ''))
            if not d: break
            out += d.get('markets', []); cur = d.get('cursor')
            if not cur: break
        KM[series] = out
    return KM[series]
MON = {m: i + 1 for i, m in enumerate(['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'])}
def kdate(evt):
    mm = re.search(r'-(\d\d)([A-Z]{3})(\d\d)', evt)
    return dt.date(2000 + int(mm.group(1)), MON[mm.group(2)], int(mm.group(3))) if mm else None
def occ_date(ms):
    for m in ms:
        occ = m.get('occurrence_datetime')
        if not occ: continue
        try: return dt.datetime.fromisoformat(occ.replace('Z', '+00:00')).date()
        except Exception: pass
    return None
def find_event(series, info, kind=None):
    if not series: return None
    pd = dt.date.fromisoformat(info['date']); codes = [c.upper() for c in info['codes']]
    ev = collections.defaultdict(list)
    for m in kmarkets(series): ev[m['event_ticker']].append(m)
    best = None
    names = list(info.get('teams') or [])
    if info.get('team') and info['team'] not in names: names.append(info['team'])
    kind = kind or info.get('kind')
    esp = info['league'] in ESPORTS or info['league'] in NAME_ONLY
    window = 4 if esp else 1  # golf tournaments / race weekends can span a few days vs the Polymarket slug date
    for e, ms in ev.items():
        kd = kdate(e) or occ_date(ms)
        if not kd or abs((kd - pd).days) > window: continue
        # Two-player moneyline (X vs Y) must not match a multi-runner field (F1 race with 20 drivers, golf tournament, etc.)
        if kind == 'moneyline' and esp and len(ms) > 3: continue
        teampart = e.split('-')[1][7:] if len(e.split('-')) > 1 and len(e.split('-')[1]) > 7 else ''
        hits = 0 if esp else sum(1 for c in codes if teampart.startswith(c) or teampart.endswith(c) or any(m['ticker'].endswith('-' + c) for m in ms))
        if not hits and names:
            subs = [norm(m.get('yes_sub_title') or '') for m in ms]
            hits = sum(1 for t in names if any(namematch(t, x) for x in subs))
            need = 2 if len(info.get('teams') or []) >= 2 else 1
            if hits < need: hits = 0
        if hits and (not best or hits > best[0]): best = (hits, e, ms)
    return best
def norm(x): return re.sub(r'[^a-z0-9 ]', '', (x or '').lower()).strip()
def namematch(a, b):
    a, b = norm(a), norm(b)
    return bool(a and b) and (a == b or a.startswith(b) or b.startswith(a) or (len(b) > 3 and b in a) or (len(a) > 3 and a in b))
def suffix(m): return m['ticker'].rsplit('-', 1)[1]
def fp(x):
    try: return float(x)
    except Exception: return None
def kalshi(s):
    info = s['info']; ser = KSER.get(info['league'])
    if not ser: return dict(status='none', why=f"Kalshi doesn't list {info['league'].upper()}")
    gm, tot, spr = ser
    if info['kind'] in ('moneyline', 'teamwin', 'draw'):
        ev = find_event(gm, info, info['kind'])
        for alt in KALT.get(info['league'], ()):
            if ev: break
            ev = find_event(alt, info, info['kind'])
        if not ev: return dict(status='none', why='No open Kalshi game market found for this matchup')
        hits, e, ms = ev
        codes = [c.upper() for c in info['codes']]
        def mfor(code):
            for m in ms:
                if suffix(m) == code: return m
            return None
        if info['kind'] == 'moneyline':
            yes_code, no_code = codes[0], codes[-1]
            m_yes, m_no = mfor(yes_code), mfor(no_code)
            if info['league'] in ESPORTS or info['league'] in NAME_ONLY: m_yes = m_no = None
            if hits == 1 and len(ms) >= 2 and info['league'] not in ESPORTS and info['league'] not in NAME_ONLY:
                if m_yes and not m_no: m_no = next((m for m in ms if m is not m_yes and suffix(m) != 'TIE'), None)
                if m_no and not m_yes: m_yes = next((m for m in ms if m is not m_no and suffix(m) != 'TIE'), None)
            if not (m_yes and m_no) and len(info.get('teams', [])) == 2:
                byname = lambda t: next((m for m in ms if namematch(t, m.get('yes_sub_title'))), None)
                m_yes = m_yes or byname(info['teams'][0]); m_no = m_no or byname(info['teams'][1])
            target = m_yes if s['side'] == 'yes' else m_no
            if (info['league'] in ESPORTS or info['league'] in NAME_ONLY) and target and not namematch(info['teams'][0 if s['side'] == 'yes' else 1], target.get('yes_sub_title')): target = None
            if not target: return dict(status='none', why='Kalshi event found but team contract not matched')
            opts = [('BUY YES', target, fp(target['yes_ask_dollars']))]
            other = m_no if s['side'] == 'yes' else m_yes
            if other and len(ms) == 2: opts.append(('BUY NO', other, fp(other['no_ask_dollars'])))
            opts = [o for o in opts if o[2] and o[2] > 0]
            if not opts: return dict(status='none', why='Kalshi market matched but has no ask right now')
            act, m, p = min(opts, key=lambda o: o[2])
        elif info['kind'] == 'teamwin':
            m = mfor(info['code'].upper())
            if not m and info.get('team'):
                m = next((x for x in ms if namematch(info['team'], x.get('yes_sub_title'))), None)
            if not m: return dict(status='none', why='Kalshi event found but team contract not matched')
            act = 'BUY YES' if s['side'] == 'yes' else 'BUY NO'; p = fp(m['yes_ask_dollars' if act == 'BUY YES' else 'no_ask_dollars'])
        else:
            m = mfor('TIE')
            if not m: return dict(status='none', why='No Kalshi tie contract')
            act = 'BUY YES' if s['side'] == 'yes' else 'BUY NO'; p = fp(m['yes_ask_dollars' if act == 'BUY YES' else 'no_ask_dollars'])
    elif info['kind'] == 'total':
        ev = find_event(tot, info)
        if not ev: return dict(status='none', why='No open Kalshi total market for this game')
        ms = ev[2]; m = next((x for x in ms if fp(x.get('floor_strike')) == info['line']), None)
        if not m:
            lines = sorted(fp(x.get('floor_strike')) for x in ms if fp(x.get('floor_strike')) is not None)
            near = min(lines, key=lambda l: abs(l - info['line'])) if lines else None
            return dict(status='none', why=f"No Kalshi total at {info['line']:g}" + (f" (nearest {near:g})" if near is not None else ''))
        act = 'BUY YES' if s['side'] == 'yes' else 'BUY NO'; p = fp(m['yes_ask_dollars' if act == 'BUY YES' else 'no_ask_dollars'])
    elif info['kind'] == 'spread':
        ev = find_event(spr, info)
        if not ev: return dict(status='none', why='No open Kalshi spread market for this game')
        ms = ev[2]; fc = info['favcode'].upper()
        cand = [x for x in ms if fp(x.get('floor_strike')) == info['line'] and suffix(x).rstrip('0123456789') == fc]
        if not cand: return dict(status='none', why=f"No Kalshi line for {info['fav']} by over {info['line']:g}")
        m = cand[0]; act = 'BUY YES' if s['side'] == 'yes' else 'BUY NO'; p = fp(m['yes_ask_dollars' if act == 'BUY YES' else 'no_ask_dollars'])
    else:
        return dict(status='none', why='Market type has no Kalshi equivalent')
    if not p: return dict(status='none', why='Kalshi market matched but has no ask right now')
    rule = m.get('rules_primary') or ''
    sel = m.get('yes_sub_title') or ''
    edge = round((s['avg_entry'] - p) * 100, 1) if s['avg_entry'] else None
    return dict(status='ok', occ=m.get('occurrence_datetime'), action=act, price=p, ticker=m['ticker'], contract=sel, rule=rule[:260], url=f"https://kalshi.com/markets/{m['event_ticker'].split('-')[0].lower()}",
                edge_vs_whales=edge, edge_vs_poly=round((s['price'] - p) * 100, 1),
                light='green' if edge is not None and edge >= 0 else ('yellow' if edge is not None and edge >= -5 else 'red'))

# ---------- 10. ESPN schedule / scores ----------
EP = {'nba': 'basketball/nba', 'nfl': 'football/nfl', 'nhl': 'hockey/nhl', 'mlb': 'baseball/mlb', 'cfb': 'football/college-football',
      'cbb': 'basketball/mens-college-basketball', 'cwbb': 'basketball/womens-college-basketball', 'wnba': 'basketball/wnba',
      'epl': 'soccer/eng.1', 'ucl': 'soccer/uefa.champions', 'uel': 'soccer/uefa.europa', 'uecl': 'soccer/uefa.europa.conf',
      'lal': 'soccer/esp.1', 'bun': 'soccer/ger.1', 'bl2': 'soccer/ger.2', 'sea': 'soccer/ita.1', 'itb': 'soccer/ita.2',
      'fl1': 'soccer/fra.1', 'fl2': 'soccer/fra.2', 'ere': 'soccer/ned.1', 'por': 'soccer/por.1', 'mex': 'soccer/mex.1',
      'bra': 'soccer/bra.1', 'arg': 'soccer/arg.1', 'mls': 'soccer/usa.1', 'unl': 'soccer/uefa.nations', 'uwcl': 'soccer/uefa.wchampions',
      'cdr': 'soccer/esp.copa_del_rey', 'fif': 'soccer/fifa.friendly', 'efl': 'soccer/eng.2', 'elc': 'soccer/eng.2',
      'efa': 'soccer/eng.fa', 'facup': 'soccer/eng.fa', 'lcup': 'soccer/eng.league_cup', 'tur': 'soccer/tur.1', 'sco': 'soccer/sco.1',
      'bel': 'soccer/bel.1', 'den': 'soccer/den.1', 'nor': 'soccer/nor.1', 'swe': 'soccer/swe.1', 'jap': 'soccer/jpn.1', 'aus': 'soccer/aus.1',
      'lib': 'soccer/conmebol.libertadores', 'sud': 'soccer/conmebol.sudamericana', 'cof': 'soccer/fra.coupe_de_france',
      'dfb': 'soccer/ger.dfb_pokal', 'itc': 'soccer/ita.coppa_italia', 'nwsl': 'soccer/usa.nwsl', 'spl': 'soccer/ksa.1',
      'euroleague': 'basketball/euroleague', 'euro': 'basketball/euroleague',
      'atp': 'tennis/atp', 'wta': 'tennis/wta', 'ufc': 'mma/ufc',
      'pga': 'golf/pga', 'golf': 'golf/pga', 'lpga': 'golf/lpga',
      'f1': 'racing/f1', 'nascar': 'racing/nascar-premier', 'indycar': 'racing/irl', 'indy': 'racing/irl',
      'cfl': 'football/cfl'}
ESPN = {}
def espn(lg, date):
    k = (lg, date)
    if k not in ESPN:
        extra = '&groups=50&limit=400' if lg == 'cbb' else ('&groups=80&limit=300' if lg == 'cfb' else '')
        d = pub(f"https://site.api.espn.com/apis/site/v2/sports/{EP[lg]}/scoreboard?dates={date.replace('-', '')}{extra}") if lg in EP else None
        ESPN[k] = (d or {}).get('events', [])
    return ESPN[k]
def locate(info, end, kal):
    """Game start/status: ESPN scoreboard first, then Kalshi contract wording, then market close time."""
    names = info.get('teams') or ([info.get('team')] if info.get('team') else [])
    if names and info['league'] in EP:
        for date in (info['date'], (dt.date.fromisoformat(info['date']) - dt.timedelta(days=1)).isoformat()):
            for e in espn(info['league'], date):
                comp = e['competitions'][0]; tn = [norm(t['team'].get('displayName', '') + ' ' + t['team'].get('shortDisplayName', '') + ' ' + t['team'].get('abbreviation', '')) for t in comp['competitors']]
                hit = sum(any(norm(n).split()[-1] in t.split() for t in tn) for n in names if norm(n) and norm(n).split())
                if hit >= min(2, len(names)):
                    st = e['status']['type']; ts = dt.datetime.fromisoformat(e['date'].replace('Z', '+00:00')).timestamp()
                    return dict(name=e.get('shortName'), start=pt(ts), state=st.get('state'), detail=st.get('shortDetail'), src='ESPN',
                                score=' – '.join(f"{c['team']['abbreviation']} {c.get('score', '')}" for c in comp['competitors']) if st.get('state') != 'pre' else '',
                                venue=((comp.get('venue') or {}).get('fullName')),
                                records=[f"{c['team'].get('abbreviation')} " + ', '.join(r.get('summary', '') for r in (c.get('records') or [])[:1]) for c in comp['competitors'] if c.get('records')],
                                url=next((l.get('href') for l in e.get('links') or [] if 'gamecast' in (l.get('rel') or []) or 'summary' in (l.get('rel') or [])), None)), ts
    codes = [c_.lower() for c_ in info.get('codes') or [] if c_]
    if not names and len(codes) >= 2 and info['league'] in EP:
        for date in (info['date'], (dt.date.fromisoformat(info['date']) - dt.timedelta(days=1)).isoformat()):
            for e in espn(info['league'], date):
                comp = e['competitions'][0]; ab = [(t['team'].get('abbreviation') or '').lower() for t in comp['competitors']]
                if sum(1 for c_ in codes[:2] if any(a_ == c_ or a_.startswith(c_) or c_.startswith(a_) for a_ in ab if a_)) >= 2:
                    st = e['status']['type']; ts = dt.datetime.fromisoformat(e['date'].replace('Z', '+00:00')).timestamp()
                    return dict(name=e.get('shortName'), start=pt(ts), state=st.get('state'), detail=st.get('shortDetail'), src='ESPN',
                                score=' – '.join(f"{c['team']['abbreviation']} {c.get('score', '')}" for c in comp['competitors']) if st.get('state') != 'pre' else '',
                                venue=((comp.get('venue') or {}).get('fullName'))), ts
    occ = (kal or {}).get('occ'); rule = (kal or {}).get('rule') or ''; src = 'market close time'
    rm_ = re.search(r'scheduled for (\w{3}) (\d{1,2}), (\d{4}) at (\d{1,2}):(\d\d) (AM|PM) E[SD]T', rule)
    if rm_:
        hh = int(rm_.group(4)) % 12 + (12 if rm_.group(6) == 'PM' else 0); off = -4 if 'EDT' in rule else -5
        ts = dt.datetime(int(rm_.group(3)), MON[rm_.group(1).upper()], int(rm_.group(2)), hh, int(rm_.group(5)), tzinfo=dt.timezone(dt.timedelta(hours=off))).timestamp(); src = 'Kalshi contract rules'
    elif end: ts = ets(end)
    else: return dict(name=None, start=info['date'] + ' (time not supplied)', src='market date only', state=None, detail='', score=''), None
    return dict(name=None, start=pt(ts), src=src, state=None, detail='', score=''), ts
# ---------- 14. Whale open positions in the window (loaded in step 1) ----------
ET = dt.timezone(dt.timedelta(hours=-5))
D_LO = (dt.datetime.fromtimestamp(NOW, ET) - dt.timedelta(days=1)).date(); D_HI = dt.datetime.fromtimestamp(WIN_END, ET).date()
SLUG_RE = re.compile(r'^[a-z0-9]{2,8}-[a-z0-9-]+-20\d\d-\d\d-\d\d')
def slug_date(slug):
    m_ = re.search(r'-(20\d\d-\d\d-\d\d)', slug or '')
    try: return dt.date.fromisoformat(m_.group(1)) if m_ else None
    except Exception: return None
def bet_kind(info, q):
    k = info.get('kind')
    if k in ('moneyline', 'teamwin', 'draw'): return 'moneyline'
    if k in ('spread', 'total'): return k
    if re.search(r'(?i)spread|handicap', q): return 'spread'
    if re.search(r'(?i)o/u|over/under|total', q):
        return 'prop' if re.search(r'(?i)points|rebounds|assists|yards|goals scored by|strikeouts|hits|shots|kills|touchdowns', q) and ':' in q else 'total'
    if re.search(r'(?i)points|rebounds|assists|yards|strikeouts|touchdown|to score', q): return 'prop'
    return 'other'
KCACHE, LCACHE = {}, {}
def kal_for(info, side, avg, cp, key):
    if key not in KCACHE:
        try: KCACHE[key] = kalshi(dict(info=info, side=side, avg_entry=avg, price=cp or 0))
        except Exception as ex: KCACHE[key] = dict(status='none', why='Kalshi lookup failed')
    k = dict(KCACHE[key])
    if k.get('status') == 'ok' and avg: k['edge_vs_whales'] = round((avg - k['price']) * 100, 1); k['light'] = 'green' if k['edge_vs_whales'] >= 0 else ('yellow' if k['edge_vs_whales'] >= -5 else 'red')
    return k
def loc_for(info, end, kal, key):
    if key not in LCACHE:
        try: LCACHE[key] = locate(info, end, kal)
        except Exception: LCACHE[key] = (dict(name=None, start=info.get('date', ''), src='market date only', state=None, detail='', score=''), None)
    return LCACHE[key]
TODAY_ET = dt.datetime.fromtimestamp(NOW, dt.timezone(dt.timedelta(hours=-5))).date()
def in_win2(g, ts, sd=None):
    if g.get('state') == 'post': return False
    if g.get('state') == 'in': return True
    if ts is None: return bool(sd and sd >= TODAY_ET)
    return NOW - 3 * 3600 <= ts <= WIN_END
def phase(g, ts):
    if g.get('state') == 'in': return 'live'
    if ts and ts <= NOW: return 'live'
    return 'upcoming'
BETS, two_sided, TSTAT = [], 0, {}
for w, ps in POS.items():
    c = cappers.get(w) or {}
    sides = collections.defaultdict(set)
    for p in ps: sides[p.get('condition_id')].add(p.get('side'))
    st = TSTAT.setdefault(w, dict(loaded=len(ps), bets=0, value=0, hedged=0, small=0))
    for p in ps:
        slug = p.get('slug') or ''; sd = slug_date(slug)
        if not SLUG_RE.match(slug) or not sd or not (D_LO <= sd <= D_HI) or p.get('closed'): continue
        cp = p.get('current_price')
        if cp is None or cp >= 0.99 or cp <= 0.01: continue
        if len(sides[p.get('condition_id')]) > 1: two_sided += 1; st['hedged'] += 1; continue
        cost = p.get('initial_value') or p.get('buy_cost') or 0
        if cost < A.min: st['small'] += 1; continue
        try: info = parse(dict(slug=slug, question=p.get('question') or ''))
        except Exception: info = dict(league=slug.split('-')[0], codes=[], date=str(sd), tail='', kind='other', teams=[])
        side = 'yes' if p.get('side') == 'token1' else 'no'
        avg = p.get('avg_entry')
        key = (p.get('condition_id'), side)
        kal = kal_for(info, side, avg, cp, key)
        mrow = MK_ALL.get(str(p.get('market_id'))) or {}
        g, ts = loc_for(info, mrow.get('end_date'), kal, p.get('condition_id'))
        if not in_win2(g, ts, sd): continue
        st['bets'] += 1; st['value'] += p.get('current_value') or 0
        BETS.append(dict(wallet=w, name=wname(w), rank=c.get('rank'), rank30=c.get('rank30'), _info=info, lastTs=p.get('last_trade_ts'), wr=c.get('win_rate'), resolved=c.get('resolved_markets'), cpnl=round(c.get('total_pnl') or 0),
                         qualified=qualifies(c), golden=golden(c), skill=bool(c.get('skill_badge')),
                         q=p.get('question'), slug=slug, market_id=str(p.get('market_id')), cid=p.get('condition_id'), side=side,
                         label=info.get(side) or p.get('outcome'), outcome=p.get('outcome'), kind=bet_kind(info, p.get('question') or ''), league=info['league'].upper(),
                         shares=round(p.get('tokens') or 0, 1), avg=avg, now=cp, cost=round(cost), value=round(p.get('current_value') or 0), upnl=round(p.get('pnl') or 0), upct=p.get('pnl_pct'),
                         firstTs=p.get('first_trade_ts'), cons=(p.get('whale_consensus') or {}), top100=True, src='whale positions', kalshi=kal, game=g, startTs=int(ts) if ts else None, phase=phase(g, ts)))
# ---------- 15. Recent buys: qualified whales, game in window ----------
BUYS = []
for r in RAW_BUYS:
    sd = slug_date(r['slug'])
    if not sd or not (D_LO <= sd <= D_HI) or not r['side']: continue
    if (r['price'] or 0) > 0.95: continue
    if r['now'] is not None and (r['now'] >= 0.99 or r['now'] <= 0.01): continue  # market already decided
    if not qual_h(r['wallet'], r['wr'], r['wpnl']): continue
    oc = (r['pos'] or {}).get('other_side_cost') or 0; pc = (r['pos'] or {}).get('cost') or 0
    try: info = parse(dict(slug=r['slug'], question=r['q'] or ''))
    except Exception: info = dict(league=r['slug'].split('-')[0], codes=[], date=str(sd), tail='', kind='other', teams=[])
    kal = kal_for(info, r['side'], r['price'], r['now'], (r['condition_id'], r['side']))
    mrow = MK_ALL.get(str(r['market_id'])) or {}
    g, ts = loc_for(info, mrow.get('end_date'), kal, r['condition_id'])
    if not in_win2(g, ts, sd): continue
    c = cappers.get((r['wallet'] or '').lower())
    BUYS.append(dict(ts=r['ts'], wallet=r['wallet'], name=wname(r['wallet']), rank30=(c or {}).get('rank30'), wr=r['wr'], wpnl=round(r['wpnl'] or 0), top100=bool(c), rank=(c or {}).get('rank'),
                     golden=gold_h(r['wallet'], r['wr'], r['wpnl']), q=r['q'], slug=r['slug'], market_id=r['market_id'], cid=r['condition_id'], side=r['side'],
                     label=info.get(r['side']) or r['side'].upper(), kind=bet_kind(info, r['q'] or ''), league=info['league'].upper(), price=r['price'], now=r['now'],
                     usd=r['usd'], shares=round(r['shares'] or 0, 1), posCost=round(pc), hedged=bool(pc and oc > 0.25 * pc), kalshi=kal, game=g, startTs=int(ts) if ts else None, phase=phase(g, ts)))
# evidence score (his site's 100-point evidence rubric, OrcaLayer + Kalshi price only)
def evidence(row, last_ts, others_60, others_any):
    age = NOW - (last_ts or 0)
    rec = 25 if age <= 3600 else 20 if age <= 3 * 3600 else 15 if age <= 6 * 3600 else 10 if age <= 86400 else 0
    hist_ = 20 if row.get('golden') else (15 if row.get('qualified', True) else 0)
    agree = 20 if others_60 else (10 if others_any else 0)
    k = row['kalshi']; kq = 20 if k.get('status') == 'ok' else 0
    kp = 10 if k.get('status') == 'ok' and k.get('edge_vs_whales') is not None and k['edge_vs_whales'] >= 0 else 0
    return dict(score=rec + hist_ + agree + kq + kp, parts={'Recency': rec, 'Capper record': hist_, 'Independent agreement': agree, 'Kalshi quote': kq, 'Kalshi price vs capper': kp})
for b in BUYS:
    same = [x for x in BUYS if x['cid'] == b['cid'] and x['side'] == b['side'] and (x['wallet'] or '').lower() != (b['wallet'] or '').lower()]
    b['agree60'] = len({x['wallet'] for x in same if abs(x['ts'] - b['ts']) <= 3600}); b['agreeAll'] = len({x['wallet'] for x in same})
    b['qualified'] = True; b.update(evidence(b, b['ts'], b['agree60'], b['agreeAll']))
for b in BETS:
    same = [x for x in BETS if x['cid'] == b['cid'] and x['side'] == b['side'] and x['wallet'] != b['wallet']]
    near = [x for x in same if x['firstTs'] and b['firstTs'] and abs(x['firstTs'] - b['firstTs']) <= 3600]
    lb = max([x['ts'] for x in BUYS if (x['wallet'] or '').lower() == b['wallet'] and x['cid'] == b['cid']] + [b['firstTs'] or 0])
    b['lastBuyTs'] = lb or None; b['agree60'] = len(near); b['agreeAll'] = len(same)
    b.update(evidence(b, lb, len(near), len(same)))
BETS.sort(key=lambda x: (0 if x['phase'] == 'live' else 1, x['startTs'] or 9e12, -x['cost']))
_g = collections.OrderedDict()
for b in sorted(BUYS, key=lambda x: x['ts']):
    k_ = ((b['wallet'] or '').lower(), b['cid'], b['side'])
    if k_ not in _g: _g[k_] = dict(b, fills=1, firstTs=b['ts'], cost_px=b['usd'] * (b['price'] or 0))
    else:
        g_ = _g[k_]; g_['fills'] += 1; g_['usd'] += b['usd']; g_['shares'] = round((g_['shares'] or 0) + (b['shares'] or 0), 1); g_['cost_px'] += b['usd'] * (b['price'] or 0)
        g_['ts'] = b['ts']; g_['posCost'] = b['posCost']; g_['hedged'] = b['hedged']; g_['now'] = b['now']
        g_['agree60'] = max(g_['agree60'], b['agree60']); g_['score'] = max(g_['score'], b['score']); g_['parts'] = b['parts'] if b['score'] >= g_['score'] else g_['parts']
for g_ in _g.values():
    g_['price'] = round(g_.pop('cost_px') / g_['usd'], 3) if g_['usd'] else g_['price']
BUYS = sorted(_g.values(), key=lambda x: -x['ts'])
_two = collections.defaultdict(set)
for b in BUYS: _two[((b['wallet'] or '').lower(), b['cid'])].add(b['side'])
for b in BUYS:
    if len(_two[((b['wallet'] or '').lower(), b['cid'])]) > 1: b['hedged'] = True; b['twoSided'] = True
def evkey(slug): m_ = re.match(r'(.+?-20\d\d-\d\d-\d\d)', slug or ''); return m_.group(1) if m_ else slug
_ev = {}
_cand = [(r_['game'], r_['startTs'], r_['slug']) for r_ in BETS + BUYS if r_.get('startTs')]
for g_, t_, sl_ in sorted(_cand, key=lambda c_: 0 if c_[0].get('src') in ('ESPN', 'Kalshi contract rules') else 1):
    if 'same match' not in (g_.get('src') or ''): _ev.setdefault(evkey(sl_), (g_, t_))
for r_ in BETS + BUYS:
    if not r_.get('startTs') and evkey(r_['slug']) in _ev:
        g0, t0 = _ev[evkey(r_['slug'])]; r_['game'] = dict(g0, src=(g0.get('src') or '') + ' (same match)'); r_['startTs'] = t0
    elif r_.get('startTs') and r_['game'].get('src') == 'market close time' and evkey(r_['slug']) in _ev and _ev[evkey(r_['slug'])][0].get('src') in ('ESPN', 'Kalshi contract rules'):
        g0, t0 = _ev[evkey(r_['slug'])]; r_['game'] = dict(g0, src=(g0.get('src') or '') + ' (same match)'); r_['startTs'] = t0
    r_['phase'] = phase(r_['game'], r_.get('startTs'))
# ---------- 16. Picks: group the whales' open $500+ positions by market side ----------
# Rank (Noel): most proven $500+ whales first, then most money, then less money against, then better 30-day rank; score parts only break remaining ties.
# Kalshi tabs (Top 20, Fun): a pick must have a verified Kalshi contract. Top 20 needs 2+ whales; Fun needs 1+.
# Polymarket tab: the same rules ($500+, 12h window, no hedgers) but NO Kalshi contract. Never duplicates a Kalshi-tab pick.
def score(s):
    n = len(s['backers']); wr = (sum(b['wr'] or 0 for b in s['backers']) / n) if n else 0
    parts = {
        'Consensus': max(0, min(25, 10 + 5 * (n - 2))),
        'Capper record': round(max(0, min(25, (wr - 50) / 15 * 25)), 1),
        'Money': round(max(0, min(15, math.log10(max(s['invested'], 1) / 1000) / 2 * 15)), 1),
        'One-sided': round(max(0, 15 * s['invested'] / (s['invested'] + s['opp_money']) - min(5, 2.5 * s['opp_qualified'])), 1),
        'Golden': 0 if not s['golden'] else (6 if s['golden'] == 1 else 10),
        'Fresh money': round(10 * min(1, s['fresh24'] / max(s['invested'], 1)), 1) if s['fresh24'] > s['fresh24_opp'] else 0,
    }
    s['parts'] = parts; s['score'] = round(sum(parts.values()))
grp = collections.defaultdict(list)
for b in BETS: grp[(b['cid'], b['side'])].append(b)
def oside(x): return 'no' if x == 'yes' else 'yes'
signals = []
for (cid, side), bs in grp.items():
    b0 = bs[0]; opp = grp.get((cid, oside(side)), [])
    inv = sum(b['cost'] for b in bs); oppm = sum(b['cost'] for b in opp)
    avg = sum(b['cost'] * (b['avg'] or 0) for b in bs) / inv if inv else None
    f24 = sum(FLOW[(b['wallet'], cid, side)][0] for b in bs); f24o = sum(FLOW[(b['wallet'], cid, oside(side))][0] for b in opp)
    backers = [dict(wallet=b['wallet'], name=b['name'], cost=b['cost'], avg=b['avg'], wr=b['wr'], resolved=b['resolved'], pnl=b['cpnl'], rank=b['rank'], rank30=b.get('rank30'),
                    golden=b['golden'], skill=False, top100=True, first_ts=b['firstTs'], last_ts=b.get('lastTs'), trades=None,
                    buy24=round(FLOW[(b['wallet'], cid, side)][0]), sell24=round(FLOW[(b['wallet'], cid, side)][1]),
                    flow=('Buying more' if FLOW[(b['wallet'], cid, side)][0] > FLOW[(b['wallet'], cid, side)][1] else ('Trimming' if FLOW[(b['wallet'], cid, side)][1] > 0 else 'Holding'))) for b in sorted(bs, key=lambda x: (x.get('rank') or 999))]
    signals.append(dict(id=f"{cid}:{side}", market_id=b0['market_id'], condition_id=cid, question=b0['q'], slug=b0['slug'], side=side, label=b0['label'], info=b0['_info'],
        price=b0['now'], backers=backers, opposing=[dict(name=o['name'], wallet=o['wallet'], cost=o['cost'], avg=o['avg'], wr=o['wr'], qualified=True, golden=o['golden'], rank=o['rank'], rank30=(cappers.get(o['wallet']) or {}).get('rank30')) for o in opp],
        invested=inv, avg_entry=avg, opp_money=oppm, opp_count=len(opp), opp_qualified=len(opp), golden=sum(b['golden'] for b in bs), net=inv - oppm,
        fresh24=round(f24), fresh24_opp=round(f24o), side_total_all=None, side_count_all=None, opp_total_all=None, opp_count_all=None, hedge_all=None,
        kalshi=b0['kalshi'], game=b0['game'], start_ts=b0['startTs'], risks=[]))
for s in signals:
    if s['kalshi'].get('status') == 'ok' and s['avg_entry']:
        s['kalshi'] = dict(s['kalshi'], edge_vs_whales=round((s['avg_entry'] - s['kalshi']['price']) * 100, 1)); e_ = s['kalshi']['edge_vs_whales']
        s['kalshi']['light'] = 'green' if e_ >= 0 else ('yellow' if e_ >= -5 else 'red')
    score(s)
def best_rank(s):
    return min((b.get('rank30') or b.get('rank') or 999) for b in s['backers']) if s['backers'] else 999
def rank_key(s): return (-len(s['backers']), -s['invested'], s['opp_money'], best_rank(s), -s['score'])
signals.sort(key=rank_key)
ONK = [s for s in signals if s['kalshi'].get('status') == 'ok']
OFFK = [s for s in signals if s['kalshi'].get('status') != 'ok']
# market detail (crowd size: all wallets any size, total $ per side) for the pick candidates only
for s in ONK[:30]:
    d = orca('/api/v2/market/' + s['market_id'])
    if not d: continue
    sd, od = s['side'], oside(s['side'])
    s.update(side_count_all=d.get(f'{sd}_team_net_total_count'), side_total_all=round(d.get(f'{sd}_team_net_total_invested') or 0),
             opp_count_all=d.get(f'{od}_team_net_total_count'), opp_total_all=round(d.get(f'{od}_team_net_total_invested') or 0),
             hedge_all=round(((d.get('hedge') or {}).get('all') or {}).get('hedged_total') or 0))
    for key in (f'{sd}_team_net', f'{sd}_team', f'{od}_team_net', f'{od}_team'):
        for h in d.get(key) or []:
            w = (h.get('wallet') or '').lower()
            if w in cappers and h.get('name') and not cappers[w].get('name'): cappers[w]['name'] = h['name']
CONS, _mk = [], set()
for s in ONK:
    if len(s['backers']) >= A.wallets and s['market_id'] not in _mk: CONS.append(s); _mk.add(s['market_id'])
FUN = []
for s in ONK:
    if s in CONS or s['market_id'] in _mk or not s['backers']: continue
    FUN.append(s); _mk.add(s['market_id'])
# Polymarket-only tab: every unmatched pick that passed the shared rules. 2+ whale picks already sort first.
# A pick with a verified Kalshi contract is NEVER placed here (ONK / CONS / FUN only).
POLY, _pmk = [], set()
for s in OFFK:
    if not s['backers']: continue
    if s['market_id'] in _mk or s['market_id'] in _pmk: continue  # already on a Kalshi tab, or weaker side of a poly market
    POLY.append(s); _pmk.add(s['market_id'])
NOT_ON_KALSHI = OFFK
# names may have been learned from market detail: refresh
for r_ in BETS + BUYS: r_['name'] = wname(r_['wallet'])
for s in signals:
    for b in s['backers'] + s['opposing']: b['name'] = wname(b['wallet'])
# per-sport record for the backers of the top 3 picks (OrcaLayer backtest by league prefix; <= 9 calls)
SP = {}
for s in CONS[:3]:
    lg = s['info']['league']
    for b in s['backers'][:3]:
        d = orca(f"/api/v2/whale/{b['wallet']}/backtest", {'limit': 1000, 'slug_prefix': lg})
        sm = (d or {}).get('summary') or {}
        b['sport'] = dict(n=sm.get('resolved'), wr=sm.get('win_rate'), pnl=sm.get('total_pnl')) if sm.get('resolved') else None

# ---------- 11. History + results ----------
HP = os.path.join(HERE, 'history.json')
hist = json.load(open(HP)) if os.path.exists(HP) else {'scans': [], 'picks': {}}
cur_ids = set()
for s in CONS[:20] + FUN[:20] + POLY[:20]:
    cur_ids.add(s['id']); p = hist['picks'].get(s['id'])
    k = s['kalshi']
    if s in POLY: tier = 'poly'
    elif s in FUN: tier = 'fun'
    else: tier = 'top'
    ktxt = (f"{k['action']} {k['contract']} @ {round(k['price']*100)}¢" if k.get('status') == 'ok' else ('Polymarket only' if tier == 'poly' else 'No Kalshi match'))
    rec = dict(tier=tier, q=s['question'], label=s['label'], slug=s['slug'], market_id=s['market_id'], side=s['side'], score=s['score'], whales=len(s['backers']),
               invested=s['invested'], start=s['game']['start'], kalshi=ktxt,
               kprice=k.get('price'), last_seen=NOW)
    if p: p.update(rec); p['scans'] = p.get('scans', 1) + 1
    else: rec.update(first_seen=NOW, scans=1, first_score=s['score'], result=None); hist['picks'][s['id']] = rec
# grade picks not currently active via OrcaLayer market detail (closed + final price)
for pid, p in hist['picks'].items():
    if p.get('result') or pid in cur_ids: continue
    d = orca('/api/v2/market/' + p['market_id'])
    m = (d or {}).get('market') or {}
    if m.get('closed'):
        py = m.get('price_yes')
        if py is not None and py in (0, 1) or (py is not None and (py >= 0.99 or py <= 0.01)):
            won = (py >= 0.99) == (p['side'] == 'yes'); p['result'] = 'W' if won else 'L'; p['graded'] = NOW
hist['scans'].append(dict(ts=NOW, signals=len(CONS), fun=len(FUN), poly=len(POLY), calls=CALLS['n'], cappers=len(cappers), bets=len(BETS), buys=len(BUYS), wallets=len(POS)))
hist['scans'] = hist['scans'][-50:]
json.dump(hist, open(HP, 'w'), indent=1)
# ---------- 12. Output ----------
def slim(s):
    k = s['kalshi']
    return dict(id=s['id'], q=s['question'], label=s['label'], kind=s['info']['kind'], league=s['info']['league'].upper(), slug=s['slug'],
        score=s['score'], parts=s['parts'], price=round(s['price'], 3), avgEntry=round(s['avg_entry'], 3) if s['avg_entry'] else None,
        whales=len(s['backers']), invested=s['invested'], net=s['net'], totalBackers=(s['side_count_all'] or None), golden=s['golden'], oppMoney=s['opp_money'], oppCount=s['opp_count'], oppQualified=s['opp_qualified'],
        fresh24=s['fresh24'], fresh24Opp=s['fresh24_opp'], sideAll=s['side_total_all'], sideCountAll=s['side_count_all'], oppAll=s['opp_total_all'], oppCountAll=s['opp_count_all'],
        hedgeAll=s['hedge_all'], game=s['game'], startTs=int(s.get('start_ts') or 0),
        backers=[dict(name=b['name'], cost=b['cost'], avg=round(b['avg'], 3) if b['avg'] else None, wr=b['wr'], resolved=b['resolved'], pnl=round(b['pnl'] or 0), rank=b['rank'],
                      golden=b['golden'], skill=b['skill'], flow=b.get('flow'), buy24=b.get('buy24'), sell24=b.get('sell24'),
                      sport=b.get('sport'), wallet=b['wallet'], top100=b.get('top100'), rank30=b.get('rank30'), firstTs=b.get('first_ts'), lastTs=b.get('last_ts'), trades=b.get('trades')) for b in s['backers'][:10]],
        opposing=[dict(name=o['name'], wallet=o['wallet'], cost=o['cost'], avg=round(o['avg'], 3) if o.get('avg') else None, wr=o.get('wr'), qualified=o['qualified'], golden=o['golden'], rank=o.get('rank'), rank30=o.get('rank30')) for o in sorted(s['opposing'], key=lambda o: -o['cost'])[:6]],
        kalshi={kk: vv for kk, vv in k.items()}, risks=s.get('risks', []))
TRADERS = []
for w, c in cappers.items():
    st = TSTAT.get(w) or {}
    TRADERS.append(dict(wallet=w, name=wname(w), rank=c['rank'], rank30=c.get('rank30'), sportsPct=c.get('sports_pct'), pnl=round(c.get('total_pnl') or 0), wr=c.get('win_rate'), resolved=c.get('resolved_markets'),
                        wins=c.get('wins'), losses=c.get('losses'), pf=c.get('profit_factor'), mwr=c.get('market_win_rate'), avgEntry=c.get('avg_entry_price'), vol=round(c.get('total_volume') or 0),
                        lastTs=c.get('last_trade_ts'), skill=bool(c.get('skill_badge')), skillEdge=c.get('skill_edge_cents'), qualified=qualifies(c), golden=golden(c),
                        loaded=st.get('loaded'), bets=st.get('bets', 0), value=round(st.get('value', 0)), hedged=st.get('hedged', 0)))
def risks(s_):
    r = []
    if s_['opp_money'] > s_['invested']: r.append(f"More top-whale money against ({s_['opp_money']:,}) than for ({s_['invested']:,}).")
    if s_['opp_qualified']: r.append(f"{s_['opp_qualified']} top-100 whale(s) hold the other side.")
    if s_['kalshi'].get('status') != 'ok': r.append('No verified Kalshi contract: ' + (s_['kalshi'].get('why') or '') + '.')
    elif (s_['kalshi'].get('edge_vs_whales') or 0) < 0: r.append(f"Kalshi price is {abs(s_['kalshi']['edge_vs_whales'])}¢ above the whales' average entry.")
    if s_['fresh24_opp'] > s_['fresh24']: r.append('More fresh 24h money went to the other side.')
    if any((b.get('resolved') or 0) < 10 for b in s_['backers'] if b.get('resolved') is not None): r.append('At least one backer has fewer than 10 markets resolved in the last 30 days.')
    if (s_.get('game') or {}).get('src') != 'ESPN': r.append('Start time not confirmed by ESPN (' + (s_.get('game') or {}).get('src', 'unknown') + ').')
    return r
for s_ in CONS + FUN + POLY: s_['risks'] = risks(s_)
out = dict(scannedAt=pt(NOW), ts=NOW, secs=round(time.time() - T0), settings=dict(cappers=A.cappers, min=A.min, wallets=A.wallets, markets=A.markets, windowH=12),
    coverage=dict(cappers=len(cappers), qualified=sum(qualifies(c) for c in cappers.values()), golden=sum(golden(c) for c in cappers.values()),
                  marketsFound=found_markets, marketsInWindow=in_window, marketsScanned=min(30, len(ONK)), hedgedExcluded=two_sided, twoSidedExcluded=two_sided, lb30=LB30, notOnKalshi=len(NOT_ON_KALSHI), picksOnKalshi=len(ONK), sideGroups=len(signals),
                  walletsLoaded=len(POS), positionsLoaded=sum(len(v) for v in POS.values()), bets=len(BETS), buysRaw=len(RAW_BUYS), buys=len(BUYS),
                  orcaCalls=CALLS['n'], orcaErrors=CALLS['errors'][:10], kalshiSeries=len(KM), kalshiMatched=len(ONK),
                  espnLeagues=len({k[0] for k in ESPN})),
    signals=[slim(s) for s in CONS[:20]], totalSignals=len(CONS), fun=[slim(s) for s in FUN[:20]], totalFun=len(FUN),
    poly=[slim(s) for s in POLY[:20]], totalPoly=len(POLY),
    bets=BETS[:220], buys=BUYS[:160], traders=TRADERS,
    history=sorted([dict(id=k, **{kk: v[kk] for kk in ('tier', 'q', 'label', 'score', 'whales', 'invested', 'start', 'kalshi', 'kprice', 'first_seen', 'last_seen', 'scans', 'result', 'graded') if kk in v},
                         active=k in cur_ids) for k, v in hist['picks'].items()], key=lambda x: -x['last_seen'])[:80],
    scans=hist['scans'][-20:])
json.dump(out, open(os.path.join(HERE, 'page_data.json'), 'w'), separators=(',', ':'))
print(f"consensus={len(CONS)} fun={len(FUN)} poly={len(POLY)} all={len(signals)} groups={len(signals)} onKalshi={len(ONK)} offKalshi={len(OFFK)} cappers={len(cappers)} orca_calls={CALLS['n']} errors={len(CALLS['errors'])} secs={out['secs']} kalshi_ok={out['coverage']['kalshiMatched']}")
for s in CONS[:8] + FUN[:3] + POLY[:3]: print(len(s['backers']), s['net'], s['score'], s['question'], '|', s['label'], '|', len(s['backers']), s['invested'], '|', s['kalshi'].get('action'), s['kalshi'].get('contract'), s['kalshi'].get('price'), s['kalshi'].get('why'), 'poly' if s in POLY else ('fun' if s in FUN else 'top'))
# ---------- 13. Page embed (wallets kept for Polymarket profile links) ----------
for b_ in BETS: b_.pop('_info', None)
emb = json.loads(json.dumps(out))
def kslim(k): return {kk: k.get(kk) for kk in ('status', 'why', 'action', 'price', 'contract', 'ticker', 'edge_vs_whales', 'light', 'rule') if k.get(kk) is not None}
for r_ in emb['bets'] + emb['buys']:
    r_['kalshi'] = kslim(r_['kalshi'])
    if r_['kalshi'].get('rule'): r_['kalshi']['rule'] = r_['kalshi']['rule'][:160]
    r_['game'] = {kk: vv for kk, vv in r_['game'].items() if vv not in (None, '', [])}
for r_ in emb['buys']:
    r_['kalshi'].pop('rule', None)
    for kk in ('market_id', 'slug', 'qualified'): r_.pop(kk, None)
for r_ in emb['bets']:
    for kk in ('market_id', 'slug', '_info'): r_.pop(kk, None)
json.dump(emb, open(os.path.join(HERE, 'page_embed.json'), 'w'), separators=(',', ':'))
open(os.path.join(HERE, 'page_data_line.txt'), 'w').write('const DATA: ScanData = ' + json.dumps(emb, separators=(',', ':')) + ';')
print('embed bytes', len(json.dumps(emb, separators=(',', ':'))))
import subprocess; subprocess.run([sys.executable, os.path.join(HERE, 'compact.py')])
