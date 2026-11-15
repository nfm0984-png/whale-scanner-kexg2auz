#!/usr/bin/env python3
"""Copy tracking (Noel, Nov 15): match Noel's placed Kalshi tickets (shared ledger bets.csv, box only) to scanner
picks and attribute each copied leg to the whales who backed that pick ($500+ bets).

The ledger is not available in GitHub Actions, so this runs at build time on the box and writes a sanitized
copies.json (W/L and stake only, no payouts/notes). Actions just reads the committed file.

Matching, per leg: 1) Kalshi ticker in the leg text == pick's Kalshi ticker; 2) "ABC ML" / "<Team> wins|ML" to a
moneyline pick whose game starts 0-36h after the ticket was placed (slug abbreviation or team name in the contract/label).
Leg result = the pick's graded result; if the pick is ungraded, a winning ticket means every leg won.
"""
import csv, json, os, re, sys, time, datetime as dt

HERE = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.environ.get('LEDGER', '/workspace/shared/ledger/bets.csv')
OUT = os.path.join(HERE, 'copies.json')
PT = dt.timezone(dt.timedelta(hours=-8))
TICK_RE = re.compile(r'\b(KX[A-Z0-9]+-[A-Z0-9]+(?:-[A-Z0-9.]+)?)')
ABBR_RE = re.compile(r'^\s*([A-Z]{2,5})\s+ML\s*$')
NAME_RE = re.compile(r'^\s*(?:BUY YES\s+)?([A-Z][A-Za-z.\' ]{2,40}?)\s+(?:wins|ML|to win|beat)\b', re.I)
MIN_COST = 500

def ts_of(s):
    try:
        return int(dt.datetime.strptime(s.strip()[:16], '%Y-%m-%d %H:%M').replace(tzinfo=PT).timestamp())
    except Exception:
        return None

def split_legs(s):
    parts = re.split(r'\s\|\s|;\s*', s or '')
    return [p.strip() for p in parts if p.strip()]

def main():
    if not os.path.exists(LEDGER):
        print('copies: ledger not found, keeping existing copies.json')
        return
    sys.path.insert(0, HERE)
    import capper_history as ch
    store = ch.load()['picks']
    by_tick = {}
    for pid, r in store.items():
        t = r.get('kTicker')
        if t:
            by_tick.setdefault(t.upper(), []).append(pid)
    ml = [(pid, r) for pid, r in store.items() if r.get('kind') in ('moneyline', 'teamwin') and r.get('startTs')]
    rows = [r for r in csv.DictReader(open(LEDGER)) if (r.get('platform') or '').lower() == 'kalshi']
    W = {}
    seen = set()
    matched_legs = legs_total = tickets_matched = 0
    for r in rows:
        placed = ts_of(r.get('placed_at_pt') or '')
        tres = (r.get('result') or '').strip().upper()
        legs = split_legs(r.get('legs') or '')
        legs_total += len(legs)
        try:
            stake = round(float(r.get('stake') or 0), 2)
        except ValueError:
            stake = 0.0
        hit_pids = []
        for leg in legs:
            pid = None
            m = TICK_RE.search(leg.upper())
            if m:
                tk = m.group(1)
                cands = by_tick.get(tk) or []
                if cands:
                    # prefer the pick whose side matches the BUY YES / BUY NO in the leg
                    want = 'BUY NO' if 'BUY NO' in leg.upper() else ('BUY YES' if 'BUY YES' in leg.upper() else None)
                    pid = next((p for p in cands if not want or store[p].get('kAct') == want), cands[0])
            elif placed:
                win = [(p, x) for p, x in ml if placed - 7200 <= (x.get('startTs') or 0) <= placed + 36 * 3600]
                ma = ABBR_RE.match(leg)
                if ma:
                    ab = ma.group(1).lower()
                    for p, x in win:
                        sl = (x.get('slug') or '').split('-')
                        if len(sl) >= 3 and ab in sl[1:3] and x.get('kAct') == 'BUY YES':
                            pid = p
                            break
                if not pid:
                    mn = NAME_RE.match(leg)
                    if mn:
                        nm = mn.group(1).strip().lower()
                        for p, x in win:
                            c = (x.get('kContract') or '').lower()
                            if c and (nm == c or (len(nm) >= 4 and (nm in c or c in nm))) and x.get('kAct') == 'BUY YES':
                                pid = p
                                break
            if pid:
                hit_pids.append(pid)
        if not hit_pids:
            continue
        tickets_matched += 1
        for pid in hit_pids:
            matched_legs += 1
            rec = store[pid]
            res = rec.get('result') if rec.get('result') in ('W', 'L', 'push') else ('W' if tres == 'W' else None)
            for w, b in (rec.get('backers') or {}).items():
                try:
                    cost = float(b.get('cost') or 0)
                except (TypeError, ValueError):
                    cost = 0
                if cost < MIN_COST:
                    continue
                key = (w, r.get('bet_id'), pid)
                if key in seen:
                    continue
                seen.add(key)
                c = W.setdefault(w, {'w': 0, 'l': 0, 'push': 0, 'open': 0, 'n': 0, 'tickets': set(), 'tw': 0, 'tl': 0, 'stake': 0.0, 'name': b.get('name') or ''})
                if res == 'W':
                    c['w'] += 1
                elif res == 'L':
                    c['l'] += 1
                elif res == 'push':
                    c['push'] += 1
                else:
                    c['open'] += 1
                if r.get('bet_id') not in c['tickets']:
                    c['tickets'].add(r.get('bet_id'))
                    c['stake'] += stake
                    if tres == 'W':
                        c['tw'] += 1
                    elif tres == 'L':
                        c['tl'] += 1
    out = {}
    for w, c in W.items():
        out[w] = {'name': c['name'], 'w': c['w'], 'l': c['l'], 'push': c['push'], 'open': c['open'], 'n': c['w'] + c['l'],
                  'tickets': len(c['tickets']), 'tw': c['tw'], 'tl': c['tl'], 'stake': round(c['stake'], 2)}
    d = {'updatedTs': int(time.time()), 'source': 'ledger bets.csv (Kalshi tickets), matched to scanner picks',
         'tickets': len(rows), 'ticketsMatched': tickets_matched, 'legs': legs_total, 'legsMatched': matched_legs, 'wallets': out}
    json.dump(d, open(OUT, 'w'), separators=(',', ':'))
    print(f"copies: {tickets_matched}/{len(rows)} Kalshi tickets matched, {matched_legs}/{legs_total} legs, {len(out)} whales credited")

if __name__ == '__main__':
    main()
