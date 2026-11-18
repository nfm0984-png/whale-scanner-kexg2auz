"""Politics & Econ tab: open $500+ positions of established politics / economics / finance wallets that have the same outcome and side on Kalshi.

Full scans recompute the capper list (Polymarket public leaderboard, bounded) and re-match every position against Kalshi's open
non-sports markets. Hourly refreshes keep the capper list and the accepted matches from the last scan, re-read each capper's open
positions and re-price the matched Kalshi markets one by one."""
import json, time, urllib.request
from concurrent.futures import ThreadPoolExecutor

import pe_cappers as pc
import pe_match as pm

import re
SPORTY = re.compile(r'\bvs\.?\b| win on 20\d\d-|O/U|\bspread\b|\bdraw\b|both teams', re.I)
MIN_COST = 500.0
HIDE_LO, HIDE_HI = 0.03, 0.97   # priced under 3c or over 97c = effectively resolved
K_API = pm.API


def _horizon_ok(q, m):
    """Same wording but a different resolution horizon (e.g. Polymarket's next Israeli PM after the 2026 election vs Kalshi's successor by 2045) is not the same bet."""
    import datetime as dt
    try:
        pe = dt.date.fromisoformat((q.get('end_date') or '')[:10])
    except Exception:
        return True
    ks = [x for x in (_ts(m.get('close') or ''), _ts(m.get('exp') or '')) if x]
    if not ks:
        return True
    kd = dt.datetime.fromtimestamp(min(ks), dt.timezone.utc).date()
    return abs((kd - pe).days) <= 400


def _positions(wallets, log):
    import floor_positions as fp
    out = {}
    def one(w):
        return w, fp._fetch_positions(w, 3)
    with ThreadPoolExecutor(max_workers=6) as ex:
        for w, p in ex.map(one, wallets):
            out[w] = p
    bad = sum(1 for v in out.values() if v is None)
    if bad:
        log(f'politics/econ: positions unreadable for {bad} of {len(wallets)} cappers')
    return out


def _kalshi_market(ticker):
    for i in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(K_API + '/markets/' + ticker, headers={'User-Agent': 'Mozilla/5.0 whale-scanner'}), timeout=20) as r:
                m = (json.loads(r.read().decode()) or {}).get('market') or {}
            if not m.get('ticker'):
                return None
            return dict(t=m.get('ticker'), status=m.get('status'), ya=_f(m.get('yes_ask_dollars')), na=_f(m.get('no_ask_dollars')), close=m.get('close_time') or '', exp=m.get('expected_expiration_time') or '')
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(1 + i)
        except Exception:
            time.sleep(1 + i)
    return None


def _f(v):
    try:
        x = float(v)
        return x if x > 0 else None
    except (TypeError, ValueError):
        return None


def _ts(s):
    import datetime as dt
    try:
        return int(dt.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp())
    except Exception:
        return None


def build(prev=None, now=None, full=True, log=print):
    """-> block for emb['politicsEcon']. `prev` is the last block (refresh reuses its cappers and matches)."""
    now = now or time.time()
    prev = prev or {}
    cappers = None
    if full:
        try:
            cappers = pc.build(log)
        except Exception as e:
            log('politics/econ cappers failed:', e)
    if not cappers:
        cappers = prev.get('cappers') or []
        full = False if not cappers else full
    byw = {c['wallet']: c for c in cappers}
    pos = _positions(list(byw), log)
    matches = dict(prev.get('matches') or {})
    live = {}      # ticker -> live kalshi fields (from the event fetch on scans, per-market GET on refresh)
    st = dict(positions=0, big=0, hedged=0, resolved=0, matched=0, unmatched=0)
    elig = []
    for w, plist in pos.items():
        plist = plist or []
        held = {}
        for q in plist:
            held.setdefault(q.get('condition_id'), set()).add(q.get('outcome'))
        for q in plist:
            st['positions'] += 1
            if (q.get('total_cost_usdc') or 0) < MIN_COST or q.get('redeemable'):
                continue
            st['big'] += 1
            if len(held.get(q.get('condition_id')) or ()) > 1:
                st['hedged'] += 1      # both sides of the same market held: a split / market-maker position, not a pick
                continue
            cp = q.get('current_price')
            if cp is None or cp < HIDE_LO or cp > HIDE_HI:
                st['resolved'] += 1
                continue
            elig.append((w, q))
    index, complete = None, False
    if full and elig:
        try:
            evs, ok1 = pm.list_events(170, log)
            titles = sorted({q.get('title') or '' for _, q in elig if not SPORTY.search(q.get('title') or '')})
            cand = pm.candidate_events(evs, titles) if evs else []
            mk, ok2 = pm.fetch_event_markets(cand, 150, 6, log)
            if mk:
                index = pm.Index(mk)
            complete = bool(ok1 and ok2)
        except Exception as e:
            log('politics/econ kalshi index failed:', e)
    rows = []
    for w, q in elig:
        key = '%s|%s' % (q.get('condition_id'), q.get('outcome'))
        mt = None
        if index is not None:
            r = None if SPORTY.search(q.get('title') or '') else pm.match(index, q.get('title') or '', q.get('outcome'))
            if r and not _horizon_ok(q, r['market']):
                st['horizon'] = st.get('horizon', 0) + 1
                r = None
            if r:
                m = r['market']
                mt = dict(t=m['t'], ev=m['ev'], yesNo=r['yesNo'], how=r['how'], q=m['q'], et=m['et'], ys=m['ys'], ns=m['ns'], cat=m['cat'])
                live[m['t']] = dict(t=m['t'], ya=m['ya'], na=m['na'], close=m['close'], exp=m['exp'], status='active')
                matches[key] = mt
            else:
                matches.pop(key, None)
        else:
            mt = matches.get(key)
        if not mt:
            st['unmatched'] += 1
            continue
        rows.append((w, q, mt))
    # refresh path: re-price the matched Kalshi markets one by one (bounded: only tickers someone holds)
    need = sorted({mt['t'] for _, _, mt in rows} - set(live))
    if need:
        with ThreadPoolExecutor(max_workers=6) as ex:
            for t, m in zip(need, ex.map(_kalshi_market, need)):
                if m:
                    live[t] = m
    picks = {}
    for w, q, mt in rows:
        lv = live.get(mt['t'])
        if not lv or lv.get('status') not in ('active', 'open'):
            continue
        yes = mt['yesNo'] == 'Yes'
        px = lv.get('ya') if yes else lv.get('na')
        if px is None or px < HIDE_LO or px > HIDE_HI:
            st['resolved'] += 1
            continue
        settle = _ts(lv.get('exp') or '') or _ts(lv.get('close') or '')
        if settle is None or settle < now:
            continue
        pid = '%s|%s' % (mt['t'], mt['yesNo'])
        p = picks.setdefault(pid, dict(id=pid, ticker=mt['t'], eventTicker=mt['ev'], eventTitle=mt['et'], marketTitle=mt['q'], outcome=(mt['ys'] if yes else (mt['ns'] or mt['ys'])),
                                       yesNo=mt['yesNo'], kPrice=px, settleTs=settle, polyTitle=q.get('title'), polyPx=[], backers=[], total=0.0, cat=mt['cat']))
        c = byw[w]
        p['backers'].append(dict(wallet=w, name=c['name'], cost=round(q['total_cost_usdc']), avg=q.get('avg_price'), best=c['best'], cats=c['cats']))
        p['total'] += q['total_cost_usdc']
        p['polyPx'].append(q.get('current_price'))
    out = []
    for p in picks.values():
        pp = [x for x in p.pop('polyPx') if x is not None]
        p['polyPrice'] = round(sum(pp) / len(pp), 4) if pp else None
        p['gap'] = round(p['kPrice'] - p['polyPrice'], 3) if p['polyPrice'] is not None else None
        p['total'] = round(p['total'])
        p['n'] = len(p['backers'])
        p['backers'].sort(key=lambda b: -b['cost'])
        out.append(p)
    out.sort(key=lambda p: (p['settleTs'], -p['total']))
    st['matched'] = len(out)
    shown = {b['wallet'] for p in out for b in p['backers']}
    log(f"politics/econ: {len(cappers)} cappers, {st['positions']} open positions, {st['big']} at $500+, hedged {st['hedged']}, resolved {st['resolved']}, unmatched {st['unmatched']}, {len(out)} Kalshi picks from {len(shown)} cappers")
    return dict(ts=int(now), fullTs=int(now) if full else int(prev.get('fullTs') or 0), kalshiComplete=bool(complete) if full else bool(prev.get('kalshiComplete')),
                cappers=[dict(wallet=c['wallet'], name=c['name'], best=c['best'], cats=c['cats']) for c in cappers],
                picks=out, matches=matches, stats=st)
