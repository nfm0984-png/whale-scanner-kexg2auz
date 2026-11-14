#!/usr/bin/env python3
"""Durable per-capper pick history.

Never wipes graded picks (HIT/MISSED/PUSH). scan.py and refresh.py append and
grade; a backfill can mine existing git page_embed.json + history.json.
"""
import json, os, time, datetime as dt, subprocess

HERE = os.path.dirname(os.path.abspath(__file__))
PATH = os.path.join(HERE, 'capper_history.json')
MIN_SAMPLE = 5
MIN_QUALITY_SAMPLE = 10  # below this, whale quality is neutral (not boosted)
SHRINK_K = 10
LOW_EDGE_ROI = 2.0  # percent; near-zero or worse is demoted
HIGH_VOL_RISKED = 20000
PT = dt.timezone(dt.timedelta(hours=-8))

def pt(ts):
    return dt.datetime.fromtimestamp(int(ts), PT).strftime('%a %b %-d · %-I:%M %p PT')

def load():
    if not os.path.exists(PATH):
        return {'updatedTs': 0, 'updatedAt': '', 'minSample': MIN_SAMPLE, 'picks': {}}
    try:
        d = json.load(open(PATH))
    except Exception:
        return {'updatedTs': 0, 'updatedAt': '', 'minSample': MIN_SAMPLE, 'picks': {}}
    d.setdefault('picks', {})
    d.setdefault('minSample', MIN_SAMPLE)
    return d

def save(data):
    data['minSample'] = MIN_SAMPLE
    data['updatedTs'] = int(time.time())
    data['updatedAt'] = pt(data['updatedTs'])
    tmp = PATH + '.tmp'
    json.dump(data, open(tmp, 'w'), separators=(',', ':'))
    os.replace(tmp, PATH)

def _merge_backer(dst, b):
    w = (b.get('wallet') or '').lower()
    if not w:
        return
    cur = dst.setdefault(w, {'wallet': w})
    name = b.get('name')
    if name:
        cur['name'] = name
    for k in ('cost', 'avg', 'rankAll', 'rank', 'golden'):
        v = b.get(k)
        if v is not None and v != '':
            cur[k] = v

def ingest_pick(store, pid, meta, backers):
    if not pid:
        return
    rec = store['picks'].setdefault(pid, {'id': pid, 'backers': {}})
    rec.setdefault('backers', {})
    # Never overwrite a graded result with a blank/open state.
    locked = rec.get('result') in ('W', 'L', 'push')
    for k, v in (meta or {}).items():
        if v is None or v == '':
            continue
        if locked and k in ('result', 'graded') and rec.get('result') in ('W', 'L', 'push'):
            continue
        rec[k] = v
    for b in backers or []:
        if isinstance(b, dict):
            _merge_backer(rec['backers'], b)

def _kalshi_bits(k, p=None):
    k = k or {}
    p = p or {}
    return dict(
        kAct=k.get('action') or p.get('kAct'),
        kContract=k.get('contract') or p.get('kContract'),
        kprice=k.get('price') if k.get('price') is not None else (p.get('kprice') if p.get('kprice') is not None else p.get('kPrice')),
        kalshi=p.get('kalshi') if isinstance(p.get('kalshi'), str) else ((k.get('action') or '') + ' ' + (k.get('contract') or '')).strip(),
    )

def ingest_from_lists(store, lists, bets=None, hist=None):
    for p in lists or []:
        pid = p.get('id')
        if not pid:
            q, lab, side = p.get('q') or p.get('question'), p.get('label'), p.get('side')
            if p.get('cid') and side:
                pid = str(p.get('cid')) + ':' + side
            else:
                continue
        g = p.get('game') or {}
        k = p.get('kalshi') if isinstance(p.get('kalshi'), dict) else {}
        meta = dict(q=p.get('q') or p.get('question'), label=p.get('label'),
                    side=pid.split(':')[-1] if ':' in str(pid) else p.get('side'),
                    league=(p.get('league') or (p.get('info') or {}).get('league') or ''),
                    start=g.get('start') or p.get('start'), startTs=p.get('startTs') or p.get('start_ts'),
                    slug=p.get('slug'), kind=p.get('kind') or (p.get('info') or {}).get('kind'),
                    **_kalshi_bits(k, p))
        lg = (meta.get('league') or '')
        if lg:
            meta['league'] = str(lg).upper()
        r = ((p.get('refresh') or {}).get('final') if isinstance(p.get('refresh'), dict) else None) or p.get('result')
        if r in ('W', 'L', 'push'):
            meta['result'] = r
            meta['graded'] = (p.get('refresh') or {}).get('at') or p.get('graded')
        ingest_pick(store, pid, meta, p.get('backers') or [])
    for b in bets or []:
        cid = b.get('cid') or b.get('condition_id') or ''
        side = b.get('side') or ''
        if not cid or not side:
            continue
        pid = str(cid) + ':' + side
        g = b.get('game') or {}
        k = b.get('kalshi') if isinstance(b.get('kalshi'), dict) else {}
        meta = dict(q=b.get('q'), label=b.get('label'), side=side, league=(b.get('league') or '').upper(),
                    start=g.get('start') or b.get('start'), startTs=b.get('startTs'), kind=b.get('kind'),
                    **_kalshi_bits(k, b))
        ingest_pick(store, pid, meta, [dict(
            wallet=b.get('wallet'), name=b.get('name'),
            cost=b.get('cost') if b.get('cost') is not None else b.get('usd'),
            avg=b.get('avg') if b.get('avg') is not None else b.get('price'),
            rankAll=b.get('rankAll'), rank=b.get('rank'), golden=b.get('golden'))])
    if hist:
        hp = hist.get('picks') if isinstance(hist, dict) and 'picks' in hist else (hist if isinstance(hist, dict) else {})
        for pid, h in (hp or {}).items():
            meta = dict(q=h.get('q'), label=h.get('label'), side=h.get('side'), start=h.get('start'),
                        slug=h.get('slug'), tier=h.get('tier'), kalshi=h.get('kalshi'), kprice=h.get('kprice'))
            if h.get('result') in ('W', 'L', 'push'):
                meta['result'] = h['result']
                meta['graded'] = h.get('graded')
            ingest_pick(store, pid, meta, h.get('backers') or [])

def profit_of(cost, avg, result):
    try:
        cost = float(cost)
    except (TypeError, ValueError):
        return None
    if cost <= 0 or result not in ('W', 'L'):
        return None
    if result == 'L':
        return -cost
    try:
        avg = float(avg)
    except (TypeError, ValueError):
        return None
    if avg <= 0:
        return None
    return cost * (1 - avg) / avg

def is_copyable(rec):
    """Kalshi-matchable singles in copyable price bands (10–94¢). W/L only."""
    if not rec or rec.get('result') not in ('W', 'L'):
        return False
    px = rec.get('kprice')
    matched = bool(rec.get('kAct') and rec.get('kContract'))
    if not matched and px is not None and rec.get('kAct'):
        matched = True
    if not matched and isinstance(rec.get('kalshi'), str) and px is not None:
        k = rec['kalshi'].upper()
        if 'POLYMARKET ONLY' in k or 'NO KALSHI' in k or 'NO VERIFIED' in k:
            matched = False
        elif 'BUY' in k or 'YES' in k or 'NO' in k or '¢' in rec['kalshi']:
            matched = True
    if not matched or px is None:
        return False
    try:
        c = float(px) * 100
    except (TypeError, ValueError):
        return False
    return 10 <= c < 95

def current_ids_from_embed(emb):
    ids = set()
    if not emb:
        return ids
    for k in ('signals', 'fun', 'poly', 'glue', 'props', 'longshots', 'biggest', 'upcoming'):
        for p in emb.get(k) or []:
            if p.get('id'):
                ids.add(p['id'])
    for b in (emb.get('bets') or []) + (emb.get('buys') or []):
        cid = b.get('cid') or b.get('condition_id') or ''
        side = b.get('side') or ''
        if cid and side:
            ids.add(str(cid) + ':' + side)
    return ids

def summarize(store, traders=None, current_ids=None, windows=None):
    current_ids = current_ids or set()
    if windows is None:
        windows = load_windows()
    caps = {}
    for pid, rec in (store.get('picks') or {}).items():
        backers = rec.get('backers') or {}
        if not backers:
            continue
        is_current = pid in current_ids
        graded = rec.get('result') in ('W', 'L', 'push')
        # Keep every graded pick forever. Only keep ungraded picks if they are still in this scan.
        if not graded and not is_current:
            continue
        for w, b in backers.items():
            c = caps.setdefault(w, {
                'wallet': w, 'name': b.get('name') or '', 'rankAll': b.get('rankAll'),
                'rank': b.get('rank'), 'golden': bool(b.get('golden')),
                'w': 0, 'l': 0, 'push': 0, 'open': 0, 'n': 0,
                'profit': 0.0, 'risked': 0.0, 'picks': [],
                'cw': 0, 'cl': 0, 'cprofit': 0.0, 'crisked': 0.0,
            })
            if b.get('name'):
                c['name'] = b['name']
            if b.get('rankAll') is not None:
                c['rankAll'] = b['rankAll']
            if b.get('rank') is not None:
                c['rank'] = b['rank']
            if b.get('golden'):
                c['golden'] = True
            result = rec.get('result') if rec.get('result') in ('W', 'L', 'push') else None
            cost = b.get('cost')
            avg = b.get('avg')
            pr = profit_of(cost, avg, result)
            if result == 'W':
                c['w'] += 1
                if cost:
                    c['risked'] += float(cost)
                if pr is not None:
                    c['profit'] += pr
            elif result == 'L':
                c['l'] += 1
                if cost:
                    c['risked'] += float(cost)
                if pr is not None:
                    c['profit'] += pr
            elif result == 'push':
                c['push'] += 1
            else:
                c['open'] += 1
            if is_copyable(rec) and result in ('W', 'L'):
                if result == 'W':
                    c['cw'] += 1
                else:
                    c['cl'] += 1
                if cost:
                    c['crisked'] += float(cost)
                if pr is not None:
                    c['cprofit'] += pr
            c['picks'].append(dict(
                id=pid, q=rec.get('q'), label=rec.get('label'), side=rec.get('side'),
                league=rec.get('league'), start=rec.get('start'), startTs=rec.get('startTs'),
                kind=rec.get('kind'), cost=cost, avg=avg, result=result,
                graded=rec.get('graded'), kAct=rec.get('kAct'), kContract=rec.get('kContract'),
                kprice=rec.get('kprice'), profit=round(pr, 2) if pr is not None else None,
                current=is_current,
            ))
    tmap = {((t.get('wallet') or '').lower()): t for t in (traders or [])}
    tracked = load_tracked_wallets()
    for w, tr in tracked.items():
        if w not in caps:  # tracked whale with no picks yet: show as Record building
            caps[w] = {'wallet': w, 'name': tr.get('name') or '', 'rankAll': None, 'rank': None, 'golden': False,
                       'w': 0, 'l': 0, 'push': 0, 'open': 0, 'n': 0, 'profit': 0.0, 'risked': 0.0, 'picks': [],
                       'cw': 0, 'cl': 0, 'cprofit': 0.0, 'crisked': 0.0}
    out = []
    for w, c in caps.items():
        t = tmap.get(w) or {}
        c['name'] = c['name'] or t.get('name') or ''
        if c.get('rankAll') is None:
            c['rankAll'] = t.get('rankAll') or t.get('rank')
        if c.get('rank') is None:
            c['rank'] = t.get('rank')
        c['golden'] = c.get('golden') or bool(t.get('golden'))
        c['pnl'] = t.get('pnl')
        c['wrAll'] = t.get('wr')
        c['n'] = c['w'] + c['l']
        c['wr'] = round(100.0 * c['w'] / c['n'], 1) if c['n'] else None
        c['roi'] = round(100.0 * c['profit'] / c['risked'], 1) if c['risked'] else None
        c['profit'] = round(c['profit'], 2)
        c['risked'] = round(c['risked'], 2)
        c['cn'] = c['cw'] + c['cl']
        c['cwr'] = round(100.0 * c['cw'] / c['cn'], 1) if c['cn'] else None
        c['croi'] = round(100.0 * c['cprofit'] / c['crisked'], 1) if c['crisked'] else None
        c['cprofit'] = round(c['cprofit'], 2)
        c['crisked'] = round(c['crisked'], 2)
        c['qualified'] = c['n'] >= MIN_SAMPLE
        c['picks'].sort(key=lambda p: (
            0 if not p.get('result') else 1,
            p.get('startTs') or 10 ** 12,
            -(p.get('graded') or 0),
        ))
        apply_conviction(c)
        attach_windows(c, windows)
        tr = tracked.get(w)
        if tr:
            c['tracked'] = True
            c['addedTs'] = tr.get('addedTs')
            c['trackedReason'] = tr.get('reason')
            c['isNew'] = bool(tr.get('addedTs') and time.time() - tr['addedTs'] <= NEW_DAYS * 86400)
        out.append(c)
    apply_quality(out)
    def sort_key(c):
        return (0 if c.get('proven') else (2 if c.get('coldDemoted') else 1), -(c.get('quality') or 0), -(c.get('cn') or 0),
                -(c['wr'] or 0), -c['n'])
    def _old_sort_key(c):
        if c['qualified']:
            band = 0
        elif c['n'] > 0:
            band = 1
        else:
            band = 2
        return (band, -(c['wr'] or 0), -(c['roi'] if c['roi'] is not None else -9999), -c['n'], -c['profit'])
    out.sort(key=sort_key)
    return out

def slim_for_page(cappers, updated_at=None):
    return {'minSample': MIN_SAMPLE, 'updatedAt': updated_at or pt(int(time.time())), 'cappers': cappers}

def backfill_from_git(store, repo=None):
    repo = repo or os.path.dirname(HERE)
    try:
        log = subprocess.check_output(
            ['git', '-C', repo, 'log', '--format=%H', '--', 'scanner/page_embed.json'],
            text=True,
        ).strip().splitlines()
    except Exception:
        return store
    for c in log:
        try:
            raw = subprocess.check_output(['git', '-C', repo, 'show', f'{c}:scanner/page_embed.json'], stderr=subprocess.DEVNULL)
            d = json.loads(raw)
        except Exception:
            continue
        lists = []
        for k in ('signals', 'fun', 'poly', 'glue', 'props', 'longshots', 'biggest', 'upcoming'):
            lists.extend(d.get(k) or [])
        ingest_from_lists(store, lists, bets=(d.get('bets') or []) + (d.get('buys') or []))
    return store

def update_store(emb=None, hist=None, backfill=False):
    """Merge current embed + history into the durable file. Never drops graded rows."""
    store = load()
    if backfill:
        backfill_from_git(store)
    if emb is not None:
        lists = []
        for k in ('signals', 'fun', 'poly', 'glue', 'props', 'longshots', 'biggest', 'upcoming'):
            lists.extend(emb.get(k) or [])
        ingest_from_lists(store, lists, bets=(emb.get('bets') or []) + (emb.get('buys') or []), hist=hist)
    elif hist is not None:
        ingest_from_lists(store, [], bets=None, hist=hist)
    save(store)
    return store


def apply_quality(caps):
    """Set quality scores. n < 10 is neutral (0), never boosted. Low-edge high-volume is demoted."""
    qualified = [c for c in caps if c.get('cn', 0) >= MIN_QUALITY_SAMPLE and c.get('cwr') is not None]
    if qualified:
        prior_wr = sum(c['cwr'] for c in qualified) / len(qualified)
        roied = [c for c in qualified if c.get('croi') is not None]
        prior_roi = (sum(c['croi'] for c in roied) / len(roied)) if roied else 0.0
    else:
        prior_wr, prior_roi = 55.0, 0.0
    for c in caps:
        n = c.get('cn') or 0
        wr = c.get('cwr')
        roi = c.get('croi')
        c['priorWr'] = round(prior_wr, 1)
        c['priorRoi'] = round(prior_roi, 1)
        badge = c.get('badge')
        c['proven'] = False
        if n < MIN_QUALITY_SAMPLE or wr is None:
            c['quality'] = 0.0
            c['qQual'] = False
            c['demoted'] = False
            c['shrunkWr'] = None
            c['shrunkRoi'] = None
            c['hotBoost'] = 0.0
            if badge == 'Cold':
                c['quality'] = COLD_SMALL_PENALTY
                c['demoted'] = True
                c['coldDemoted'] = True
            elif badge == 'Cooling':
                c['quality'] = -COOLING_PENALTY
            elif badge == 'Hot' and n >= HOT_SMALL_MIN and (c.get('cw') or 0) > (c.get('cl') or 0) and (roi is None or roi > 0):
                c['hotBoost'] = HOT_SMALL_BOOST
                c['quality'] = HOT_SMALL_BOOST
            continue
        swr = (n * wr + SHRINK_K * prior_wr) / (n + SHRINK_K)
        sroi = (n * roi + SHRINK_K * prior_roi) / (n + SHRINK_K) if roi is not None else prior_roi
        c['shrunkWr'] = round(swr, 1)
        c['shrunkRoi'] = round(sroi, 1)
        if roi is not None and roi <= LOW_EDGE_ROI:
            q = min(sroi, 0) - 30
            if (c.get('crisked') or 0) >= HIGH_VOL_RISKED or n >= 20:
                q -= 20
            c['quality'] = round(q, 2)
            c['qQual'] = True
            c['demoted'] = True
        else:
            c['quality'] = round((swr - prior_wr) + sroi, 2)
            c['qQual'] = True
            c['demoted'] = False
        # Period P&L rule (Noel, Nov 13): Cold (past month or past year negative, or all-time negative) is demoted;
        # Cooling (only past week negative) takes a small penalty.
        if badge == 'Cold':
            c['quality'] = round(min(c['quality'], 0) - COLD_PENALTY, 2)
            c['demoted'] = True
            c['coldDemoted'] = True
        elif badge == 'Cooling':
            c['quality'] = round(c['quality'] - COOLING_PENALTY, 2)
        win = c.get('win') or {}
        def pos(k):
            v = (win.get(k) or {}).get('pnl')
            return v is not None and v > 0
        def neg(k):
            v = (win.get(k) or {}).get('pnl')
            return v is not None and v < 0
        c['proven'] = bool(n >= MIN_QUALITY_SAMPLE and (c.get('cw') or 0) > (c.get('cl') or 0)
                           and roi is not None and roi > 0 and pos('month') and pos('all')
                           and not (neg('week') and neg('year')) and badge != 'Cold' and not c.get('demoted'))
        # Hot focus (Noel, Nov 13): all four P&L windows positive gets a strong boost.
        c['hotBoost'] = 0.0
        if badge == 'Hot' and not c.get('demoted'):
            if c['proven']:
                c['hotBoost'] = HOT_PROVEN_BOOST
            elif n >= MIN_QUALITY_SAMPLE and roi is not None and roi > 0:
                c['hotBoost'] = HOT_BOOST
            elif n >= HOT_SMALL_MIN and (c.get('cw') or 0) > (c.get('cl') or 0):
                c['hotBoost'] = HOT_SMALL_BOOST
            c['quality'] = round(c['quality'] + c['hotBoost'], 2)
    return caps

def quality_map(store=None, traders=None, current_ids=None):
    store = store or load()
    caps = summarize(store, traders, current_ids)
    return {c['wallet']: c for c in caps}

def backer_quality(backers, qmap):
    tw = 0.0
    tq = 0.0
    w = l = 0
    r_num = 0.0
    r_den = 0.0
    for b in backers or []:
        wallet = ((b.get('wallet') if isinstance(b, dict) else None) or '').lower()
        rec = qmap.get(wallet) or {}
        cost = 0.0
        if isinstance(b, dict):
            try:
                cost = float(b.get('cost') or 0)
            except (TypeError, ValueError):
                cost = 0.0
        wt = (cost if cost > 0 else 1.0) * CONV_WEIGHT.get(conviction_of(rec, cost), 1.0)
        tw += wt
        tq += wt * float(rec.get('quality') or 0)
        w += rec.get('cw') or 0
        l += rec.get('cl') or 0
        if rec.get('croi') is not None and (rec.get('crisked') or 0) > 0:
            r_num += (rec['crisked'] if cost <= 0 else wt) * rec['croi']
            r_den += rec['crisked'] if cost <= 0 else wt
    return {
        'quality': round(tq / tw, 2) if tw else 0.0,
        'w': w, 'l': l,
        'roi': round(r_num / r_den, 1) if r_den else None,
    }


# ---- period P&L windows (Polymarket Data API v2, cached by whale_windows.py) ----
COLD_PENALTY = 40.0
COLD_SMALL_PENALTY = -10.0
COOLING_PENALTY = 5.0
HOT_PROVEN_BOOST = 40.0   # Hot + Proven: strongest
HOT_BOOST = 20.0          # Hot, 10+ copyable picks, positive ROI, not proven
HOT_SMALL_BOOST = 15.0    # Hot, fewer than 10 copyable picks but a winning record (e.g. MadridTime)
HOT_SMALL_MIN = 3
WINDOWS = ('week', 'month', 'year', 'all')

def load_windows():
    try:
        return (json.load(open(os.path.join(HERE, 'whale_windows.json'))) or {}).get('wallets') or {}
    except Exception:
        return {}

def badge_of(win):
    vals = {k: (win.get(k) or {}).get('pnl') for k in WINDOWS}
    if all(v is None for v in vals.values()):
        return 'n/a'
    if any(vals[k] is not None and vals[k] < 0 for k in ('month', 'year', 'all')):
        return 'Cold'
    if vals['week'] is not None and vals['week'] < 0:
        return 'Cooling'
    if all(v is not None and v > 0 for v in vals.values()):
        return 'Hot'
    return 'OK'

def attach_windows(c, windows):
    w = (windows or {}).get(c['wallet']) or {}
    win = {}
    for k in WINDOWS:
        r = w.get(k)
        if not r or r.get('pnl') is None:
            continue
        vol = r.get('vol')
        win[k] = {'pnl': round(r['pnl']), 'roi': round(100.0 * r['pnl'] / vol, 1) if vol else None}
    # our own graded record inside each window (graded time, falling back to start time)
    now = time.time()
    span = {'week': 7, 'month': 30, 'year': 365, 'all': 10 ** 6}
    for k in WINDOWS:
        ww = ll = 0
        for p in c['picks']:
            if p.get('result') not in ('W', 'L'):
                continue
            t = p.get('graded') or p.get('startTs') or 0
            try:
                t = float(t)
            except (TypeError, ValueError):
                t = 0
            if k != 'all' and (not t or now - t > span[k] * 86400):
                continue
            if p['result'] == 'W':
                ww += 1
            else:
                ll += 1
        if ww or ll:
            win.setdefault(k, {})['rec'] = [ww, ll]
    c['win'] = win
    c['winStale'] = w.get('stale') or []
    if w.get('name') and (not c.get('name') or str(c.get('name')).startswith('0x')):
        c['name'] = w['name']
    c['badge'] = badge_of(win)

# ---- conviction: big bets are the real ones ----
CONV_HIGH_X = 2.0
CONV_LOW_X = 0.25
CONV_WEIGHT = {'H': 1.5, 'N': 1.0, 'T': 0.1}

def _median(xs):
    xs = sorted(xs)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2.0

def _day(p):
    t = p.get('startTs')
    try:
        return dt.datetime.fromtimestamp(int(t), PT).strftime('%Y-%m-%d') if t else None
    except Exception:
        return None

def conviction_of(rec, cost, top3=False):
    med = (rec or {}).get('medBet')
    try:
        cost = float(cost or 0)
    except (TypeError, ValueError):
        cost = 0.0
    if not med or cost <= 0:
        return 'N'
    mx = (rec or {}).get('maxBet') or 0
    if cost >= CONV_HIGH_X * med or (top3 and cost >= med):
        return 'H'
    if cost <= CONV_LOW_X * med or (mx and cost <= 0.1 * mx):
        return 'T'
    return 'N'

def apply_conviction(c):
    costs = []
    for p in c['picks']:
        try:
            v = float(p.get('cost') or 0)
        except (TypeError, ValueError):
            v = 0
        if v > 0:
            costs.append(v)
    c['medBet'] = round(_median(costs), 2) if len(costs) >= 3 else None
    c['maxBet'] = round(max(costs), 2) if costs else None
    byday = {}
    for p in c['picks']:
        d = _day(p)
        if d and (p.get('cost') or 0) > 0:
            byday.setdefault(d, []).append(float(p['cost']))
    tops = {d: sorted(v, reverse=True)[:3] for d, v in byday.items()}
    buckets = {'H': [0, 0, 0.0, 0.0], 'N': [0, 0, 0.0, 0.0], 'T': [0, 0, 0.0, 0.0]}
    for p in c['picks']:
        cost = p.get('cost') or 0
        d = _day(p)
        top3 = bool(d and cost and len(byday.get(d, [])) >= 4 and float(cost) in tops.get(d, []))
        tag = conviction_of(c, cost, top3)
        p['conv'] = tag
        p['mult'] = round(float(cost) / c['medBet'], 1) if c['medBet'] and cost else None
        if p.get('result') in ('W', 'L'):
            b = buckets[tag]
            b[0 if p['result'] == 'W' else 1] += 1
            if p.get('profit') is not None:
                b[2] += p['profit']
            if cost:
                b[3] += float(cost)
    c['convRec'] = {k: {'w': v[0], 'l': v[1], 'roi': round(100.0 * v[2] / v[3], 1) if v[3] else None} for k, v in buckets.items()}

def conv_factor(wallet, cost, qmap):
    return CONV_WEIGHT.get(conviction_of(qmap.get((wallet or '').lower()) or {}, cost), 1.0)

def conviction_net(backers, opposing, qmap):
    """Net money with throwaway bets nearly ignored and high-conviction bets boosted."""
    def tot(xs):
        s = 0.0
        for b in xs or []:
            try:
                cost = float(b.get('cost') or 0)
            except (TypeError, ValueError):
                cost = 0.0
            s += cost * conv_factor(b.get('wallet'), cost, qmap)
        return s
    return tot(backers) - tot(opposing)

def conviction_count(backers, qmap):
    return sum(0 if conviction_of(qmap.get((b.get('wallet') or '').lower()) or {}, b.get('cost')) == 'T' else 1 for b in backers or [])

NEW_DAYS = 3

def load_tracked_wallets():
    try:
        return (json.load(open(os.path.join(HERE, 'tracked_cappers.json'))) or {}).get('wallets') or {}
    except Exception:
        return {}

def page_payload(emb=None, hist=None, store=None):
    store = store or load()
    traders = (emb or {}).get('traders') or []
    out = slim_for_page(summarize(store, traders, current_ids_from_embed(emb)), store.get('updatedAt'))
    try:
        td = json.load(open(os.path.join(HERE, 'tracked_cappers.json')))
    except Exception:
        td = {}
    byw = {c['wallet']: c for c in out['cappers']}
    def info(x):
        c = byw.get(x['wallet']) or {}
        return {'wallet': x['wallet'], 'name': c.get('name') or x.get('name') or '', 'reason': x.get('reason'), 'badge': c.get('badge'),
                'month': ((c.get('win') or {}).get('month') or {}).get('pnl')}
    out['newThisScan'] = [info(x) for x in (td.get('lastNew') or [])]
    out['newRecent'] = [info(r) for r in sorted((td.get('wallets') or {}).values(), key=lambda r: -(r.get('addedTs') or 0))
                        if r.get('addedTs') and time.time() - r['addedTs'] <= NEW_DAYS * 86400]
    out['trackedCount'] = len(td.get('wallets') or {})
    return out

if __name__ == '__main__':
    emb_path = os.path.join(HERE, 'page_embed.json')
    hp = os.path.join(HERE, 'history.json')
    emb = json.load(open(emb_path)) if os.path.exists(emb_path) else {}
    hist = json.load(open(hp)) if os.path.exists(hp) else {}
    store = update_store(emb, hist, backfill=True)
    n_p = len(store['picks'])
    caps = summarize(store, emb.get('traders') or [], current_ids_from_embed(emb))
    graded = sum(1 for c in caps if c['n'] > 0)
    qual = sum(1 for c in caps if c['qualified'])
    print(f"capper_history: {n_p} pick rows, {len(caps)} cappers, {graded} with graded records, {qual} with {MIN_SAMPLE}+ graded")
    for c in caps[:8]:
        print(f"  {c['name'] or c['wallet'][:10]:20} {c['w']}-{c['l']} wr={c['wr']} n={c['n']} profit={c['profit']} roi={c['roi']} open={c['open']} qual={c['qualified']}")
