#!/usr/bin/env python3
"""Open $500+ pre-game positions of every proven-floor capper, straight from Polymarket's public Data API (v2).

Why: the full scan only sees positions at scan time and only inside a 36h window, and the hourly refresh never loads new
positions, so a floor capper's fresh or days-out bet (NFL, college football, a bet opened after the scan) never reached Coming Up.
This module loads each floor capper's open positions on every run (scan and refresh), then reuses the scanner's own Kalshi
matcher and ESPN game locator (extracted from scan.py with ast, so there is one copy of that logic) to build the same rows
scan.py builds for Coming Up. Window: games up to 7 days out.
"""
import ast, collections, datetime as dt, hashlib, json, math, os, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
BASE = 'https://data-api.polymarket.com/v2'
WINDOW_DAYS = 7
MIN_COST = 500
_KEEP_ASSIGN = {'ESPORTS', 'KSER', 'KALT', 'NAME_ONLY', 'KM', 'KPROP', 'STAT_PAT', 'STAT_WORDS', 'MON', 'EP', 'ESPN', 'TZOFF', 'ET', 'SLUG_RE', 'PT'}
_SKIP_DEF = {'fetch_pos', 'lb_rows', 'classify', '_pool_add', '_poly_sports_board', 'wname', 'qual_h', 'gold_h', 'qualifies', 'golden'}
_NS = {}


def _targets(n):
    out = []
    for t in n.targets:
        if isinstance(t, ast.Name):
            out.append(t.id)
        elif isinstance(t, ast.Tuple):
            out += [e.id for e in t.elts if isinstance(e, ast.Name)]
    return out


def scan_ns(now):
    """Namespace holding scan.py's pure helpers (parse, kalshi, locate, ...), built from its source without running the scan."""
    key = int(now // 3600)
    if _NS.get('key') == key:
        return _NS['ns']
    src = open(os.path.join(HERE, 'scan.py')).read()
    tree = ast.parse(src)
    ns = dict(json=json, time=time, re=re, os=os, sys=sys, math=math, hashlib=hashlib, collections=collections, dt=dt,
              urllib=urllib, NOW=int(now), WIN_END=int(now + WINDOW_DAYS * 86400), HERE=HERE, __name__='scan_helpers')
    keep = []
    for n in tree.body:
        if isinstance(n, ast.FunctionDef):
            if n.name in _SKIP_DEF:
                continue
            keep.append(n)
        elif isinstance(n, (ast.Import, ast.ImportFrom)):
            keep.append(n)
        elif isinstance(n, ast.Assign):
            tg = _targets(n)
            if tg and all(t in _KEEP_ASSIGN or t in ('KCACHE', 'LCACHE') for t in tg):
                keep.append(n)
        elif isinstance(n, ast.Try) and 'kalshi_leagues' in ast.unparse(n):
            keep.append(n)
        elif isinstance(n, ast.Expr) and 'STAT_WORDS' in ast.unparse(n):
            keep.append(n)
    # drop the `from orca import ...` line and argparse-dependent statements
    keep = [n for n in keep if not (isinstance(n, ast.ImportFrom) and n.module == 'orca')]
    mod = ast.Module(body=keep, type_ignores=[])
    exec(compile(mod, 'scan_helpers', 'exec'), ns)
    ns['TODAY_ET'] = dt.datetime.fromtimestamp(now, dt.timezone(dt.timedelta(hours=-5))).date()
    _NS['key'] = key
    _NS['ns'] = ns
    return ns


def _get(url, tries=6):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 whale-scanner'}), timeout=30) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(min(8 + 4 * i, 40))
                continue
            return None
        except Exception:
            time.sleep(2 * (i + 1))
    return None


_POS_CACHE = {}


def fetch_positions(wallet, max_pages=3):
    """Cached per process (the hot-week list re-uses the floor reads)."""
    if wallet in _POS_CACHE:
        return _POS_CACHE[wallet]
    r = _fetch_positions(wallet, max_pages)
    if r is not None:
        _POS_CACHE[wallet] = r
    return r


def _fetch_positions(wallet, max_pages=3):
    """Open positions for one wallet, or None when the API could not be read (never an empty list on failure)."""
    rows, cur = [], None
    for _ in range(max_pages):
        u = BASE + '/positions?user=' + wallet + '&limit=100' + ('&cursor=' + urllib.parse.quote(cur) if cur else '')
        d = _get(u)
        if d is None:
            return None if not rows else rows
        rows += [x for x in d.get('data') or [] if x.get('status') == 'OPEN']
        cur = (d.get('pagination') or {}).get('next_cursor')
        if not cur or not (d.get('data') or []):
            break
        # ordered by current value (desc): once the page has no open position left, stop
        if not any(x.get('status') == 'OPEN' for x in d.get('data') or []):
            break
        time.sleep(0.4)
    return rows


_GAMMA = {}


def _gamma_event(event_slug):
    """(start ts, title) of the Polymarket event, from the public Gamma API."""
    if event_slug in _GAMMA:
        return _GAMMA[event_slug]
    d = _get('https://gamma-api.polymarket.com/events?slug=' + urllib.parse.quote(event_slug or ''), tries=2)
    e = d[0] if isinstance(d, list) and d else {}
    ts = None
    for raw in [e.get('startTime')] + [m.get('gameStartTime') for m in e.get('markets') or []]:
        if not raw:
            continue
        try:
            ts = int(dt.datetime.fromisoformat(str(raw).replace('Z', '+00:00').replace(' ', 'T')).timestamp())
            break
        except Exception:
            continue
    _GAMMA[event_slug] = (ts, e.get('title') or '')
    return _GAMMA[event_slug]


def _locate_fallback(ns, info, kal, cid, event_slug, g, ts):
    """Spread bets name one team only, so the scanner's ESPN match can come back empty (a team playing two days in a row).
    Try the two team codes in the slug, then the Polymarket event's own start time."""
    try:
        info2 = dict(info, fav=None, team=None, teams=[])
        g2, ts2 = ns['locate'](info2, None, kal)
        if ts2:
            return g2, ts2
    except Exception:
        pass
    ts3, title = _gamma_event(event_slug)
    if ts3:
        g = dict(g or {}, start=ns['pt'](ts3), src='Polymarket event time')
        if title and not g.get('name'):
            g['name'] = title.replace(' vs. ', ' vs ')
        return g, ts3
    return g, ts


def floor_wallets(capper_history):
    """Cappers with a positive profit that are not Cooling, market makers or one-off records: {wallet: capper record}."""
    import coming_up as cu
    out = {}
    for c in (capper_history or {}).get('cappers') or []:
        w = (c.get('wallet') or '').lower()
        if w and c.get('badge') != 'Cooling' and cu.is_hot_or_elite(c, set()):
            out[w] = c
    return out


def build_rows(capper_history, now=None, positions=None, log=print, wallets=None, label='floor'):
    """Lean-bet rows (same shape scan.py builds) for every floor capper's open $500+ position, games up to 7 days out.

    Returns (rows, ok_wallets). Wallets whose positions could not be read are left out of ok_wallets so callers can keep
    their previous rows instead of dropping them."""
    now = now or time.time()
    ns = scan_ns(now)
    fl = wallets if wallets is not None else floor_wallets(capper_history)
    wins_end = int(now + WINDOW_DAYS * 86400)
    d_lo = (dt.datetime.fromtimestamp(now, ns['ET']) - dt.timedelta(days=1)).date()
    d_hi = dt.datetime.fromtimestamp(wins_end, ns['ET']).date()
    ns['WIN_END'] = wins_end
    if positions is None:
        with ThreadPoolExecutor(max_workers=8) as ex:
            positions = dict(zip(list(fl), ex.map(fetch_positions, list(fl))))
    ok = {w for w, p in positions.items() if p is not None}
    rows = []
    for w, ps in positions.items():
        c = fl.get(w)
        if not c or ps is None:
            continue
        sides = collections.defaultdict(set)
        for p in ps:
            sides[p.get('condition_id')].add(p.get('outcome_index'))
        for p in ps:
            slug = p.get('slug') or ''
            sd = ns['slug_date'](slug)
            if not ns['SLUG_RE'].match(slug) or not sd or not (d_lo <= sd <= d_hi):
                continue
            cp = p.get('current_price')
            if cp is None or cp >= 0.99 or cp <= 0.01:
                continue
            if len(sides[p.get('condition_id')]) > 1:
                continue  # capper holds both sides: a hedge, not a pick
            cost = p.get('entry_cost_usdc') or p.get('total_cost_usdc') or 0
            if cost < MIN_COST:
                continue
            q = p.get('title') or ''
            try:
                info = ns['parse'](dict(slug=slug, question=q))
            except Exception:
                info = dict(league=slug.split('-')[0], codes=[], date=str(sd), tail='', kind='other', teams=[])
            side = 'yes' if int(p.get('outcome_index') or 0) == 0 else 'no'
            avg = p.get('avg_price')
            cid = p.get('condition_id')
            kal = ns['kal_for'](info, side, avg, cp, (cid, side))
            g, ts = ns['loc_for'](info, None, kal, cid)
            if ts is None:
                g, ts = _locate_fallback(ns, info, kal, cid, p.get('event_slug') or slug, g, ts)
            if g.get('state') == 'post':
                continue
            if ts is not None and not (now - 3 * 3600 <= ts <= wins_end):
                continue
            if ts is None and sd < ns['TODAY_ET']:
                continue
            rows.append(dict(
                wallet=w, name=c.get('name') or p.get('name') or (w[:6] + '…' + w[-4:]), rank=c.get('rank'), rankAll=c.get('rankAll'), rank30=c.get('rank30'),
                _info=info, lastTs=p.get('last_event_at'), wr=c.get('wr'), resolved=None, cpnl=None, qualified=True, golden=False, skill=False,
                q=q, slug=slug, market_id=str(p.get('market_id') or ''), cid=cid, side=side,
                label=info.get(side) or p.get('outcome'), outcome=p.get('outcome'), kind=ns['bet_kind'](info, q), league=info['league'].upper(),
                shares=round(p.get('current_size') or 0, 1), avg=avg, now=cp, cost=round(cost), value=round(p.get('current_value') or 0),
                upnl=round(p.get('unrealized_pnl') or 0), upct=p.get('percent_pnl'), firstTs=p.get('first_entry_at'), cons={}, top100=True,
                src='floor positions', kalshi=kal, game=g, startTs=int(ts) if ts else None, phase=ns['phase'](g, ts)))
    log(f'{label} positions: {len(fl)} cappers, {len(ok)} read, {len(rows)} open $500+ bets with a game inside {WINDOW_DAYS} days')
    return rows, ok


def check_missing(rows, coming_up, now=None):
    """Safeguard: every floor capper's open $500+ pre-game position with a Kalshi line must be on a Coming Up card.
    Returns the ones that are not, each with the reason. Positions on a finished game or priced under 3c / over 97c are the
    allowed filters, so they are not counted as missing."""
    import coming_up as cu
    now = now or time.time()
    placed = set()
    for g in coming_up or []:
        for m in g.get('markets') or []:
            for s in m.get('sides') or []:
                for b in s.get('backers') or []:
                    placed.add(((b.get('wallet') or '').lower(), str(m.get('id')), s.get('side')))
    missing = []
    for r in rows or []:
        k = r.get('kalshi') or {}
        kp = k.get('price') if k.get('status') == 'ok' else None
        if kp is None:
            continue  # no Kalshi line: allowed filter
        if kp < 0.03 or kp > 0.97:
            continue  # resolved / priced out: allowed filter
        ts = r.get('startTs') or 0
        if ts and ts < now - 3 * 3600:
            continue  # finished
        if (r.get('wallet') or '').lower() + '' and ((r.get('wallet') or '').lower(), str(r.get('cid')), r.get('side')) in placed:
            continue
        if ts and ts > now + WINDOW_DAYS * 86400:
            why = 'game is more than %d days out' % WINDOW_DAYS
        elif not ts:
            why = 'game start time unknown'
        else:
            why = 'not placed on a Coming Up card (builder dropped it)'
        missing.append(dict(wallet=r.get('wallet'), name=r.get('name'), q=r.get('q'), label=r.get('label'), cost=r.get('cost'), avg=r.get('avg'),
                            startTs=ts or None, ticker=k.get('ticker'), reason=why))
    return missing


if __name__ == '__main__':
    d = json.load(open(os.path.join(os.path.dirname(HERE), 'data.json')))
    rows, ok = build_rows(d.get('capperHistory') or {})
    for r in rows:
        k = r['kalshi']
        print(r['name'][:18], '|', r['q'][:44], '|', r['label'], '$%d' % r['cost'], r['avg'], '|', (r['game'] or {}).get('start'), '|', k.get('status'), k.get('price'), (k.get('contract') or k.get('why') or '')[:44])
