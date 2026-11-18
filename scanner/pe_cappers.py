"""Politics & Econ: established Polymarket wallets in politics / economics / finance (public Data API v2 leaderboard)."""
import json, os, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

BASE = 'https://data-api.polymarket.com/v2/leaderboard'
CATS = ('politics', 'economics', 'finance')
BOARD_DEPTH = 200      # one page per category on the month board
MIN_MONTH = 5000.0     # category month profit
MIN_PRIOR = 20000.0    # all-time minus month profit: profit made before this month (drops one-month wonders)
MIN_MARGIN = 0.03      # month profit / month volume; below it is market-maker flow
MAX_WALLETS = 120
PER_CAT = 70


def _get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'}), timeout=25) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(2 + 2 * i); continue
            if e.code >= 500:
                time.sleep(1 + i); continue
            return None
        except Exception:
            time.sleep(1 + i)
    return None


def _board(cat):
    r = _get(BASE + '?' + urllib.parse.urlencode(dict(category=cat, time_period='month', sort_by='PNL', limit=BOARD_DEPTH)))
    return (r or {}).get('data') or []


def _user(cat, per, w):
    r = _get(BASE + '?' + urllib.parse.urlencode(dict(category=cat, time_period=per, user=w)))
    d = (r or {}).get('data')
    if isinstance(d, dict) and d.get('pnl') is not None:
        return dict(pnl=float(d['pnl']), vol=float(d.get('volume') or 0))
    return None if r is None else dict(pnl=0.0, vol=0.0)


def build(log=print):
    """-> list of {wallet, name, cats: {cat: {month, all, margin}}, month, all, prior} sorted by total month profit."""
    cand = {}
    for cat in CATS:
        for x in sorted(_board(cat), key=lambda y: -float(y.get('pnl') or 0))[:PER_CAT]:
            w = (x.get('user_id') or '').lower()
            if not w.startswith('0x') or float(x.get('pnl') or 0) < MIN_MONTH:
                continue
            vol = float(x.get('volume') or 0)
            if vol <= 0 or float(x['pnl']) / vol < MIN_MARGIN:
                continue
            cand.setdefault(w, x.get('user_name') or '')
    log(f'politics/econ: {len(cand)} month-board candidates')
    jobs = [(w, c, p) for w in cand for c in CATS for p in ('month', 'all')]
    with ThreadPoolExecutor(max_workers=8) as ex:
        res = list(ex.map(lambda j: _user(j[1], j[2], j[0]), jobs))
    by = {}
    for (w, c, p), r in zip(jobs, res):
        by.setdefault(w, {}).setdefault(c, {})[p] = r
    out = []
    for w, name in cand.items():
        cats = {}
        ok = True
        for c in CATS:
            m = (by[w].get(c) or {}).get('month')
            a = (by[w].get(c) or {}).get('all')
            if m is None or a is None:
                ok = False
                break
            cats[c] = dict(month=round(m['pnl']), all=round(a['pnl']), margin=(m['pnl'] / m['vol']) if m['vol'] > 0 else None)
        if not ok:
            continue
        # qualify on the category where the wallet earns the most this month
        best = max(CATS, key=lambda c: cats[c]['month'])
        b = cats[best]
        prior = b['all'] - b['month']
        if b['month'] < MIN_MONTH or b['all'] <= 0 or prior < MIN_PRIOR or (b['margin'] is not None and b['margin'] < MIN_MARGIN):
            continue
        if sum(v['month'] for v in cats.values()) <= 0 or sum(v['all'] for v in cats.values()) <= 0:
            continue  # net losing across the three boards (a big loss in one category offsets the win)
        out.append(dict(wallet=w, name=name if name and not name.startswith('0x') else (w[:6] + '…' + w[-4:]), best=best, cats={c: dict(month=v['month'], all=v['all']) for c, v in cats.items()},
                        month=sum(v['month'] for v in cats.values()), all=sum(v['all'] for v in cats.values()), prior=prior))
    out.sort(key=lambda r: -r['cats'][r['best']]['month'])
    out = out[:MAX_WALLETS]
    log(f'politics/econ: {len(out)} established cappers')
    return out


if __name__ == '__main__':
    r = build()
    for x in r[:15]:
        print(x['name'][:22], x['wallet'][:8], x['best'], x['cats'])
