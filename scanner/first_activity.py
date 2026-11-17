#!/usr/bin/env python3
"""Cache each wallet's first Polymarket activity timestamp (public Data API v2)."""
import json, os, time, urllib.request, urllib.parse, urllib.error
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, 'first_activity.json')
BASE = 'https://data-api.polymarket.com/v2/activity'

def load():
    try:
        d = json.load(open(PATH))
        d.setdefault('wallets', {})
        return d
    except Exception:
        return {'updatedTs': 0, 'wallets': {}}

def _get(w):
    url = BASE + '?' + urllib.parse.urlencode({'user': w, 'limit': 1, 'sortBy': 'TIMESTAMP', 'sortDirection': 'ASC'})
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode())
        items = data.get('data') or []
        if not items:
            return w, None, None
        return w, int(items[0].get('timestamp') or 0) or None, items[0].get('type')
    except Exception:
        return w, None, None

def refresh(wallets, workers=8, budget_s=90):
    store = load()
    ws = store['wallets']
    todo = [w.lower() for w in dict.fromkeys(wallets or []) if w and w.lower() not in ws]
    t0 = time.time()
    if todo:
        with ThreadPoolExecutor(max_workers=workers) as ex:
            for w, ts, typ in ex.map(_get, todo):
                if time.time() - t0 > budget_s:
                    break
                if ts:
                    ws[w] = {'firstTs': ts, 'firstType': typ}
    store['updatedTs'] = int(time.time())
    tmp = PATH + '.tmp'
    json.dump(store, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, PATH)
    print(f"first_activity: {len(todo)} new, {len(ws)} cached ({time.time() - t0:.0f}s)", flush=True)
    return store
