"""OrcaLayer leaderboard lenses for the Polymarket scanner (Noel, Nov 24).

A handful of /api/leaderboard calls per scan or refresh. Boosts Proven-only,
Smart-only, Copyable scale + Sports, and Niche specialist + Sports wallets.
Skips very-short-hold flippers (hold < 1h) and tiny typical trade size
(avg under $25). Does not change the $500+ pick minimum.

Cache: scanner/orca_lenses.json (gitignored). Fresh when older than 3 hours.
Never logs or writes the API key.
"""
import json, os, time

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, 'orca_lenses.json')
TTL = 3 * 3600
LIMIT = 100

# Copyable scale + Sports / Niche specialist + Sports, as on orcalayer.com.
LENSES = {
    'smart':    dict(filter='smart', category='Sports'),
    'proven':   dict(filter='smart', category='Sports', skill='1'),
    'copyable': dict(filter='smart', category='Sports', min_avg_size='50', max_avg_size='500', min_roi='25'),
    'niche':    dict(filter='smart', category='Sports', min_conc='70', max_active='20', min_wr='60'),
    'flipper':  dict(filter='smart', category='Sports', hold_bucket='lt1h'),
    'tiny':     dict(filter='smart', category='Sports', max_avg_size='25'),
}

BASE = dict(sort='total_pnl', sort_dir='desc', page=1, hide_farmers='true', hide_bots='true',
            hide_sports='false', hide_crypto='false', period='All Time', min_markets='10', limit=str(LIMIT))

_STATE = None


_LENS_KEYS = ('smart', 'proven', 'copyable', 'niche', 'flipper', 'tiny')


def _empty():
    return dict(ts=0, reachable=True, missing=[], smart=[], proven=[], copyable=[], niche=[], flipper=[], tiny=[])


def _normalize(d):
    """Accept a cache or page_embed payload; None if it is not a lens object."""
    if not isinstance(d, dict):
        return None
    if not any(isinstance(d.get(k), list) for k in _LENS_KEYS):
        return None
    out = _empty()
    out['ts'] = int(d.get('ts') or 0)
    out['reachable'] = bool(d.get('reachable', True))
    out['missing'] = list(d.get('missing') or [])
    for k in _LENS_KEYS:
        out[k] = [w for w in (d.get(k) or []) if w]
    return out


def _has_lists(d):
    return bool(d and any(d.get(k) for k in _LENS_KEYS))


def _load_cache():
    try:
        d = json.load(open(CACHE))
        return _normalize(d)
    except Exception:
        return None


def _wallets(rows):
    out, seen = [], set()
    for r in rows or []:
        w = (r.get('wallet') or '').lower()
        if w and w not in seen:
            seen.add(w)
            out.append(w)
    return out


def _fetch(name):
    from orca import orca
    params = dict(BASE)
    params.update(LENSES[name])
    d = orca('/api/leaderboard', params, tries=2, timeout=45)
    if not d or not isinstance(d, dict) or 'traders' not in d:
        return None
    return _wallets(d.get('traders'))


def refresh(force=False, prior=None):
    """Fetch (or reuse cached / previous embed) lens membership. Never wipes good lists to empty."""
    global _STATE
    cached = _load_cache()
    prior = _normalize(prior) or _normalize(_STATE)
    seed = cached if _has_lists(cached) else (prior if _has_lists(prior) else (cached or prior))
    if not force and cached and _has_lists(cached) and (time.time() - (cached.get('ts') or 0)) < TTL:
        _STATE = cached
        return cached
    out = _empty()
    out['ts'] = int(time.time())
    missing = []
    for name in LENSES:
        rows = None
        try:
            rows = _fetch(name)
        except Exception as e:
            missing.append('%s:%s' % (name, type(e).__name__))
            rows = None
        if rows is None:
            if name not in missing and not any(str(x).startswith(name + ':') for x in missing):
                missing.append(name)
            if seed and seed.get(name):
                out[name] = list(seed[name])
            else:
                out[name] = []
        else:
            out[name] = rows
    # A failed or key-less fetch must not wipe a good cache or the last page_embed lists.
    if missing and seed and _has_lists(seed) and (len(missing) >= len(LENSES) or not _has_lists(out)):
        kept = dict(seed)
        kept['missing'] = missing
        kept['reachable'] = False
        _STATE = kept
        print('orca lenses: fetches failed, keeping previous lists (%s)' % ','.join(missing), flush=True)
        return kept
    out['missing'] = missing
    out['reachable'] = not missing
    try:
        if _has_lists(out):
            json.dump(out, open(CACHE, 'w'), separators=(',', ':'))
    except Exception:
        pass
    _STATE = out
    print('orca lenses: smart %d, proven %d, copyable %d, niche %d, flipper %d, tiny %d%s' % (
        len(out['smart']), len(out['proven']), len(out['copyable']), len(out['niche']),
        len(out['flipper']), len(out['tiny']),
        (' (missing: ' + ','.join(missing) + ')' if missing else '')), flush=True)
    return out


def state():
    global _STATE
    if _STATE is None:
        _STATE = _load_cache() or _empty()
    return _STATE


def payload(prior=None):
    """Compact wallet lists to embed on the page (no extra fields). Fills empty keys from prior."""
    s = state()
    prior = _normalize(prior)
    out = dict(ts=s.get('ts') or 0, smart=s.get('smart') or [], proven=s.get('proven') or [],
                copyable=s.get('copyable') or [], niche=s.get('niche') or [],
                flipper=s.get('flipper') or [], tiny=s.get('tiny') or [],
                missing=s.get('missing') or [])
    if prior and _has_lists(prior):
        for k in _LENS_KEYS:
            if not out.get(k) and prior.get(k):
                out[k] = list(prior[k])
    return out


def flags(wallet):
    w = (wallet or '').lower()
    s = state()
    if not w:
        return dict(smart=False, proven=False, copyable=False, niche=False, flipper=False, tiny=False)
    return dict(
        smart=w in s['smart'],
        proven=w in s['proven'],
        copyable=w in s['copyable'],
        niche=w in s['niche'],
        flipper=w in s['flipper'],
        tiny=w in s['tiny'],
    )


def skip(wallet):
    f = flags(wallet)
    return bool(f['flipper'] or f['tiny'])
