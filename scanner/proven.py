#!/usr/bin/env python3
"""Proven Picks (Noel, Nov 15): every open sports pick from ELITE cappers only.

Elite (computed fresh every scan/refresh from capper_history + 30-day backfill):
  10+ graded copyable $500+ picks, winning record, copyable ROI >= +15%, Polymarket P&L positive over the past
  week, month and year (Hot), not Cooling (14-day form: 5+ picks with negative ROI), not losing on Noel's own
  copies once 3+ legs are graded.
For each elite whale, all open sports positions on games in the next ~48h (Polymarket Data API, public) are listed with
teams, league, PT time (Gamma event), Kalshi action/price (scanner match, refreshed live from Kalshi), bet vs usual,
their record/ROI in that sport and 14-day form, and a verdict:
  GOOD    = bet >= $500 and >= 1x usual, winning in that sport (5+ graded, more W than L, ROI > 0), Kalshi price 45-92c
  CAUTION = small/throwaway bet (< $500 or < 0.5x usual), losing in that sport, hedged both sides, or no Kalshi market
  OK      = everything else
Written to proven_picks.json (repo root copy too, served by Pages) for the morning-picks routine.
"""
import json, os, sys, time, datetime as dt, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import capper_history as ch
import backfill as bf

PT = dt.timezone(dt.timedelta(hours=-8))
ELITE_MIN_N = 10
ELITE_MIN_ROI = 15.0
HORIZON_H = 48
GOOD_LO, GOOD_HI = 0.45, 0.92
OUT = os.path.join(HERE, 'proven_picks.json')
OUT_ROOT = os.path.join(os.path.dirname(HERE), 'proven_picks.json')
LISTS = ('signals', 'fun', 'poly', 'glue', 'props', 'longshots', 'biggest', 'upcoming')

def _json(url, timeout=20):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'whale-scanner/1.0', 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None

def pt(ts):
    return dt.datetime.fromtimestamp(int(ts), PT).strftime('%a %b %-d · %-I:%M %p PT')

def elite_check(c):
    win = c.get('win') or {}
    def pos(k):
        v = (win.get(k) or {}).get('pnl')
        return v is not None and v > 0
    why = []
    if (c.get('cn') or 0) < ELITE_MIN_N:
        why.append('only %d graded' % (c.get('cn') or 0))
    if (c.get('cw') or 0) <= (c.get('cl') or 0):
        why.append('not a winning record')
    if c.get('croi') is None or c['croi'] < ELITE_MIN_ROI:
        why.append('ROI %s%% < +15%%' % (c.get('croi'),))
    if not (pos('week') and pos('month') and pos('year')):
        why.append('not Hot (week/month/year P&L not all up)')
    if c.get('badge') == 'Cold':
        why.append('Cold')
    if c.get('formCooling'):
        why.append('Cooling (14d ROI negative)')
    cp = c.get('copies') or {}
    if (cp.get('n') or 0) >= 3 and (cp.get('l') or 0) > (cp.get('w') or 0):
        why.append('losing on your copies')
    return not why, why

def _iso_ts(s):
    if not s:
        return None
    try:
        s = s.replace(' ', 'T').replace('+00', '+00:00') if s.endswith('+00') else s.replace('Z', '+00:00')
        return int(dt.datetime.fromisoformat(s).timestamp())
    except Exception:
        return None

def build(emb, store=None, write=True):
    store = store or ch.load()
    caps = ch.summarize(store, (emb or {}).get('traders') or [], ch.current_ids_from_embed(emb or {}))
    elite, near = [], []
    for c in caps:
        ok, why = elite_check(c)
        if ok:
            elite.append(c)
        elif (c.get('cn') or 0) >= ELITE_MIN_N and (c.get('croi') or 0) > 0 and (c.get('cw') or 0) > (c.get('cl') or 0):
            near.append({'wallet': c['wallet'], 'name': c.get('name'), 'why': why, 'rec': [c.get('cw'), c.get('cl')], 'roi': c.get('croi')})
    # scanner picks by id (Kalshi match, game time, teams)
    by_pid = {}
    for k in LISTS:
        for p in (emb or {}).get(k) or []:
            if p.get('id'):
                by_pid.setdefault(p['id'], p)
    with ThreadPoolExecutor(max_workers=6) as ex:
        opens = dict(zip([c['wallet'] for c in elite], ex.map(lambda c: bf.fetch_open(c['wallet']), elite)))
    now = time.time()
    today = dt.datetime.fromtimestamp(now, PT).date()
    rows, ev_slugs = [], set()
    for c in elite:
        ps = opens.get(c['wallet']) or []
        cids = {}
        for p in ps:
            cids.setdefault(p['cid'], set()).add(p['side'])
        for p in ps:
            d = bf.slug_date(p['eventSlug'] or p['slug'])
            try:
                dd = dt.date.fromisoformat(d)
            except Exception:
                continue
            if dd < today - dt.timedelta(days=1) or dd > today + dt.timedelta(days=2):
                continue
            p['_c'] = c
            p['hedged'] = len(cids.get(p['cid']) or ()) > 1
            rows.append(p)
            ev_slugs.add(p['eventSlug'] or p['slug'])
    with ThreadPoolExecutor(max_workers=8) as ex:
        evs = dict(zip(sorted(ev_slugs), ex.map(lambda s: _json('https://gamma-api.polymarket.com/events?slug=' + urllib.parse.quote(s)), sorted(ev_slugs))))
    ev_info = {}
    for s, r in evs.items():
        e = r[0] if isinstance(r, list) and r else {}
        ts = _iso_ts(e.get('startTime'))
        if not ts:
            for m in e.get('markets') or []:
                ts = _iso_ts(m.get('gameStartTime'))
                if ts:
                    break
        ev_info[s] = {'title': e.get('title') or '', 'ts': ts}
    # Kalshi: scanner match for this exact pick, else the last Kalshi match the scanner stored for it; refresh price live
    tick_need = {}
    for p in rows:
        sp = by_pid.get(p['pid'])
        rec = (store.get('picks') or {}).get(p['pid']) or {}
        k = (sp or {}).get('kalshi') if isinstance((sp or {}).get('kalshi'), dict) else {}
        if k.get('status') == 'ok' and k.get('ticker'):
            p['k'] = {'action': k.get('action'), 'price': k.get('price'), 'ticker': k.get('ticker'), 'contract': k.get('contract'), 'src': 'scanner'}
        elif rec.get('kTicker') and rec.get('kAct'):
            p['k'] = {'action': rec.get('kAct'), 'price': rec.get('kprice'), 'ticker': rec.get('kTicker'), 'contract': rec.get('kContract'), 'src': 'last scan'}
        else:
            p['k'] = None
        if p['k']:
            tick_need[p['k']['ticker']] = None
    with ThreadPoolExecutor(max_workers=8) as ex:
        live = dict(zip(list(tick_need), ex.map(lambda t: _json('https://api.elections.kalshi.com/trade-api/v2/markets/' + t), list(tick_need))))
    out = []
    for p in rows:
        c = p.pop('_c')
        ev = ev_info.get(p['eventSlug'] or p['slug']) or {}
        sp = by_pid.get(p['pid']) or {}
        ts = sp.get('startTs') or ev.get('ts')
        if ts and ts <= now:
            continue  # started
        if not ts and bf.slug_date(p['slug']) and dt.date.fromisoformat(bf.slug_date(p['slug'])) < today:
            continue
        k = p.get('k')
        if k:
            m = ((live.get(k['ticker']) or {}).get('market')) or {}
            if m:
                if m.get('status') not in ('active', 'open'):
                    k = None
                else:
                    f = 'yes_ask_dollars' if k['action'] == 'BUY YES' else 'no_ask_dollars'
                    try:
                        k['price'] = round(float(m.get(f)), 2)
                        k['live'] = True
                    except (TypeError, ValueError):
                        pass
        # guard: a Kalshi price far from Polymarket's current price means the contract is not the same bet
        try:
            if k and k.get('price') is not None and p.get('now') is not None and abs(float(k['price']) - float(p['now'])) > 0.15:
                k = None
        except (TypeError, ValueError):
            pass
        lg = p['league']
        sport = bf.sport_of(lg)
        srec = (c.get('sports') or {}).get(sport) or {'w': 0, 'l': 0, 'n': 0, 'roi': None}
        med = c.get('medBet')
        mult = round(p['cost'] / med, 2) if med else None
        losing_sport = (srec.get('n') or 0) >= ch.SPORT_MIN_N and srec.get('roi') is not None and srec['roi'] < 0
        winning_sport = (srec.get('n') or 0) >= ch.SPORT_MIN_N and srec['w'] > srec['l'] and (srec.get('roi') or 0) > 0
        small = p['cost'] < 500 or (mult is not None and mult < 0.5) or ch.conviction_of(c, p['cost']) == 'T'
        kp = (k or {}).get('price')
        reasons = []
        if small:
            reasons.append('small bet' if p['cost'] >= 500 else 'small bet (under $500)')
        if losing_sport:
            reasons.append('losing in ' + sport)
        if p.get('hedged'):
            reasons.append('hedged both sides')
        if not k or kp is None:
            reasons.append('no Kalshi market')
        if reasons:
            verdict = 'CAUTION'
        elif (mult is None or mult >= 1) and p['cost'] >= 500 and winning_sport and GOOD_LO <= kp <= GOOD_HI:
            verdict = 'GOOD'
        else:
            verdict = 'OK'
            if mult is not None and mult < 1:
                reasons.append('%.1fx usual (under 1x)' % mult)
            if not winning_sport:
                reasons.append('thin record in ' + sport)
            if kp is not None and not (GOOD_LO <= kp <= GOOD_HI):
                reasons.append('Kalshi %d¢ outside 45-92¢' % round(kp * 100))
        title = ev.get('title') or (sp.get('game') or {}).get('name') or p['title']
        out.append({
            'pid': p['pid'], 'wallet': c['wallet'], 'name': c.get('name') or '', 'league': lg, 'sport': sport,
            'game': title, 'market': p['title'], 'pick': p['outcome'], 'opp': p['opp'], 'slug': p['slug'],
            'startTs': ts, 'start': pt(ts) if ts else (bf.slug_date(p['slug']) or '') + ' (time TBD)',
            'cost': round(p['cost']), 'avg': p['avg'], 'now': p.get('now'), 'usual': med, 'mult': mult,
            'kalshi': k, 'sportRec': srec, 'f14': c.get('f14'), 'rec': [c.get('cw'), c.get('cl')], 'roi': c.get('croi'),
            'badge': c.get('badge'), 'verdict': verdict, 'why': reasons, 'hedged': p.get('hedged', False),
            'inTop': p['pid'] in {x.get('id') for x in (emb or {}).get('signals') or []},
        })
    order = {'GOOD': 0, 'OK': 1, 'CAUTION': 2}
    # one row per whale + market title + side (several fills/markets with the same title collapse to the biggest)
    best = {}
    for r in out:
        key = (r['wallet'], r['market'], r['pick'])
        if key not in best or r['cost'] > best[key]['cost']:
            best[key] = r
    out = list(best.values())
    out.sort(key=lambda r: (order[r['verdict']], r['startTs'] or 10 ** 12, -r['cost']))
    res = {
        'updatedTs': int(now), 'updatedAt': pt(now),
        'rule': 'Elite cappers only: 10+ graded $500+ copyable picks (30-day Polymarket backfill + scanner), winning record, ROI >= +15%, Hot (week/month/year P&L up), not Cooling on 14-day form, not losing on your copies.',
        'elite': [{'wallet': c['wallet'], 'name': c.get('name'), 'rec': [c.get('cw'), c.get('cl')], 'roi': c.get('croi'),
                   'f14': c.get('f14'), 'badge': c.get('badge'), 'usual': c.get('medBet'), 'open': len(opens.get(c['wallet']) or [])} for c in elite],
        'nearMiss': near[:25],
        'picks': out,
        'counts': {v: sum(1 for r in out if r['verdict'] == v) for v in order},
    }
    if write:
        for pth in (OUT, OUT_ROOT):
            json.dump(res, open(pth, 'w'), separators=(',', ':'))
    print(f"proven picks: {len(elite)} elite cappers ({', '.join((c.get('name') or c['wallet'][:10]) for c in elite[:12])}), {len(out)} open picks, {res['counts']}")
    return res

if __name__ == '__main__':
    emb = json.load(open(os.path.join(HERE, 'page_embed.json')))
    build(emb)
