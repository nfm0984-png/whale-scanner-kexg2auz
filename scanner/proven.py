#!/usr/bin/env python3
"""Proven Picks (Noel, Nov 15): every open sports pick from ELITE cappers only.

Elite (computed fresh every scan/refresh from capper_history + 30-day backfill):
  20+ graded copyable $500+ picks, copyable overall ROI >= +15%, Polymarket P&L positive over the past
  week, month and year (Hot), not Cooling (14-day form: 5+ picks with negative ROI), not losing on Noel's own
  copies once 3+ legs are graded, and not a near-certain-bet record (average entry on graded $500+ bets >= 90¢).
  A pick only appears if that capper also has sport-specific ROI >= +20% over 10+ graded bets in THAT sport.
  Overall ROI >= +20% and overall win rate >= 60% are ranking bonuses, not exclusions (a capper at +15% overall
  who clears the sport bar, e.g. Siddhartha1, stays). If more than 15 still qualify, keep the top 15 by rank score.
For each elite whale, all open sports positions on games in the next ~48h (Polymarket Data API, public) are listed with
teams, league, PT time (Gamma event), Kalshi action/price (scanner match, refreshed live from Kalshi), bet vs usual,
their record/ROI in that sport and 14-day form, and a verdict:
  GOOD    = bet >= $500 and >= 1x usual, sport bar cleared (10+ graded in that sport, ROI >= +20%), Kalshi price 45-92c
  CAUTION = small/throwaway bet (< $500 or < 0.5x usual) or no Kalshi market
  OK      = everything else
  Hidden (not listed, no caution card): a capper betting both sides of a market, and any game where elite
  cappers are on opposite sides (those games are also hidden from Top 20).
Written to proven_picks.json (repo root copy too, served by Pages) for the morning-picks routine.
"""
import json, os, sys, time, datetime as dt, urllib.request, urllib.parse, re
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import capper_history as ch
import backfill as bf

PT = dt.timezone(dt.timedelta(hours=-8))
ELITE_MIN_N = 20
ELITE_MIN_ROI = 15.0
ELITE_ROI_BONUS = 20.0
ELITE_MIN_WR = 60.0
ELITE_MAX_AVG = 0.90
ELITE_CAP = 15
SPORT_BAR_N = 10
SPORT_BAR_ROI = 20.0
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

def evkey(slug):
    m = re.search(r'(.+-20\d{2}-\d{2}-\d{2})', slug or '')
    return m.group(1) if m else (slug or '')

def _norm(s):
    return ' '.join((s or '').lower().split())

def _looks_team(s):
    t = _norm(s)
    if not t or t in ('yes', 'no', 'over', 'under', 'draw'):
        return False
    if t.startswith('over ') or t.startswith('under '):
        return False
    return True

def _names_clash(a, b):
    a, b = _norm(a), _norm(b)
    if not a or not b or not _looks_team(a) or not _looks_team(b):
        return False
    if a == b:
        return True
    if len(a) >= 4 and a in b:
        return True
    if len(b) >= 4 and b in a:
        return True
    return False

def best_sport_bar(c, sport=None):
    """A sport record clears the bar at 10+ graded and ROI >= +20%."""
    sports = c.get('sports') or {}
    items = [(sport, sports.get(sport) or {})] if sport else list(sports.items())
    best = None
    for name, sr in items:
        if not name or not sr:
            continue
        n = sr.get('n') or 0
        roi = sr.get('roi')
        if n >= SPORT_BAR_N and roi is not None and roi >= SPORT_BAR_ROI:
            cand = {'sport': name, 'w': sr.get('w') or 0, 'l': sr.get('l') or 0, 'n': n, 'roi': roi}
            if best is None or (cand['roi'], cand['n']) > (best['roi'], best['n']):
                best = cand
    return best

def sport_bars(c):
    out = []
    for name in (c.get('sports') or {}):
        b = best_sport_bar(c, name)
        if b:
            out.append(b)
    out.sort(key=lambda x: (-x['roi'], -x['n']))
    return out

def elite_rank_score(c):
    """Quality, plus bonuses for overall +20% ROI and 60% win rate, plus best sport ROI."""
    q = float(c.get('quality') or 0)
    if (c.get('croi') or 0) >= ELITE_ROI_BONUS:
        q += 30
    if (c.get('cwr') or 0) >= ELITE_MIN_WR:
        q += 15
    sb = best_sport_bar(c)
    if sb:
        q += min(float(sb['roi']), 100) * 0.5
    return round(q, 2)

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
    if not best_sport_bar(c):
        why.append('no sport with 10+ graded and +20% ROI')
    if not (pos('week') and pos('month') and pos('year')):
        why.append('not Hot (week/month/year P&L not all up)')
    if c.get('badge') == 'Cold':
        why.append('Cold')
    if c.get('formCooling'):
        why.append('Cooling (14d ROI negative)')
    cp = c.get('copies') or {}
    if (cp.get('n') or 0) >= 3 and (cp.get('l') or 0) > (cp.get('w') or 0):
        why.append('losing on your copies')
    avg = c.get('avgEntry')
    if avg is not None and avg >= ELITE_MAX_AVG:
        why.append('avg entry %d¢ is near-certain' % round(avg * 100))
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
        elif (c.get('cn') or 0) >= 10 and (c.get('croi') or 0) > 0 and (c.get('cw') or 0) > (c.get('cl') or 0):
            near.append({'wallet': c['wallet'], 'name': c.get('name'), 'why': why, 'rec': [c.get('cw'), c.get('cl')], 'roi': c.get('croi')})
    elite.sort(key=lambda c: -elite_rank_score(c))
    if len(elite) > ELITE_CAP:
        for c in elite[ELITE_CAP:]:
            near.append({'wallet': c['wallet'], 'name': c.get('name'), 'why': ['outside top %d by quality' % ELITE_CAP],
                         'rec': [c.get('cw'), c.get('cl')], 'roi': c.get('croi')})
        elite = elite[:ELITE_CAP]
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
    hedge_events = set()
    for p in rows:
        if p.get('hedged'):
            hedge_events.add(evkey(p.get('eventSlug') or p.get('slug') or ''))
    out = []
    for p in rows:
        c = p.pop('_c', None) or p.get('_c')
        if p.get('hedged'):
            continue
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
        # A pick only appears if this capper clears the sport bar in THIS sport.
        sport_bar_ok = (srec.get('n') or 0) >= SPORT_BAR_N and srec.get('roi') is not None and srec['roi'] >= SPORT_BAR_ROI
        if not sport_bar_ok:
            continue
        losing_sport = (srec.get('n') or 0) >= ch.SPORT_MIN_N and srec.get('roi') is not None and srec['roi'] < 0
        winning_sport = sport_bar_ok and srec['w'] > srec['l']
        small = p['cost'] < 500 or (mult is not None and mult < 0.5) or ch.conviction_of(c, p['cost']) == 'T'
        kp = (k or {}).get('price')
        reasons = []
        if small:
            reasons.append('small bet' if p['cost'] >= 500 else 'small bet (under $500)')
        if losing_sport:
            reasons.append('losing in ' + sport)
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
            'badge': c.get('badge'), 'verdict': verdict, 'why': reasons,
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
    # Hide the whole game when elite cappers are on opposite sides, including an elite who hedged both sides.
    split_events = set(k for k in hedge_events if k)
    by_ev = {}
    for r in out:
        by_ev.setdefault(evkey(r['slug']), []).append(r)
    for ek, rs in by_ev.items():
        mk = {}
        for r in rs:
            mk.setdefault((r.get('market') or '').strip().lower(), set()).add((r.get('pick') or '').strip().lower())
        if any(len(v) > 1 for v in mk.values()):
            split_events.add(ek)
            continue
        done = False
        for i, a in enumerate(rs):
            if done:
                break
            for b in rs[i + 1:]:
                if _names_clash(a.get('opp'), b.get('pick')) or _names_clash(b.get('opp'), a.get('pick')):
                    split_events.add(ek)
                    done = True
                    break
    if split_events:
        out = [r for r in out if evkey(r['slug']) not in split_events]
    out.sort(key=lambda r: (order[r['verdict']], r['startTs'] or 10 ** 12, -r['cost']))
    res = {
        'updatedTs': int(now), 'updatedAt': pt(now),
        'rule': 'Elite cappers only: 20+ graded $500+ copyable picks (30-day Polymarket backfill + scanner), overall ROI >= +15%, Hot (week/month/year P&L up), not Cooling on 14-day form, not losing on your copies, not a near-certain-bet record (average entry on graded $500+ bets >= 90¢). A pick only appears if that capper also has +20% ROI over 10+ graded bets in THAT sport. Overall ROI >= +20% and overall win rate >= 60% are ranking bonuses, not exclusions. If more than 15 qualify, the top 15 by rank score (quality plus those bonuses and best sport ROI) are kept. Picks where a capper bet both sides are hidden, not shown as caution. Games where elite cappers split (opposite sides, or an elite who hedged) are hidden from Proven Picks and Top 20.',
        'splitGames': sorted(split_events),
        'elite': [{'wallet': c['wallet'], 'name': c.get('name'), 'rec': [c.get('cw'), c.get('cl')], 'roi': c.get('croi'),
                   'wr': c.get('cwr'), 'quality': c.get('quality'), 'rankScore': elite_rank_score(c), 'avgEntry': c.get('avgEntry'),
                   'sports': sport_bars(c),
                   'f14': c.get('f14'), 'badge': c.get('badge'), 'usual': c.get('medBet'), 'open': len(opens.get(c['wallet']) or [])} for c in elite],
        'nearMiss': near[:25],
        'picks': out,
        'counts': {v: sum(1 for r in out if r['verdict'] == v) for v in order},
    }
    if write:
        for pth in (OUT, OUT_ROOT):
            json.dump(res, open(pth, 'w'), separators=(',', ':'))
    print(f"proven picks: {len(elite)} elite cappers ({', '.join((c.get('name') or c['wallet'][:10]) for c in elite[:12])}), {len(out)} open picks, {res['counts']}, hidden {len(split_events)} elite-split/hedged games")
    return res

if __name__ == '__main__':
    emb = json.load(open(os.path.join(HERE, 'page_embed.json')))
    build(emb)
