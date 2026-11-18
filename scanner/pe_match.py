"""Politics & Econ: match a Polymarket position to a Kalshi market with the same outcome and the same side.

Rules (kept strict on purpose; a wrong side was a real bug before):
- the Polymarket question and the Kalshi market question must say the same thing: same named entities, same numbers,
  same deadline (±2 days) and no extra or missing content words;
- Polymarket Yes -> Kalshi Yes on that market, Polymarket No -> Kalshi No;
- Fed "no change / increase / cut by N bps" questions are mapped by template to Kalshi's Fed-decision markets;
- anything ambiguous (more than one equally good Kalshi market) is dropped."""
import datetime as dt, re, json, time, urllib.parse, urllib.request

API = 'https://api.elections.kalshi.com/trade-api/v2'
SKIP_CATS = {'Sports'}
MONTHS = {m: i + 1 for i, m in enumerate(['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'])}
for _k, _v in list(MONTHS.items()):
    MONTHS[_k[:3]] = _v
MONTHS['sept'] = 9
STOP = set('will the be a an of to in by on at before after for and or is are as it its this that than with from has have into end their there'.split())
SYN = [(r'\bj\.?\s?d\.?\s', 'jd '), (r'\bu\.s\.a?\.?', 'us'), (r'\bunited states\b', 'us'), (r"['’]s\b", ''), (r'\bu\.k\.', 'uk'), (r'\bunited kingdom\b', 'uk'),
       (r'\bpresident\b', 'president'), (r'\bpresidential\b', 'president'), (r'\bnominee\b', 'nomination'), (r'\bdemocrat(?:ic)?\b', 'democratic'),
       (r'\brepublican\b', 'republican'), (r'\bprime minister\b', 'pm'), (r'\bsecretary of defense\b', 'defense secretary'), (r'\bsecretary of state\b', 'state secretary')]
DATE_RE = re.compile(r'\b(?:(?:by|before|on|in|through|until|during|after)\s+)?(?:(january|february|march|april|may|june|july|august|september|sept|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d\d))?|(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d\d))\b', re.I)


def _norm(s):
    s = (s or '').lower()
    for a, b in SYN:
        s = re.sub(a, b, s)
    return s


def _deadline(title, text_end=None):
    """Date a question resolves by (YYYY-MM-DD), from 'by December 31, 2026' / 'before Jan 1, 2027' / 'before 2027' / 'in 2026'."""
    t = _norm(title)
    m = DATE_RE.search(t)
    y = None
    if m:
        if m.group(1):
            mon = MONTHS[m.group(1).lower()]
            day = int(m.group(2))
            y = int(m.group(3)) if m.group(3) else None
            if y is None:
                return None
            try:
                d = dt.date(y, mon, day)
            except ValueError:
                return None
            if re.search(r'\bbefore\b', t[max(0, m.start() - 8):m.start() + 7]) or t[max(0, m.start() - 8):m.start()].strip().endswith('before'):
                d -= dt.timedelta(days=1)
            return d
        mon = MONTHS[m.group(4).lower()]
        y = int(m.group(5))
        return ('month', y, mon)
    m = re.search(r'\b(before|by|in|during|through)\s+(20\d\d)\b', t)
    if m:
        y = int(m.group(2))
        return dt.date(y - 1, 12, 31) if m.group(1) == 'before' else dt.date(y, 12, 31)
    return None


def _dates_equal(a, b):
    if a is None or b is None:
        return a is None and b is None
    if isinstance(a, tuple) or isinstance(b, tuple):
        if isinstance(a, tuple) and isinstance(b, tuple):
            return a == b
        d, t = (b, a) if isinstance(a, tuple) else (a, b)
        return (d.year, d.month) == (t[1], t[2])
    return abs((a - b).days) <= 2


def _content(title):
    """Content-word set without dates, stop words and number-less glue."""
    t = _norm(title)
    t = DATE_RE.sub(' ', t)
    t = re.sub(r'\b(by|before|in|during|through)\s+20\d\d\b', ' ', t)
    t = re.sub(r'[^a-z0-9$%.\s]', ' ', t)
    t = re.sub(r'(?<=\d),(?=\d)', '', t)
    toks = [w.strip('.') for w in t.split()]
    return frozenset(w for w in toks if w and w not in STOP)


def slim_market(e, m):
    def f(k):
        try:
            v = float(m.get(k))
            return v if v > 0 else None
        except (TypeError, ValueError):
            return None
    return dict(t=m.get('ticker'), ev=e.get('event_ticker'), et=e.get('title') or '', cat=e.get('category') or '', q=m.get('title') or '', ys=m.get('yes_sub_title') or '', ns=m.get('no_sub_title') or '',
                ya=f('yes_ask_dollars'), na=f('no_ask_dollars'), yb=f('yes_bid_dollars'), nb=f('no_bid_dollars'),
                close=m.get('close_time') or '', exp=m.get('expected_expiration_time') or '', vol=f('volume_fp') or 0, oi=f('open_interest_fp') or 0)


def _get(url, tries=4, timeout=25):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 whale-scanner'}), timeout=timeout) as r:
                return json.loads(r.read().decode())
        except urllib.error.HTTPError as ex:
            if ex.code == 404:
                return None
            time.sleep(2 + 2 * i if ex.code == 429 else 1 + i)
        except Exception:
            time.sleep(1 + i)
    return None


def list_events(budget_s=120, log=print):
    """All open non-sports Kalshi events WITHOUT their markets (200 per call, ~1s each). -> (events, complete)."""
    out, cur, t0, n, complete = [], None, time.time(), 0, True
    while True:
        if time.time() - t0 > budget_s:
            complete = False
            break
        p = dict(status='open', limit=200)
        if cur:
            p['cursor'] = cur
        r = _get(API + '/events?' + urllib.parse.urlencode(p))
        if r is None:
            complete = False
            break
        for e in r.get('events') or []:
            n += 1
            if e.get('category') not in SKIP_CATS and e.get('event_ticker'):
                out.append(dict(ev=e['event_ticker'], title=e.get('title') or '', cat=e.get('category') or ''))
        cur = r.get('cursor')
        if not cur:
            break
    log(f'kalshi events listed: {len(out)} non-sports of {n} in {time.time() - t0:.0f}s' + ('' if complete else ' (INCOMPLETE)'))
    return out, complete


GENERIC = set('win wins next who what when how many much price above below more less than over under at least most first last new total number'.split())


def candidate_events(events, titles, per_title=6):
    """Kalshi event tickers whose title shares 2+ content words with a Polymarket question (a generous pre-filter; the strict match comes later)."""
    inv = {}
    ev_toks = {}
    for e in events:
        toks = {w for w in _content(e['title']) if w not in GENERIC and len(w) > 2}
        ev_toks[e['ev']] = toks
        for w in toks:
            inv.setdefault(w, []).append(e['ev'])
    chosen = set()
    for t in titles:
        tt = {w for w in _content(t) if w not in GENERIC and len(w) > 2}
        score = {}
        for w in tt:
            for ev in inv.get(w, ()):
                score[ev] = score.get(ev, 0) + 1
        good = sorted(((c, ev) for ev, c in score.items() if c >= 2), reverse=True)[:per_title]
        chosen.update(ev for _, ev in good)
        if canon_poly(t):
            chosen.update(x for x in ('KXPRESPERSON-28', 'KXPRESNOMD-28', 'KXPRESNOMR-28') if x in ev_toks)
        ft = _fed_template(t)
        if ft:
            mon, y, _ = ft
            tk = 'KXFEDDECISION-%02d%s' % (y % 100, [k.upper() for k, v in MONTHS.items() if v == mon and len(k) == 3][0])
            if tk in ev_toks:
                chosen.add(tk)
    return sorted(chosen)


def fetch_event_markets(ev_tickers, budget_s=150, workers=6, log=print):
    """Open markets (slimmed) of the given events, fetched one event per call. -> (markets, complete)."""
    from concurrent.futures import ThreadPoolExecutor
    t0 = time.time()
    out, done = [], [0]

    def one(tk):
        if time.time() - t0 > budget_s:
            return None
        r = _get(API + '/events/' + tk + '?with_nested_markets=true', tries=3)
        if r is None:
            return []
        e = r.get('event') or {}
        e = dict(e, markets=r.get('markets') or e.get('markets') or [])
        return [slim_market(e, m) for m in e['markets'] if m.get('status') in ('active', 'open') and m.get('ticker')]
    complete = True
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for res in ex.map(one, ev_tickers):
            if res is None:
                complete = False
            else:
                out += res
    log(f'kalshi candidate events: {len(ev_tickers)} fetched, {len(out)} open markets in {time.time() - t0:.0f}s' + ('' if complete else ' (INCOMPLETE)'))
    return out, complete


def _name(s):
    import unicodedata
    s = unicodedata.normalize('NFKD', s or '').encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\bj\.?\s?d\.?\s', 'jd ', s + ' ')
    return re.sub(r'[^a-z ]', '', s).strip()


def _party(s):
    s = (s or '').lower()
    return 'D' if 'democrat' in s else ('R' if 'republican' in s else None)


def canon_poly(title):
    """Canonical proposition keys for the multi-candidate US presidential markets Kalshi words differently."""
    t = _norm(title)
    m = re.match(r'will (.+?) win the (20\d\d) (?:us )?president\w* election\??$', t)
    if m:
        return ('pres', m.group(2), _name(m.group(1)))
    m = re.match(r'will (.+?) win the (20\d\d) (democratic|republican) president\w* nomination\??$', t)
    if m:
        return ('nom', m.group(2), _party(m.group(3)), _name(m.group(1)))
    return None


def canon_kalshi(m):
    t = m['t']
    if t.startswith('KXPRESPERSON-'):
        yy = t.split('-')[1]
        return ('pres', '20' + yy, _name(m['ys']))
    if t.startswith(('KXPRESNOMD-', 'KXPRESNOMR-')) and m['ys']:
        return ('nom', '20' + t.split('-')[1], 'D' if t.startswith('KXPRESNOMD-') else 'R', _name(m['ys']))
    return None


class Index:
    def __init__(self, markets):
        self.markets = markets
        self.by_tok = {}
        self.canon = {}
        for i, m in enumerate(markets):
            ck = canon_kalshi(m)
            if ck:
                self.canon.setdefault(ck, []).append(m)
            m['_c'] = _content(m['q'])
            m['_d'] = _deadline(m['q'])
            for w in m['_c']:
                self.by_tok.setdefault(w, set()).add(i)

    def candidates(self, toks):
        sets = [self.by_tok.get(w) for w in toks]
        if not sets or any(s is None for s in sets):
            return []
        sets.sort(key=len)
        r = set(sets[0])
        for s in sets[1:]:
            r &= s
            if not r:
                break
        return [self.markets[i] for i in r]


FED_RE = re.compile(r'fed(?:eral reserve)?(?: interest)? rates? .*?(?P<mon>january|february|march|april|may|june|july|august|september|october|november|december)\s+(?P<y>20\d\d)\s+meeting', re.I)


def _fed_template(title):
    """-> (month, year, kind) kind in {'hold','hike25','cut25','cut50'} for Polymarket Fed-decision questions, else None."""
    t = _norm(title)
    m = re.search(r'(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d\d)\s+meeting', t)
    if not m or 'fed' not in t:
        return None
    mon, y = MONTHS[m.group(1)], int(m.group(2))
    if re.search(r'\bno change in fed', t):
        return mon, y, 'hold'
    k = re.search(r'fed (increase|decrease|cut|raise)[^?]*?(?:by )?(\d+)\+? ?bps', t)
    if k:
        n = int(k.group(2))
        up = k.group(1) in ('increase', 'raise')
        if '+' in t[k.start():k.end() + 1] or '50+' in t:
            return None
        if up and n == 25:
            return mon, y, 'hike25'
        if not up and n == 25:
            return mon, y, 'cut25'
        if not up and n == 50:
            return mon, y, 'cut50'
    return None


def match(index, title, outcome):
    """-> dict(market=<kalshi slim>, yesNo='Yes'|'No', how=...) or None."""
    if outcome not in ('Yes', 'No'):
        return None
    side = outcome
    ft = _fed_template(title)
    if ft:
        mon, y, kind = ft
        want = {'hold': ('Fed maintains', 'H0'), 'hike25': ('Hike 25', 'H25'), 'cut25': ('Cut 25', 'C25'), 'cut50': ('Cut >25', 'C26')}[kind]
        pre = 'KXFEDDECISION-%02d%s' % (y % 100, [k.upper() for k, v in MONTHS.items() if v == mon and len(k) == 3][0])
        c = [m for m in index.markets if m['t'].startswith(pre + '-') and m['t'].endswith('-' + want[1])]
        if len(c) == 1:
            return dict(market=c[0], yesNo=side, how='fed')
        return None
    ck = canon_poly(title)
    if ck:
        c = index.canon.get(ck)
        if c and len(c) == 1:
            return dict(market=c[0], yesNo=side, how='canon')
        return None
    toks = _content(title)
    dl = _deadline(title)
    if len(toks) < 2:
        return None
    best = []
    for m in index.candidates(toks):
        if m['_c'] != toks:
            continue
        if not _dates_equal(dl, m['_d']):
            continue
        best.append(m)
    if len(best) == 1:
        return dict(market=best[0], yesNo=side, how='title')
    # several identical-title markets (e.g. one per expiry): they must not differ in deadline; ambiguous -> drop
    return None
