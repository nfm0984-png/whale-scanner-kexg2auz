#!/usr/bin/env python3
"""OrcaLayer whale scanner (snapshot). Whale data: OrcaLayer API only. Kalshi: contract match + price. ESPN: schedule/scores.
Usage: python3 scan.py [--cappers 100 (any positive integer)] [--min 500]
Whales = top N sports whales by all-time P&L (OrcaLayer /api/v2/whales/leaderboard?sort=pnl; pnl-leaderboard only supports window=7|30), processed #1 first."""
import json, time, math, re, sys, os, argparse, urllib.request, collections, datetime as dt, hashlib
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
# ---------- 1. Whale universe: top N SPORTS whales ranked by ALL-TIME P&L, processed in rank order (#1 first) ----------
# Verified 2026-11-12: /api/v2/business/pnl-leaderboard only accepts window=7 or 30 (window=all/0/90/365/9999 -> 400/422; omit window defaults to 7).
# All-time realized P&L is GET /api/v2/whales/leaderboard?sort=pnl&filter=all (same ranking as /api/leaderboard?period=All Time).
# Walk from all-time #1 down; open positions are loaded 20 wallets at a time in that order.
# A wallet counts as a sports whale when >= 50% of its open position cost is in SPORTS markets.
# 30-day P&L is fetched once afterwards (cheap: pnl-leaderboard window=30) as secondary info only.
cappers, POS = {}, {}
LB = dict(endpoint='/api/v2/whales/leaderboard', params='sort=pnl, filter=all (all-time P&L)', asOf=None, start=None, end='all-time', scanned=0, skippedNonSports=0, skippedNoPositions=0, deepestRank=0, pendingRetried=0, unavailable=0)
def fetch_pos(ws, wait):
    d = orca('/api/v2/wallets/positions', body={'wallets': ws}, tries=2 if wait else 1, timeout=60, wait202=wait)
    if d is None or d.get('_pending'): return None
    return {(x.get('wallet') or '').lower(): ((x.get('data') or {}).get('positions') or []) for x in d.get('results', []) if x.get('status') == 'ok'}
def lb_rows(raw, offset):
    out = []
    for i, r in enumerate(raw):
        res = r.get('resolved_markets') or 0; won = r.get('wins') or r.get('resolved_won') or 0
        wr = r.get('win_rate')
        if wr is None and res: wr = round(100 * won / res, 1)
        out.append(dict(rank=offset + i + 1, wallet=r['wallet'], name=r.get('name') or r.get('display_name'),
                        pnl_usd=r.get('total_pnl') if r.get('total_pnl') is not None else r.get('pnl_usd'),
                        volume_usd=r.get('total_volume') if r.get('total_volume') is not None else r.get('volume_usd'),
                        trades=r.get('total_trades') or r.get('trades'), resolved_markets=res, resolved_won=won,
                        win_rate=wr, profit_factor=r.get('profit_factor'), skill_badge=r.get('skill_badge'),
                        skill_edge_cents=r.get('skill_edge_cents'), market_win_rate=r.get('market_win_rate'),
                        last_trade_ts=r.get('last_trade_ts'), avg_entry_price=r.get('avg_entry_price')))
    return out
CAND, PENDING = [], []
def classify(r, ps):
    LB['scanned'] += 1
    ps = [p for p in ps if not p.get('closed')]
    tot = sum(p.get('cost') or p.get('initial_value') or 0 for p in ps)
    sp = sum(p.get('cost') or p.get('initial_value') or 0 for p in ps if p.get('category') == 'SPORTS')
    if not ps or tot <= 0: LB['skippedNoPositions'] += 1; return
    if sp / tot < 0.5: LB['skippedNonSports'] += 1; return
    CAND.append((r, ps, round(100 * sp / tot, 1)))
_off = 0
while len(CAND) < A.cappers and _off < 5000:
    d = orca('/api/v2/whales/leaderboard', {'sort': 'pnl', 'filter': 'all', 'limit': 100, 'offset': _off, 'min_markets': 0})
    raw = (d or {}).get('whales') or []
    if not raw: break
    rows = lb_rows(raw, _off)
    _off += len(raw)
    for i in range(0, len(rows), 20):
        if len(CAND) >= A.cappers: break
        chunk = rows[i:i + 20]; LB['deepestRank'] = chunk[-1]['rank']
        _t = time.time(); got = fetch_pos([r['wallet'] for r in chunk], False)
        if got is None: PENDING.append(chunk); print(f"  all-time ranks {chunk[0]['rank']}-{chunk[-1]['rank']}: OrcaLayer still computing, will retry", flush=True); continue
        for r in chunk: classify(r, got.get(r['wallet'].lower(), []))
        print(f"  all-time ranks {chunk[0]['rank']}-{chunk[-1]['rank']}: positions in {time.time()-_t:.0f}s, sports whales so far {len(CAND)}", flush=True)
    if len(raw) < 100: break
for chunk in PENDING:  # higher-ranked wallets that were still being computed: retry (waiting this time), split if needed
    LB['pendingRetried'] += len(chunk)
    got = fetch_pos([r['wallet'] for r in chunk], True)
    if got is None:
        got = {}
        for j in range(0, len(chunk), 5):
            g2 = fetch_pos([r['wallet'] for r in chunk[j:j + 5]], True)
            if g2 is None: LB['unavailable'] += len(chunk[j:j + 5])
            else: got.update(g2)
    for r in chunk:
        if r['wallet'].lower() in got: classify(r, got[r['wallet'].lower()])
    print(f"  retried all-time ranks {chunk[0]['rank']}-{chunk[-1]['rank']}: sports whales so far {len(CAND)}", flush=True)
CAND.sort(key=lambda c_: c_[0]['rank'])
for r, ps, spct in CAND[:A.cappers]:  # rank order: all-time #1 first
    w = r['wallet'].lower(); res = r.get('resolved_markets') or 0; won = r.get('resolved_won') or 0
    cappers[w] = dict(wallet=w, name=r.get('name'), rank=len(cappers) + 1, rankAll=r['rank'], rank30=None, pnl30=None,
                      total_pnl=r.get('pnl_usd'), total_volume=r.get('volume_usd'),
                      win_rate=r.get('win_rate') if r.get('win_rate') is not None else (round(100 * won / res, 1) if res else None),
                      resolved_markets=res, wins=won, losses=(res - won) if res else None, sports_pct=spct, trades=r.get('trades'),
                      profit_factor=r.get('profit_factor'), skill_badge=r.get('skill_badge'), skill_edge_cents=r.get('skill_edge_cents'),
                      market_win_rate=r.get('market_win_rate'), last_trade_ts=r.get('last_trade_ts'), avg_entry_price=r.get('avg_entry_price'))
    POS[w] = ps
# Cheap secondary: 30-day PnL/rank for wallets that appear on the 30-day leaderboard (a few calls, not per-wallet).
PNL30 = {}
for off in range(0, 2000, 500):
    d30 = orca('/api/v2/business/pnl-leaderboard', {'window': 30, 'order': 'desc', 'limit': 500, 'offset': off})
    rows30 = (d30 or {}).get('rows') or []
    if not rows30: break
    for r in rows30:
        PNL30[(r.get('wallet') or '').lower()] = dict(rank=r.get('rank'), pnl=r.get('pnl_usd'),
                                                      resolved=r.get('resolved_markets'), won=r.get('resolved_won'))
    if len(rows30) < 500: break
for w, c in cappers.items():
    x = PNL30.get(w)
    if x:
        c['rank30'] = x.get('rank'); c['pnl30'] = x.get('pnl')
print(f"whales: {len(cappers)} sports whales from all-time ranks 1-{LB['deepestRank']} (skipped {LB['skippedNonSports']} non-sports, {LB['skippedNoPositions']} with no open positions); 30d PnL attached for {sum(1 for c in cappers.values() if c.get('pnl30') is not None)}")
def qualifies(c): return bool(c)  # only the top-N all-time sports whales count
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
    if info.get('kind') == 'other':
        prop = parse_prop(q, tail, teams)
        if prop:
            info.update(kind='prop', **prop)
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

# Per-game player-prop series (title like "Ryan Rollins: 20+ points"). Not awards, season leaders, or protected/ladder variants.
KPROP = {
    'nba': {'points': 'KXNBAPTS', 'rebounds': 'KXNBAREB', 'assists': 'KXNBAAST', 'pra': 'KXNBAPRA', 'pr': 'KXNBAPR', 'pa': 'KXNBAPA', 'ra': 'KXNBARA', 'threes': 'KXNBA3PT', 'blocks': 'KXNBABLK', 'steals': 'KXNBASTL', 'stocks': 'KXNBASTOCK'},
    'wnba': {'points': 'KXWNBAPTS', 'rebounds': 'KXWNBAREB', 'assists': 'KXWNBAAST', 'threes': 'KXWNBA3PT'},
    'nfl': {'passing_yards': 'KXNFLPASSYDS', 'rushing_yards': 'KXNFLRSHYDS', 'receiving_yards': 'KXNFLRECYDS', 'rush_rec_yards': 'KXNFLRRYDS', 'passing_tds': 'KXNFLPASSTDS', 'touchdowns': 'KXNFLTD', 'receptions': 'KXNFLREC', 'first_td': 'KXNFLFIRSTTD'},
    'nhl': {'points': 'KXNHLPTS', 'assists': 'KXNHLAST', 'goals': 'KXNHLGOAL', 'anytime_goal': 'KXNHLANYGOAL', 'first_goal': 'KXNHLFIRSTGOAL'},
    'mlb': {'hits': 'KXMLBHIT', 'home_runs': 'KXMLBHR', 'strikeouts': 'KXMLBKS'},
    'epl': {'anytime_goal': 'KXEPLANYGOAL', 'goals': 'KXEPLGOAL', 'first_goal': 'KXEPLFIRSTGOAL', 'assists': 'KXEPLAST'},
    'ucl': {'anytime_goal': 'KXUCLGOAL', 'goals': 'KXUCLGOAL', 'first_goal': 'KXUCLFIRSTGOAL', 'assists': 'KXUCLAST', 'shots': 'KXUCLSHOT'},
}
STAT_PAT = [
    ('pra', r'points?\s*\+\s*rebounds?\s*\+\s*assists?|pts\s*\+\s*reb(?:ounds?)?\s*\+\s*ast|\bpra\b'),
    ('pr', r'points?\s*\+\s*rebounds?|pts\s*\+\s*reb'),
    ('pa', r'points?\s*\+\s*assists?|pts\s*\+\s*ast'),
    ('ra', r'rebounds?\s*\+\s*assists?|reb\s*\+\s*ast'),
    ('rush_rec_yards', r'rush(?:ing)?\s*(?:and|&|\+)\s*receiv(?:ing)?\s*yards'),
    ('passing_yards', r'passing yards|pass(?:ing)? yds'),
    ('rushing_yards', r'rushing yards|rush(?:es|ing)? yds|rushes for'),
    ('receiving_yards', r'receiving yards|rec(?:eiving)? yds'),
    ('passing_tds', r'passing touchdowns?|pass(?:ing)? tds?'),
    ('rushing_tds', r'rushing touchdowns?|rush(?:ing)? tds?'),
    ('receiving_tds', r'receiving touchdowns?|rec(?:eiving)? tds?'),
    ('receptions', r'\breceptions?\b'),
    ('anytime_td', r'anytime\s+(?:td|touchdown)|to score a touchdown'),
    ('first_td', r'first touchdown|first td'),
    ('first_goal', r'first goal(?:scorer)?'),
    ('anytime_goal', r'anytime goal(?:scorer)?'),
    ('touchdowns', r'\btouchdowns?\b|\btds?\b'),
    ('threes', r'three[-\s]?pointers?|\bthrees?\b|\b3[-\s]?pt(?:s|ers?)?\b'),
    ('points', r'\bpoints?\b|\bpts\b'),
    ('rebounds', r'\brebounds?\b|\brebs?\b'),
    ('assists', r'\bassists?\b|\basts?\b'),
    ('steals', r'\bsteals?\b'),
    ('blocks', r'\bblocks?\b'),
    ('stocks', r'steals?\s*(?:and|&|\+)\s*blocks?|\bstocks?\b'),
    ('hits', r'\bhits\b'),
    ('home_runs', r'home runs?|\bhrs?\b'),
    ('strikeouts', r'strikeouts?|\bks\b'),
    ('goals', r'\bgoals?\b'),
    ('shots', r'shots on goal|\bshots\b'),
]
STAT_WORDS = {k: k.replace('_', ' ') for k, _pat in STAT_PAT}
STAT_WORDS.update(pra='points + rebounds + assists', pr='points + rebounds', pa='points + assists', ra='rebounds + assists',
                  rush_rec_yards='rushing and receiving yards', passing_yards='passing yards', rushing_yards='rushing yards',
                  receiving_yards='receiving yards', passing_tds='passing touchdowns', rushing_tds='rushing touchdowns',
                  receiving_tds='receiving touchdowns', anytime_td='a touchdown', first_td='first touchdown',
                  first_goal='first goal', anytime_goal='a goal', threes='threes', home_runs='home runs', stocks='steals + blocks')

def is_btts(q):
    return bool(re.search(r'(?i)both teams to score', q or ''))

def match_stat(text):
    t = text or ''
    for key, pat in STAT_PAT:
        if re.search(pat, t, re.I):
            return key
    return None

def parse_prop(q, tail, teams):
    if is_btts(q):
        return None
    if re.search(r'(?i)\b(o/?u|over/under|total)\b', q or '') and not re.search(r'(?i)points|rebounds|assists|yards|touchdown|receptions|threes|strikeouts|home runs|hits|steals|blocks', q or ''):
        return None
    stat = match_stat(q) or match_stat((tail or '').replace('-', ' '))
    if not stat:
        return None
    line = None
    m = re.search(r'(\d+(?:\.\d+)?)\s*\+', q or '') or re.search(r'(?i)(?:o/?u|over/under|over|under)\s*(\d+(?:\.\d+)?)', q or '')
    if m:
        line = float(m.group(1))
    if line is None and tail:
        tm = re.search(r'(\d+)pt(\d+)', tail)
        if tm:
            line = float(tm.group(1) + '.' + tm.group(2))
        else:
            tm = re.search(r'(\d+(?:\.\d+)?)$', tail)
            if tm:
                line = float(tm.group(1))
    player = None
    qm = re.match(r'^(.+?)\s*:\s*', q or '')
    if qm:
        head = qm.group(1).strip()
        if re.search(r'\svs\.?\s', head) and teams:
            rest = (q or '')[qm.end():]
            pm = re.match(r'(.+?)\s+(?:o/?u|over|under|\d)', rest, re.I) or re.match(r'(.+?)\s*$', rest)
            if pm and not match_stat(pm.group(1)):
                player = pm.group(1).strip()
        elif not re.search(r'\svs\.?\s', head):
            player = head
    if not player:
        pm = re.match(r'^(.+?)\s+(?:\d+\+?|over|under|o/?u|rushes|rushing|receiving|passing|records)', q or '', re.I)
        if pm and not re.search(r'\svs\.?\s', pm.group(1)):
            player = pm.group(1).strip()
    if not player and tail:
        parts = re.split(r'-(?:points?|pts|rebounds?|reb|assists?|ast|pra|threes?|3pt|yards?|yds|rushing|receiving|passing|touchdowns?|tds?|receptions?|hits|hrs?|ks|goals?|shots?)-', tail, maxsplit=1)
        if parts and parts[0] and not parts[0].startswith('total') and not parts[0].startswith('spread'):
            player = parts[0].replace('-', ' ').strip()
    if not player:
        return None
    if teams and any(player.lower() == t.lower() or player.lower() in t.lower() or t.lower() in player.lower() for t in teams) and stat in ('points', 'goals') and re.search(r'(?i)o/?u|over/under|total', q or ''):
        return None
    word = STAT_WORDS.get(stat, stat.replace('_', ' '))
    if line is not None and float(line) == int(line):
        ln = f"{int(line)}+"
        yes = f"{player} {ln} {word}"
        no = f"{player} under {int(line)} {word}"
    elif line is not None:
        yes = f"{player} over {line:g} {word}"
        no = f"{player} under {line:g} {word}"
    else:
        yes = f"{player} {word}"
        no = f"{player} not {word}"
    return dict(stat=stat, line=line, player=player, yes=yes, no=no)

def kmarkets(series):

    if not series: return []
    if series not in KM:
        out, cur = [], None
        for _ in range(8):
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
    elif info['kind'] == 'prop':
        series = (KPROP.get(info['league']) or {}).get(info.get('stat'))
        if not series:
            return dict(status='none', why="No Kalshi " + (info.get('stat') or 'player') + " prop series for " + info['league'].upper())
        ev = find_event(series, info, 'prop')
        if not ev:
            return dict(status='none', why="No open Kalshi " + STAT_WORDS.get(info.get('stat'), 'player prop') + " market for this game")
        ms = ev[2]
        player = info.get('player') or ''
        def mtitle(m):
            return m.get('title') or m.get('yes_sub_title') or ''
        cands = [m for m in ms if namematch(player, re.sub(r':\s*.*$', '', mtitle(m))) or namematch(player, mtitle(m))]
        if not cands:
            return dict(status='none', why="No Kalshi line for " + player)
        def mline(m):
            tm = re.search(r'(\d+(?:\.\d+)?)\s*\+', mtitle(m))
            if tm: return float(tm.group(1))
            fs = fp(m.get('floor_strike'))
            if fs is None: return None
            return fs + 0.5 if (m.get('strike_type') == 'greater' and abs(fs - int(fs) - 0.5) < 0.01) else fs
        line = info.get('line')
        if line is not None:
            exact = [m for m in cands if mline(m) is not None and min(abs(mline(m) - line), abs(mline(m) - 0.5 - line), abs(mline(m) + 0.5 - line)) < 0.06]
            if exact:
                cands = exact
            else:
                near = min((mline(m) for m in cands if mline(m) is not None), default=None, key=lambda l: abs(l - line))
                return dict(status='none', why="No Kalshi " + STAT_WORDS.get(info.get('stat'), 'prop') + " line at " + f"{line:g}" + " for " + player + ((" (nearest " + f"{near:g}" + ")") if near is not None else ''))
        m = cands[0]
        act = 'BUY YES' if s['side'] == 'yes' else 'BUY NO'
        p = fp(m['yes_ask_dollars' if act == 'BUY YES' else 'no_ask_dollars'])
    else:
        return dict(status='none', why='Market type has no Kalshi equivalent')
    if not p: return dict(status='none', why='Kalshi market matched but has no ask right now')
    rule = m.get('rules_primary') or ''
    sel = (m.get('title') if info.get('kind') == 'prop' else None) or m.get('yes_sub_title') or ''
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
    if k == 'prop': return 'prop'
    if k in ('moneyline', 'teamwin', 'draw'): return 'moneyline'
    if k in ('spread', 'total'): return k
    if is_btts(q): return 'other'
    if re.search(r'(?i)spread|handicap', q): return 'spread'
    if re.search(r'(?i)o/u|over/under|total', q):
        return 'prop' if info.get('player') or (match_stat(q) and ':' in (q or '') and not re.search(r'(?i)^.+vs.+?:\s*(1st half |first half )?o/?u', q or '')) else 'total'
    if match_stat(q) and not re.search(r'(?i)^spread:|^will ', q or ''): return 'prop'
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
        BETS.append(dict(wallet=w, name=wname(w), rank=c.get('rank'), rankAll=c.get('rankAll'), rank30=c.get('rank30'), _info=info, lastTs=p.get('last_trade_ts'), wr=c.get('win_rate'), resolved=c.get('resolved_markets'), cpnl=round(c.get('total_pnl') or 0),
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
    BUYS.append(dict(ts=r['ts'], wallet=r['wallet'], name=wname(r['wallet']), rankAll=(c or {}).get('rankAll'), rank30=(c or {}).get('rank30'), wr=r['wr'], wpnl=round(r['wpnl'] or 0), top100=bool(c), rank=(c or {}).get('rank'),
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
# Rank (Noel): price band first (65-84¢ best), then totals over spreads, then net money / one-sided share, then whale count, then all-time rank.
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
    backers = [dict(wallet=b['wallet'], name=b['name'], cost=b['cost'], avg=b['avg'], wr=b['wr'], resolved=b['resolved'], pnl=b['cpnl'], rank=b['rank'], rankAll=b.get('rankAll') or (cappers.get(b['wallet']) or {}).get('rankAll'), rank30=b.get('rank30'),
                    golden=b['golden'], skill=False, top100=True, first_ts=b['firstTs'], last_ts=b.get('lastTs'), trades=None,
                    buy24=round(FLOW[(b['wallet'], cid, side)][0]), sell24=round(FLOW[(b['wallet'], cid, side)][1]),
                    flow=('Buying more' if FLOW[(b['wallet'], cid, side)][0] > FLOW[(b['wallet'], cid, side)][1] else ('Trimming' if FLOW[(b['wallet'], cid, side)][1] > 0 else 'Holding'))) for b in sorted(bs, key=lambda x: (x.get('rank') or 999))]
    signals.append(dict(id=f"{cid}:{side}", market_id=b0['market_id'], condition_id=cid, question=b0['q'], slug=b0['slug'], side=side, label=b0['label'], info=b0['_info'],
        price=b0['now'], backers=backers, opposing=[dict(name=o['name'], wallet=o['wallet'], cost=o['cost'], avg=o['avg'], wr=o['wr'], qualified=True, golden=o['golden'], rank=o['rank'], rankAll=(cappers.get(o['wallet']) or {}).get('rankAll'), rank30=(cappers.get(o['wallet']) or {}).get('rank30')) for o in opp],
        invested=inv, avg_entry=avg, opp_money=oppm, opp_count=len(opp), opp_qualified=len(opp), golden=sum(b['golden'] for b in bs), net=inv - oppm,
        fresh24=round(f24), fresh24_opp=round(f24o), side_total_all=None, side_count_all=None, opp_total_all=None, opp_count_all=None, hedge_all=None,
        kalshi=b0['kalshi'], game=b0['game'], start_ts=b0['startTs'], risks=[]))
for s in signals:
    if s['kalshi'].get('status') == 'ok' and s['avg_entry']:
        s['kalshi'] = dict(s['kalshi'], edge_vs_whales=round((s['avg_entry'] - s['kalshi']['price']) * 100, 1)); e_ = s['kalshi']['edge_vs_whales']
        s['kalshi']['light'] = 'green' if e_ >= 0 else ('yellow' if e_ >= -5 else 'red')
    score(s)
def used_price(s):
    k = s['kalshi']
    if k.get('status') == 'ok' and k.get('price') is not None: return k['price']
    return s.get('price')
def price_band(px):
    if px is None: return 'mid'
    c = px * 100
    if c < 45: return 'longshot'
    if c >= 95: return 'glue'
    if 65 <= c <= 84: return 'best'
    return 'mid'
def is_started(s):
    g = s.get('game') or {}
    if g.get('state') in ('in', 'post'): return True
    ts = s.get('start_ts')
    if ts and ts <= NOW: return True
    return False
def one_share(s):
    tot = (s['invested'] or 0) + (s['opp_money'] or 0)
    return (s['invested'] / tot) if tot > 0 else 1.0
def over_cents(s):
    px, avg = used_price(s), s.get('avg_entry')
    if px is None or not avg: return None
    return round((px - avg) * 100, 1)
def pick_id(s):
    return hashlib.sha1(s['id'].encode()).hexdigest()[:6].upper()
def strength_of(s):
    n = len(s['backers']); share = s['one_sided_share']; band = s['price_band']; kind = (s.get('info') or {}).get('kind')
    # caps first: under 45, 95+, Split (share < 65%) never Go big
    if band == 'longshot' or band == 'glue' or share < 0.65:
        return 'Small'
    word = 'Go big' if (n >= 3 or (s['invested'] >= 10000 and (not s['opp_money'] or s['opp_money'] < s['invested'] * 0.15))) else ('Normal' if n >= 2 else 'Small')
    # spreads cap at Normal unless 3+ whales and share >= 65%
    if kind == 'spread' and not (n >= 3 and share >= 0.65) and word == 'Go big':
        word = 'Normal'
    return word
def annotate(s):
    s['used_price'] = used_price(s)
    s['price_band'] = price_band(s['used_price'])
    s['one_sided_share'] = one_share(s)
    s['split'] = s['one_sided_share'] < 0.65
    s['over_cents'] = over_cents(s)
    s['pricier'] = s['over_cents'] is not None and s['over_cents'] > 3
    s['too_pricier'] = s['over_cents'] is not None and s['over_cents'] > 5
    s['started'] = is_started(s)
    s['pick_id'] = pick_id(s)
    s['strength'] = strength_of(s)
    s['glue'] = s['price_band'] == 'glue'
def best_rank(s):
    return min((b.get('rankAll') or b.get('rank') or b.get('rank30') or 999) for b in s['backers']) if s['backers'] else 999
# New Top 20 order: price band (best 65-84 first, then mid), totals boost, then net money, one-sided share, whale count, all-time rank.
def rank_key(s):
    band = 0 if s.get('price_band') == 'best' else (1 if s.get('price_band') == 'mid' else 2)
    total = 0 if (s.get('info') or {}).get('kind') == 'total' else 1
    return (band, total, -(s.get('net') or 0), -(s.get('one_sided_share') or 0), -len(s['backers']), best_rank(s), -(s.get('score') or 0))
for s in signals: annotate(s)
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
# Eligibility:
# Top 20: Kalshi ok, 2+ whales, not started, not under 45¢, not 95¢+, one-sided share >= 55%, not overpriced >3¢ vs whale avg entry.
# Glue (shown on Top 20 page, not singles): Kalshi ok, 2+ whales, 95¢+, not started.
# Fun: remaining Kalshi-ok, 1+, not started (includes under-45 as Small, Split <55%, Pricier, 1-whale, 95¢+ 1-whale as glue).
# Poly: Kalshi-free only, hide started; never duplicates a Kalshi-tab pick.
def is_prop_sig(s):
    info = s.get('info') or {}
    q = s.get('question') or ''
    if is_btts(q): return False
    return info.get('kind') == 'prop' or bet_kind(info, q) == 'prop'
def is_long_sig(s):
    px = s.get('used_price')
    if px is None or px < 0.10 or px > 0.20: return False
    if len(s.get('backers') or []) < 2: return False
    if is_started(s): return False
    if (s.get('one_sided_share') or 0) < 0.55: return False
    return True
PROPS, LONGSHOTS, _pl = [], [], set()
for s in signals:
    if is_started(s) or not s['backers']: continue
    if is_long_sig(s):
        LONGSHOTS.append(s); _pl.add(s['id'])
    if is_prop_sig(s):
        PROPS.append(s); _pl.add(s['id'])
PROPS.sort(key=rank_key); LONGSHOTS.sort(key=rank_key)
BIGGEST = [x for x in signals if x.get('backers') and not is_started(x)]
BIGGEST.sort(key=lambda x: (-max((b.get('cost') or 0) for b in x['backers']), -(x.get('invested') or 0)))
CONS, GLUE, FUN, _mk = [], [], [], set()
for s in ONK:
    if is_started(s) or not s['backers'] or s['market_id'] in _mk or s['id'] in _pl or is_prop_sig(s): continue
    n = len(s['backers']); band = s['price_band']; share = s['one_sided_share']
    if n >= A.wallets and band == 'glue':
        GLUE.append(s); _mk.add(s['market_id']); continue
    if n >= A.wallets and band not in ('longshot', 'glue') and share >= 0.55 and not s['pricier']:
        CONS.append(s); _mk.add(s['market_id']); continue
for s in ONK:
    if is_started(s) or s in CONS or s in GLUE or s['market_id'] in _mk or not s['backers'] or s['id'] in _pl or is_prop_sig(s) or is_long_sig(s): continue
    FUN.append(s); _mk.add(s['market_id'])
# Keep only the top 20 on the Top 20 list; overflow eligible picks still show on Fun.
if len(CONS) > 20:
    FUN = CONS[20:] + FUN
    CONS = CONS[:20]
# Polymarket-only tab: every unmatched pick that passed the shared rules, excluding started games.
# A pick with a verified Kalshi contract is NEVER placed here (ONK / CONS / FUN / GLUE only).
POLY, _pmk = [], set()
for s in OFFK:
    if is_started(s) or not s['backers']: continue
    if s['market_id'] in _mk or s['market_id'] in _pmk: continue  # already on a Kalshi tab, or weaker side of a poly market
    if s['id'] in _pl or is_prop_sig(s) or is_long_sig(s): continue  # Props / Longshots tabs own these
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
for s in CONS[:20] + GLUE[:12] + FUN[:20] + POLY[:20] + PROPS[:20] + LONGSHOTS[:20] + [x for x in BIGGEST[:30] if x['id'] not in {c['id'] for c in CONS[:20] + GLUE[:12] + FUN[:20] + POLY[:20] + PROPS[:20] + LONGSHOTS[:20]}]:
    cur_ids.add(s['id']); p = hist['picks'].get(s['id'])
    k = s['kalshi']
    if s in LONGSHOTS: tier = 'longshots'
    elif s in PROPS: tier = 'props'
    elif s in BIGGEST and s not in CONS and s not in GLUE and s not in FUN and s not in POLY: tier = 'biggest'
    elif s in POLY: tier = 'poly'
    elif s in FUN: tier = 'fun'
    elif s in GLUE: tier = 'glue'
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
hist['scans'].append(dict(ts=NOW, signals=len(CONS), fun=len(FUN), poly=len(POLY), glue=len(GLUE), props=len(PROPS), longshots=len(LONGSHOTS), biggest=len(BIGGEST), calls=CALLS['n'], cappers=len(cappers), bets=len(BETS), buys=len(BUYS), wallets=len(POS)))
hist['scans'] = hist['scans'][-50:]
json.dump(hist, open(HP, 'w'), indent=1)
# ---------- 12. Output ----------
def slim(s):
    k = s['kalshi']
    share = s.get('one_sided_share')
    return dict(id=s['id'], q=s['question'], label=s['label'], kind=s['info']['kind'], league=s['info']['league'].upper(), slug=s['slug'],
        score=s['score'], parts=s['parts'], price=round(s['price'], 3), avgEntry=round(s['avg_entry'], 3) if s['avg_entry'] else None,
        whales=len(s['backers']), invested=s['invested'], net=s['net'], oneSidedShare=round(share, 4) if share is not None else None,
        priceBand=s.get('price_band'), split=bool(s.get('split')), glue=bool(s.get('glue')), pricier=bool(s.get('pricier')),
        overCents=s.get('over_cents'), pickId=s.get('pick_id'), strength=s.get('strength'), started=bool(s.get('started')),
        totalBackers=(s['side_count_all'] or None), golden=s['golden'], oppMoney=s['opp_money'], oppCount=s['opp_count'], oppQualified=s['opp_qualified'],
        fresh24=s['fresh24'], fresh24Opp=s['fresh24_opp'], sideAll=s['side_total_all'], sideCountAll=s['side_count_all'], oppAll=s['opp_total_all'], oppCountAll=s['opp_count_all'],
        hedgeAll=s['hedge_all'], game=s['game'], startTs=int(s.get('start_ts') or 0),
        backers=[dict(name=b['name'], cost=b['cost'], avg=round(b['avg'], 3) if b['avg'] else None, wr=b['wr'], resolved=b['resolved'], pnl=round(b['pnl'] or 0), rank=b['rank'],
                      golden=b['golden'], skill=b['skill'], flow=b.get('flow'), buy24=b.get('buy24'), sell24=b.get('sell24'),
                      sport=b.get('sport'), wallet=b['wallet'], top100=b.get('top100'), rankAll=b.get('rankAll'), rank30=b.get('rank30'), firstTs=b.get('first_ts'), lastTs=b.get('last_ts'), trades=b.get('trades')) for b in s['backers'][:10]],
        opposing=[dict(name=o['name'], wallet=o['wallet'], cost=o['cost'], avg=round(o['avg'], 3) if o.get('avg') else None, wr=o.get('wr'), qualified=o['qualified'], golden=o['golden'], rank=o.get('rank'), rankAll=o.get('rankAll'), rank30=o.get('rank30')) for o in sorted(s['opposing'], key=lambda o: -o['cost'])[:6]],
        kalshi={kk: vv for kk, vv in k.items()}, risks=s.get('risks', []))
TRADERS = []
for w, c in cappers.items():
    st = TSTAT.get(w) or {}
    TRADERS.append(dict(wallet=w, name=wname(w), rank=c['rank'], rankAll=c.get('rankAll'), rank30=c.get('rank30'), pnl30=round(c['pnl30']) if c.get('pnl30') is not None else None, sportsPct=c.get('sports_pct'), pnl=round(c.get('total_pnl') or 0), wr=c.get('win_rate'), resolved=c.get('resolved_markets'),
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
    if any((b.get('resolved') or 0) < 10 for b in s_['backers'] if b.get('resolved') is not None): r.append('At least one backer has fewer than 10 markets resolved all-time.')
    if s_.get('split'): r.append(f"Split: only {round((s_.get('one_sided_share') or 0)*100)}% of qualified-whale money is on this side.")
    if s_.get('pricier') and s_.get('over_cents') is not None: r.append(f"Pricier: current price is {s_['over_cents']}¢ above the whales' average entry.")
    if (s_.get('game') or {}).get('src') != 'ESPN': r.append('Start time not confirmed by ESPN (' + (s_.get('game') or {}).get('src', 'unknown') + ').')
    return r
for s_ in CONS + FUN + POLY + GLUE + PROPS + LONGSHOTS + BIGGEST: s_['risks'] = risks(s_)
out = dict(scannedAt=pt(NOW), ts=NOW, secs=round(time.time() - T0), settings=dict(cappers=A.cappers, min=A.min, wallets=A.wallets, markets=A.markets, windowH=12),
    coverage=dict(cappers=len(cappers), qualified=sum(qualifies(c) for c in cappers.values()), golden=sum(golden(c) for c in cappers.values()),
                  marketsFound=found_markets, marketsInWindow=in_window, marketsScanned=min(30, len(ONK)), hedgedExcluded=two_sided, twoSidedExcluded=two_sided, lbAll=LB, lb30=LB, notOnKalshi=len(NOT_ON_KALSHI), picksOnKalshi=len(ONK), sideGroups=len(signals),
                  walletsLoaded=len(POS), positionsLoaded=sum(len(v) for v in POS.values()), bets=len(BETS), buysRaw=len(RAW_BUYS), buys=len(BUYS),
                  orcaCalls=CALLS['n'], orcaErrors=CALLS['errors'][:10], kalshiSeries=len(KM), kalshiMatched=len(ONK),
                  espnLeagues=len({k[0] for k in ESPN})),
    signals=[slim(s) for s in CONS[:20]], totalSignals=len(CONS), fun=[slim(s) for s in FUN[:20]], totalFun=len(FUN),
    poly=[slim(s) for s in POLY[:20]], totalPoly=len(POLY), glue=[slim(s) for s in GLUE[:12]], totalGlue=len(GLUE),
    props=[slim(s) for s in PROPS[:20]], totalProps=len(PROPS), longshots=[slim(s) for s in LONGSHOTS[:20]], totalLongshots=len(LONGSHOTS),
    biggest=[slim(s) for s in BIGGEST[:30]], totalBiggest=len(BIGGEST),
    bets=BETS[:220], buys=BUYS[:160], traders=TRADERS,
    history=sorted([dict(id=k, **{kk: v[kk] for kk in ('tier', 'q', 'label', 'score', 'whales', 'invested', 'start', 'kalshi', 'kprice', 'first_seen', 'last_seen', 'scans', 'result', 'graded') if kk in v},
                         active=k in cur_ids) for k, v in hist['picks'].items()], key=lambda x: -x['last_seen'])[:80],
    scans=hist['scans'][-20:])
json.dump(out, open(os.path.join(HERE, 'page_data.json'), 'w'), separators=(',', ':'))
print(f"consensus={len(CONS)} fun={len(FUN)} poly={len(POLY)} glue={len(GLUE)} props={len(PROPS)} longshots={len(LONGSHOTS)} biggest={len(BIGGEST)} all={len(signals)} groups={len(signals)} onKalshi={len(ONK)} offKalshi={len(OFFK)} cappers={len(cappers)} orca_calls={CALLS['n']} errors={len(CALLS['errors'])} secs={out['secs']} kalshi_ok={out['coverage']['kalshiMatched']}")
for s in CONS[:8] + GLUE[:2] + FUN[:3] + POLY[:3] + PROPS[:3] + LONGSHOTS[:3] + BIGGEST[:3]: print(len(s['backers']), s['net'], s.get('one_sided_share'), s.get('price_band'), s.get('strength'), s['question'], '|', s['label'], '|', s['invested'], '|', s['kalshi'].get('action'), s['kalshi'].get('contract'), s['kalshi'].get('price'), 'biggest' if s in BIGGEST and s not in CONS and s not in FUN and s not in POLY and s not in PROPS and s not in LONGSHOTS and s not in GLUE else ('longshot' if s in LONGSHOTS else ('prop' if s in PROPS else ('poly' if s in POLY else ('glue' if s in GLUE else ('fun' if s in FUN else 'top'))))))
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
