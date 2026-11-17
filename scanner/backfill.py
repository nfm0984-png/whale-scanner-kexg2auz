#!/usr/bin/env python3
"""Backfill grading (Noel, Nov 15): every tracked whale's settled sports bets over the last 90 days,
from Polymarket's public Data API v2 (no key), so capper records are not limited to what the scanner saw.

  GET /v2/positions?user=<w>&status=CLOSED|REDEEMABLE&sort_by=TIMESTAMP&start=<epoch>
CLOSED = redeemed or sold, REDEEMABLE = resolved but not redeemed (includes losers at price 0).
A position is graded W when the market resolved to its outcome (current_price ~1), L at ~0, push at 0.5.
Only sports game markets (slug like "<league>-<team>-<team>-YYYY-MM-DD...") and only $500+ bets
(total_size x avg_price) are kept. If a whale holds both sides of a market, only the bigger side counts.
Lookback is 90 days so big-bet records (stake >= max($500, 1.5x median)) can be graded over 60+ days.

Incremental + cached: raw rows live in .cache/backfill_raw.json (gitignored, kept between Actions runs with
actions/cache); each wallet is re-read from (last fetch - 3 days), at most every 3h, or the full 90-day
lookback when the cache is missing or does not yet reach ~90 days (e.g. an older 30-day cache). Only compact
per-wallet aggregates are committed (backfill.json):
  cells["SPORT|day"] = [w, l, push, risked, profit, cw, cl, crisked, cprofit]   (day = epoch day, UTC)
  med/max bet size, n graded, and the 8 most recent graded bets for the capper detail.
Raw rows: pid -> [cost, avg, result, ts, slug, outcome]
"""
import json, os, re, time, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, 'backfill.json')
RAW = os.path.join(HERE, '.cache', 'backfill_raw.json')
BASE = 'https://data-api.polymarket.com/v2'
DAYS = 90
KEEP_DAYS = 90
MIN_COST = 500.0
MAX_AGE = 3 * 3600
OVERLAP = 3 * 86400
MAX_PAGES = 5
SLUG_RE = re.compile(r'^([a-z][a-z0-9]{1,11})-(.+?)-(\d{4})-(\d{2})-(\d{2})(?:-.*)?$')
NOT_SPORT = {'will', 'what', 'who', 'how', 'when', 'which', 'us', 'fed', 'btc', 'eth', 'sol', 'xrp', 'bitcoin', 'ethereum',
             'trump', 'election', 'presidential', 'highest', 'lowest', 'nyc', 'new', 'largest', 'top', 'elon', 'tweets'}

def _get(path, params, tries=4):
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(e.headers.get('Retry-After') or 2) + i); continue
            if e.code >= 500:
                time.sleep(1 + i); continue
            return None
        except Exception:
            time.sleep(1 + i)
    return None

def league_of_slug(slug):
    m = SLUG_RE.match(slug or '')
    if not m or m.group(1) in NOT_SPORT:
        return None
    return m.group(1).upper()

def slug_date(slug):
    m = SLUG_RE.match(slug or '')
    return '-'.join(m.group(3, 4, 5)) if m else None

def _load(p):
    try:
        d = json.load(open(p))
        d.setdefault('wallets', {})
        return d
    except Exception:
        return {'updatedTs': 0, 'wallets': {}}

def _save(d, p):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    d['updatedTs'] = int(time.time())
    tmp = p + '.tmp'
    json.dump(d, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, p)

def load():
    """Committed compact aggregates (what capper_history reads)."""
    return _load(PATH)

# ---- sport buckets (per-sport records) ----
SPORT_EXACT = {
    'NBA': 'NBA', 'WNBA': 'WNBA', 'CBB': 'NCAAB', 'CWBB': 'NCAAB', 'NCAAB': 'NCAAB', 'NFL': 'NFL', 'CFB': 'NCAAF', 'NCAAF': 'NCAAF',
    'CFL': 'Football (other)', 'UFL': 'Football (other)', 'NHL': 'NHL', 'AHL': 'Hockey (other)', 'KHL': 'Hockey (other)', 'SHL': 'Hockey (other)',
    'LIIGA': 'Hockey (other)', 'DEL': 'Hockey (other)', 'MLB': 'MLB', 'KBO': 'Baseball (other)', 'NPB': 'Baseball (other)',
    'ATP': 'Tennis', 'WTA': 'Tennis', 'ITF': 'Tennis', 'CHALL': 'Tennis', 'UFC': 'MMA', 'MMA': 'MMA', 'PFL': 'MMA', 'BOX': 'Boxing', 'BOXING': 'Boxing',
    'CS2': 'Esports', 'CSGO': 'Esports', 'DOTA2': 'Esports', 'LOL': 'Esports', 'VAL': 'Esports', 'OW': 'Esports', 'R6': 'Esports', 'RL': 'Esports', 'COD': 'Esports',
    'EUROLEAGUE': 'Basketball (intl)', 'EUROCUP': 'Basketball (intl)', 'NBL': 'Basketball (intl)', 'CRINT': 'Cricket', 'IPL': 'Cricket', 'CRIC': 'Cricket',
    'PGA': 'Golf', 'LPGA': 'Golf', 'LIV': 'Golf', 'F1': 'Racing', 'NASCAR': 'Racing', 'DARTS': 'Darts',
}
def sport_of(league):
    lg = (league or '').upper()
    if not lg:
        return 'Other'
    if lg in SPORT_EXACT:
        return SPORT_EXACT[lg]
    if lg.startswith('BK'):
        return 'Basketball (intl)'
    if lg.startswith('CR'):
        return 'Cricket'
    return 'Soccer'  # Polymarket's many short league codes (UNL, EPL, SEA, EL1, JA2, ...) are soccer

def _profit(cost, avg, res):
    if res == 'W' and avg > 0:
        return cost * (1 - avg) / avg
    if res == 'L':
        return -cost
    return 0.0

def _med(xs):
    xs = sorted(xs)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2.0

def aggregate(raw):
    out = {'updatedTs': int(time.time()), 'days': DAYS, 'minCost': MIN_COST, 'wallets': {}}
    for w, rec in (raw.get('wallets') or {}).items():
        bets = rec.get('bets') or {}
        cells = {}
        costs = []
        a_sum = a_n = a_near = 0.0
        c_sum = c_n = 0.0
        for pid, (cost, avg, res, ts, slug, outcome) in bets.items():
            sp = sport_of(league_of_slug(slug))
            key = sp + '|' + str(int((ts or 0) // 86400))
            c = cells.setdefault(key, [0, 0, 0, 0.0, 0.0, 0, 0, 0.0, 0.0])
            costs.append(cost)
            if res == 'push':
                c[2] += 1
                continue
            pr = _profit(cost, avg, res)
            c[0 if res == 'W' else 1] += 1
            c[3] += cost
            c[4] += pr
            if res in ('W', 'L') and avg and avg > 0:
                a_sum += avg
                a_n += 1
                if avg >= 0.90:
                    a_near += 1
            if 0.10 <= avg < 0.95:  # copyable price band (same 10-94c rule as scanner picks)
                c[5 if res == 'W' else 6] += 1
                c[7] += cost
                c[8] += pr
                if res in ('W', 'L'):
                    c_sum += avg
                    c_n += 1
        for c in cells.values():
            c[3], c[4], c[7], c[8] = round(c[3]), round(c[4]), round(c[7]), round(c[8])
        # Kalshi-usable share (Nov 15): bets in leagues with a Kalshi series, last 30 days
        try:
            from kalshi_leagues import KALSHI_LEAGUES as _KL
        except Exception:
            _KL = frozenset()
        k_n = sum(1 for r in bets.values() if ((r[4] or '').split('-')[0] in _KL))
        recent = sorted(bets.values(), key=lambda r: -(r[3] or 0))[:8]
        med = _med(costs)
        floor = max(MIN_COST, 1.5 * med) if med else MIN_COST
        bw = bl = 0
        brk = bpf = 0.0
        bts = []
        for cost, avg, res, ts, slug, outcome in bets.values():
            if res not in ('W', 'L') or cost < floor:
                continue
            pr = _profit(cost, avg, res)
            if res == 'W':
                bw += 1
            else:
                bl += 1
            brk += cost
            bpf += pr
            if ts:
                bts.append(int(ts))
        span = ((max(bts) - min(bts)) / 86400.0) if len(bts) >= 2 else (0.0 if bts else None)
        big = {
            'w': bw, 'l': bl, 'n': bw + bl, 'profit': round(bpf, 2), 'risked': round(brk, 2),
            'roi': round(100.0 * bpf / brk, 1) if brk else None,
            'spanDays': round(span, 1) if span is not None else None,
            'firstTs': min(bts) if bts else None, 'lastTs': max(bts) if bts else None,
            'floor': round(floor, 2), 'med': round(med, 2) if med else None,
        }
        out['wallets'][w] = {'ts': rec.get('ts'), 'full': bool(rec.get('full')), 'n': len(bets),
                             'med': round(med) if med else None, 'max': round(max(costs)) if costs else None,
                             'avgAll': round(a_sum / a_n, 4) if a_n else None, 'nAll': int(a_n), 'nNear': int(a_near),
                             'avgCopy': round(c_sum / c_n, 4) if c_n else None, 'nCopy': int(c_n),
                             'kN': k_n, 'kShare': round(k_n / len(bets), 3) if bets else None, 'cells': cells,
                             'recent': [[r[4], r[5], round(r[0]), r[1], r[2], r[3]] for r in recent], 'big': big}
    tmp = PATH + '.tmp'
    json.dump(out, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, PATH)
    return out

def _pages(params, max_pages=MAX_PAGES):
    out, cur = [], None
    for _ in range(max_pages):
        p = dict(params)
        if cur:
            p = {'user': params['user'], 'cursor': cur}
        r = _get('/positions', p)
        if not isinstance(r, dict) or not isinstance(r.get('data'), list):
            return out, False
        out.extend(r['data'])
        pg = r.get('pagination') or {}
        st = params.get('start')
        if st and r['data'] and (r['data'][-1].get('last_event_at') or 0) < st:
            return out, True
        cur = pg.get('next_cursor')
        if not pg.get('has_more') or not cur:
            return out, True
    return out, True

def _grade(x):
    px = x.get('current_price')
    try:
        px = float(px)
    except (TypeError, ValueError):
        return None
    if px >= 0.99:
        return 'W'
    if px <= 0.01:
        return 'L'
    if abs(px - 0.5) < 0.011 and (x.get('status') == 'CLOSED' or x.get('redeemable')):
        return 'push'
    return None

def fetch_wallet(w, since):
    rows, ok_all = {}, True
    for st in ('CLOSED', 'REDEEMABLE'):
        xs, ok = _pages({'user': w, 'status': st, 'sort_by': 'TIMESTAMP', 'sort_direction': 'DESC', 'start': int(since), 'limit': 1000})
        ok_all = ok_all and ok
        for x in xs:
            slug = x.get('slug') or ''
            if not league_of_slug(x.get('event_slug') or slug):
                continue
            try:
                avg = float(x.get('avg_price') or 0)
                cost = float(x.get('total_size') or 0) * avg
            except (TypeError, ValueError):
                continue
            res = _grade(x)
            if not res or avg <= 0:
                continue
            cid = x.get('condition_id') or ''
            side = 'yes' if int(x.get('outcome_index') or 0) == 0 else 'no'
            ts = int(x.get('last_event_at') or 0)
            if ts < since:
                continue
            prev = rows.get(cid)
            if prev is None or cost > prev[0]:
                rows[cid] = [round(cost, 2), round(avg, 4), res, ts, slug, (x.get('outcome') or '')[:40], side]
    out = {}
    for cid, r in rows.items():
        if r[0] >= MIN_COST:
            out[cid + ':' + r[6]] = r[:6]
    return out, ok_all

def refresh(wallets, force=False, workers=8, budget_s=600):
    store = _load(RAW)
    ws = store['wallets']
    now = time.time()
    t0 = now
    todo = []
    want = now - DAYS * 86400

    def _oldest(rec):
        ts = [v[3] for v in (rec.get('bets') or {}).values() if isinstance(v, (list, tuple)) and len(v) > 3 and v[3]]
        return min(ts) if ts else None

    def _covered(rec):
        # 'full' from a shorter lookback (the old 30-day cache) is not enough; need bets back to ~DAYS.
        if not rec.get('full'):
            return False
        oldest = _oldest(rec)
        return oldest is not None and oldest <= want + OVERLAP

    for w in dict.fromkeys(x.lower() for x in wallets if x):
        rec = ws.get(w) or {}
        if force or now - rec.get('ts', 0) > MAX_AGE or not _covered(rec):
            todo.append(w)
    # shortest history first, then oldest fetch, so a time budget fills the 90-day gaps first
    todo.sort(key=lambda w: (_oldest(ws.get(w) or {}) or now, (ws.get(w) or {}).get('ts', 0)))
    def job(w):
        if time.time() - t0 > budget_s:
            return w, None, False
        rec = ws.get(w) or {}
        since = max(want, (rec.get('ts') or 0) - OVERLAP) if _covered(rec) else want
        bets, ok = fetch_wallet(w, since)
        return w, bets, ok
    n_ok = n_new = 0
    if todo:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            for w, bets, ok in ex.map(job, todo):
                if bets is None:
                    continue
                rec = ws.setdefault(w, {'bets': {}})
                before = len(rec['bets'])
                rec['bets'].update(bets)
                n_new += len(rec['bets']) - before
                rec['ts'] = int(now)
                if ok:
                    rec['full'] = True
                    n_ok += 1
    cut = now - KEEP_DAYS * 86400
    for w, rec in ws.items():
        rec['bets'] = {k: v for k, v in (rec.get('bets') or {}).items() if (v[3] or 0) >= cut}
    _save(store, RAW)
    aggregate(store)
    tot = sum(len(r.get('bets') or {}) for r in ws.values())
    print(f"backfill: {len(todo)} wallets due, {n_ok} fetched ok, {n_new} new graded $500+ sports bets, {tot} cached across {len(ws)} wallets ({time.time() - t0:.0f}s)")
    return store

def fetch_open(w, limit=1000):
    """Current open sports positions for one wallet (for Proven Picks)."""
    # most recently traded first (a long list of stale, unsettled old positions otherwise crowds out today's games)
    xs, _ = _pages({'user': w, 'status': 'OPEN', 'sort_by': 'TIMESTAMP', 'sort_direction': 'DESC', 'limit': limit,
                    'start': int(time.time() - 10 * 86400)}, max_pages=2)
    out = []
    for x in xs:
        slug = x.get('slug') or ''
        lg = league_of_slug(x.get('event_slug') or slug)
        if not lg:
            continue
        try:
            avg = float(x.get('avg_price') or 0)
            cost = float(x.get('total_cost_usdc') or 0) or float(x.get('total_size') or 0) * avg
        except (TypeError, ValueError):
            continue
        out.append(dict(pid=(x.get('condition_id') or '') + ':' + ('yes' if int(x.get('outcome_index') or 0) == 0 else 'no'),
                        cid=x.get('condition_id'), side='yes' if int(x.get('outcome_index') or 0) == 0 else 'no',
                        title=x.get('title') or '', slug=slug, eventSlug=x.get('event_slug') or '', league=lg,
                        outcome=x.get('outcome') or '', opp=x.get('opposite_outcome') or '', avg=round(avg, 4),
                        now=x.get('current_price'), cost=round(cost, 2), endDate=x.get('end_date'),
                        lastTs=x.get('last_event_at'), firstTs=x.get('first_entry_at')))
    return out

if __name__ == '__main__':
    import sys
    sys.path.insert(0, HERE)
    import capper_history as ch
    ws = list(ch.load_tracked_wallets().keys())
    ws += sorted({w for r in ch.load()['picks'].values() for w in (r.get('backers') or {})})
    refresh(ws, force='--force' in sys.argv)
