"""Hot This Week: cappers on a short-term heater, and their open pre-game $500+ Kalshi-matched bets.

Qualifies (Noel Nov 17): 8+ settled $500+ bets in the last 7 days, win rate 60%+, positive 7-day and 30-day P&L, not a
market maker / bot, and none of the age, big-bet-count, one-off or Cooling flags. Settled results come from backfill.json
(daily cells per wallet). The hot list is recomputed on every full scan and every hourly refresh."""
import time

MIN_N7 = 8
MIN_WR = 0.60
# capper_history.eligibility() reasons that keep a capper off the hot list (the rest of the proven floor is replaced by the 7/30-day gates)
BLOCK_WHY = ('market maker', 'one-off', 'account age unknown', 'account younger', 'under 30 graded big bets')


def _window(cells, today, days):
    w = l = 0
    pnl = 0.0
    for k, v in (cells or {}).items():
        try:
            day = int(k.split('|')[1])
        except Exception:
            continue
        if day > today - days:
            w += v[0]
            l += v[1]
            pnl += v[4]
    return w, l, pnl


def hot_list(capper_history, backfill, now=None):
    """{wallet: capper record + hot stats}."""
    import capper_history as ch
    now = now or time.time()
    today = int(now // 86400)
    bw = (backfill or {}).get('wallets') or {}
    out = {}
    for c in (capper_history or {}).get('cappers') or []:
        w = (c.get('wallet') or '').lower()
        b = bw.get(w)
        if not w or not b:
            continue
        if c.get('mm') or c.get('oneOff') or c.get('badge') == 'Cooling':
            continue
        try:
            why = ch.eligibility(c, now)
        except Exception:
            continue
        if any(x.startswith(BLOCK_WHY) for x in why):
            continue
        w7, l7, p7 = _window(b.get('cells'), today, 7)
        w30, l30, p30 = _window(b.get('cells'), today, 30)
        n7 = w7 + l7
        if n7 < MIN_N7 or w7 / n7 < MIN_WR or p7 <= 0 or p30 <= 0:
            continue
        r = dict(c)
        r['hot'] = dict(w7=w7, l7=l7, n7=n7, wr7=round(100.0 * w7 / n7, 1), pnl7=round(p7), w30=w30, l30=l30, pnl30=round(p30))
        out[w] = r
    return out


def build(emb, now=None, log=print):
    """Return the data.json 'hotWeek' block: {ts, cappers: [...], games: [coming-up shaped cards]}."""
    import backfill as bf
    import coming_up as cu
    import floor_positions as fp
    now = now or time.time()
    hot = hot_list(emb.get('capperHistory') or {}, bf.load() or {}, now)
    cappers = []
    for w, r in hot.items():
        cappers.append(dict(wallet=w, name=r.get('name') or (w[:6] + '…' + w[-4:]), **r['hot']))
    cappers.sort(key=lambda c: -c['pnl7'])
    games = []
    try:
        rows, ok = fp.build_rows(emb.get('capperHistory') or {}, now=now, log=log, wallets=hot, label='hot-week')
        games = cu.build(rows, emb.get('capperHistory') or {}, now, now + fp.WINDOW_DAYS * 86400, proven=emb.get('provenPicks'), hot_override=hot)
    except Exception as e:
        log('hot week picks failed:', e)
    log(f'hot week: {len(cappers)} cappers, {len(games)} game cards')
    return dict(ts=int(now), cappers=cappers, games=games)


def hot_wallet_set(block):
    return {c['wallet'] for c in (block or {}).get('cappers') or []}
