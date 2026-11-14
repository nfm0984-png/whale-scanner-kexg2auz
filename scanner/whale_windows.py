#!/usr/bin/env python3
"""Per-whale Polymarket P&L by window (past week, month, year, all time).

Public Polymarket Data API v2 (no key):
  GET /v2/leaderboard?time_period=week|month|all&user=<wallet>  -> pnl, volume, rank_pnl
  GET /v2/user-pnl?user=<wallet>&interval=all&fidelity=1d        -> cumulative realized P&L series
The leaderboard has no year window, so past-year P&L = all-time realized P&L minus the
cumulative realized P&L on the last daily point at or before 365 days ago (0 if the
wallet's history starts inside the year).
Results are cached in whale_windows.json so a failed fetch keeps the last good number.
"""
import json, os, time, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, 'whale_windows.json')
BASE = 'https://data-api.polymarket.com/v2'
MAX_AGE = 3 * 3600  # refetch after 3h

def _get(path, params, tries=3):
    url = BASE + path + '?' + urllib.parse.urlencode(params)
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'})
            with urllib.request.urlopen(req, timeout=20) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(float(e.headers.get('Retry-After') or 2) + i)
                continue
            if e.code >= 500:
                time.sleep(1 + i); continue
            return None
        except Exception:
            time.sleep(1 + i)
    return None

def load():
    try:
        return json.load(open(PATH))
    except Exception:
        return {'updatedTs': 0, 'wallets': {}}

def save(d):
    d['updatedTs'] = int(time.time())
    tmp = PATH + '.tmp'
    json.dump(d, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, PATH)

def fetch_one(wallet):
    w = wallet.lower()
    out = {'ts': int(time.time())}
    for per in ('week', 'month', 'all'):
        r = _get('/leaderboard', {'time_period': per, 'user': w})
        d = (r or {}).get('data') if isinstance(r, dict) else None
        if isinstance(d, dict) and d.get('pnl') is not None:
            out[per] = {'pnl': round(float(d['pnl']), 2), 'vol': round(float(d.get('volume') or 0), 2), 'rank': d.get('rank_pnl')}
            if d.get('user_name'):
                out['name'] = d['user_name']
        elif isinstance(r, dict) and 'data' in r and r['data'] is None:
            out[per] = {'pnl': 0.0, 'vol': 0.0, 'rank': None, 'none': True}
    r = _get('/user-pnl', {'user': w, 'interval': 'all', 'fidelity': '1d'})
    pts = (((r or {}).get('data') or {}).get('points')) if isinstance(r, dict) else None
    if isinstance(pts, list) and pts:
        cut = time.time() - 365 * 86400
        base = 0.0
        for p in pts:
            if (p.get('timestamp') or 0) <= cut and p.get('realized_pnl') is not None:
                base = float(p['realized_pnl'])
        last = pts[-1].get('realized_pnl')
        allp = out.get('all', {}).get('pnl')
        if allp is None and last is not None:
            allp = float(last)
        if allp is not None:
            out['year'] = {'pnl': round(allp - base, 2), 'vol': None, 'rank': None,
                           'since': int(pts[0].get('timestamp') or 0)}
    return w, out

def refresh(wallets, force=False, workers=6):
    store = load()
    ws = store.setdefault('wallets', {})
    now = time.time()
    todo = [w.lower() for w in dict.fromkeys(wallets) if w and (force or now - (ws.get(w.lower()) or {}).get('ts', 0) > MAX_AGE
            or any(k not in (ws.get(w.lower()) or {}) for k in ('week', 'month', 'year', 'all')))]
    ok = 0
    if todo:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            for w, rec in ex.map(fetch_one, todo):
                prev = ws.get(w) or {}
                for k in ('week', 'month', 'year', 'all', 'name'):
                    if k not in rec and k in prev:
                        rec[k] = prev[k]
                        rec.setdefault('stale', []).append(k)
                ws[w] = rec
                if all(k in rec for k in ('week', 'month', 'year', 'all')):
                    ok += 1
        save(store)
    print(f"whale_windows: {len(todo)} fetched, {ok} with all four windows, {len(ws)} cached")
    return store

if __name__ == '__main__':
    import sys
    sys.path.insert(0, HERE)
    import capper_history as ch
    caps = ch.summarize(ch.load())
    refresh([c['wallet'] for c in caps], force='--force' in sys.argv)
