"""Distinctive-token Kalshi team matching. Never pick a contract by list order."""
import re
import unicodedata

GENERIC = {
    "esports", "esport", "gaming", "team", "teams", "club", "clubs", "academy", "clan",
    "the", "fc", "cf", "sc", "afc", "and", "sports", "sport", "org", "gg", "official",
    "boys", "girls", "betting", "wins", "win", "winner",
}

# Nickname -> Kalshi yes_sub_title forms (city, city+initial, official name).
ALIASES = {
    # NBA
    "hawks": ["atlanta"], "celtics": ["boston"], "nets": ["brooklyn"],
    "hornets": ["charlotte"], "bulls": ["chicago"], "cavaliers": ["cleveland"], "cavs": ["cleveland"],
    "mavericks": ["dallas"], "mavs": ["dallas"], "nuggets": ["denver"], "pistons": ["detroit"],
    "warriors": ["golden state"], "rockets": ["houston"], "pacers": ["indiana"],
    "clippers": ["los angeles c", "la clippers", "los angeles clippers"],
    "lakers": ["los angeles l", "la lakers", "los angeles lakers"],
    "grizzlies": ["memphis"], "heat": ["miami"], "bucks": ["milwaukee"],
    "timberwolves": ["minnesota"], "pelicans": ["new orleans"],
    "knicks": ["new york knicks", "new york k", "ny knicks"],
    "thunder": ["oklahoma city", "okc"], "magic": ["orlando"],
    "76ers": ["philadelphia"], "sixers": ["philadelphia"], "philly": ["philadelphia"],
    "suns": ["phoenix"], "blazers": ["portland"], "trail blazers": ["portland"],
    "kings": ["sacramento", "los angeles k"],
    "spurs": ["san antonio"], "raptors": ["toronto"], "jazz": ["utah"], "wizards": ["washington"],
    # NHL
    "ducks": ["anaheim"], "bruins": ["boston"], "sabres": ["buffalo"], "flames": ["calgary"],
    "hurricanes": ["carolina"], "canes": ["carolina"], "blackhawks": ["chicago"],
    "avalanche": ["colorado"], "avs": ["colorado"], "blue jackets": ["columbus"],
    "jackets": ["columbus"], "stars": ["dallas"], "red wings": ["detroit"], "wings": ["detroit"],
    "oilers": ["edmonton"], "panthers": ["florida"],
    "wild": ["minnesota"], "canadiens": ["montreal"], "habs": ["montreal"],
    "predators": ["nashville"], "preds": ["nashville"], "devils": ["new jersey"],
    "islanders": ["new york i", "ny islanders", "new york islanders"],
    "rangers": ["new york r", "ny rangers", "new york rangers"],
    "senators": ["ottawa"], "sens": ["ottawa"], "flyers": ["philadelphia"],
    "penguins": ["pittsburgh"], "pens": ["pittsburgh"], "sharks": ["san jose"],
    "kraken": ["seattle"], "blues": ["st louis", "st. louis"],
    "lightning": ["tampa bay"], "maple leafs": ["toronto"], "leafs": ["toronto"],
    "canucks": ["vancouver"], "golden knights": ["vegas", "las vegas"], "knights": ["vegas", "las vegas"],
    "capitals": ["washington"], "caps": ["washington"], "jets": ["winnipeg", "new york j", "ny jets"],
    # NFL (subset of nickname->city; Jets already above)
    "cardinals": ["arizona"], "falcons": ["atlanta"], "ravens": ["baltimore"],
    "bills": ["buffalo"], "bears": ["chicago"], "bengals": ["cincinnati"], "browns": ["cleveland"],
    "cowboys": ["dallas"], "broncos": ["denver"], "lions": ["detroit"], "packers": ["green bay"],
    "texans": ["houston"], "colts": ["indianapolis"], "jaguars": ["jacksonville"], "jags": ["jacksonville"],
    "chiefs": ["kansas city"], "raiders": ["las vegas"],
    "chargers": ["los angeles chargers", "la chargers"],
    "rams": ["los angeles rams", "la rams"], "dolphins": ["miami"], "vikings": ["minnesota"],
    "patriots": ["new england"], "saints": ["new orleans"],
    "giants": ["new york g", "ny giants", "new york giants"],
    "eagles": ["philadelphia"], "steelers": ["pittsburgh"],
    "49ers": ["san francisco"], "niners": ["san francisco"], "seahawks": ["seattle"],
    "buccaneers": ["tampa bay"], "bucs": ["tampa bay"], "titans": ["tennessee"],
    "commanders": ["washington"],
    # MLB
    "diamondbacks": ["arizona"], "dbacks": ["arizona"], "braves": ["atlanta"],
    "orioles": ["baltimore"], "red sox": ["boston"], "cubs": ["chicago c", "chicago cubs"],
    "white sox": ["chicago w", "chicago white sox"], "reds": ["cincinnati"],
    "guardians": ["cleveland"], "rockies": ["colorado"], "tigers": ["detroit"],
    "astros": ["houston"], "royals": ["kansas city"], "angels": ["los angeles a", "la angels"],
    "dodgers": ["los angeles d", "la dodgers"], "marlins": ["miami"], "brewers": ["milwaukee"],
    "twins": ["minnesota"], "mets": ["new york m", "ny mets"], "yankees": ["new york y", "ny yankees"],
    "athletics": ["athletics", "oakland", "sacramento a"], "as": ["athletics"],
    "phillies": ["philadelphia"], "pirates": ["pittsburgh"], "padres": ["san diego"],
    "giants": ["san francisco", "new york g", "ny giants", "new york giants"],
    "mariners": ["seattle"], "cardinals": ["st louis", "st. louis", "arizona"],
    "rays": ["tampa bay"], "rangers": ["texas", "new york r", "ny rangers"],
    "blue jays": ["toronto"], "nationals": ["washington"], "nats": ["washington"],
}

_WIN_NO = re.compile(r"\bnot\s+to\s+win\b", re.I)
_WIN_YES = re.compile(r"\b(?:to\s+win|WIN)\b")
_OVER = re.compile(r"^\s*over\b|\bover\s+\d", re.I)
_UNDER = re.compile(r"^\s*under\b|\bunder\s+\d", re.I)
_LINE = re.compile(r"(\d+(?:\.\d+)?)")


def _fold(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode()


def raw(s):
    return re.sub(r"[^a-z0-9]+", " ", _fold(s).lower()).strip()


# A reserve / academy / women's side is a different team: "Spirit" must never match "Spirit Academy" (GENERIC drops the word otherwise).
QUAL = {"academy", "junior", "juniors", "youth", "women", "female", "fe", "ladies", "reserves", "reserve", "ii", "u19", "u21", "u23"}


def _qual(s):
    return {w for w in raw(s).split() if w in QUAL}


def tokens(s):
    return [w for w in raw(s).split() if w and w not in GENERIC and (len(w) >= 2 or any(ch.isdigit() for ch in w))]


def backing_core(label):
    s = (label or "").strip()
    side = None
    if _UNDER.search(s):
        side = "under"
    elif _OVER.search(s):
        side = "over"
    elif _WIN_NO.search(s):
        side = "no"
        s = _WIN_NO.sub("", s)
    elif _WIN_YES.search(s):
        side = "yes"
        s = _WIN_NO.sub("", s)
        s = re.sub(r"\bto\s+win\b", "", s, flags=re.I)
        s = re.sub(r"\bWIN\b", "", s)
    return re.sub(r"\s+", " ", s).strip(), side


def expand(s):
    out = [s]
    seen = {raw(s)}
    xs = tokens(s)
    keys = [" ".join(xs)] + xs
    if len(xs) >= 2:
        keys.append(" ".join(xs[-2:]))
    for k in keys:
        for alt in ALIASES.get(k, ()):
            r = raw(alt)
            if r and r not in seen:
                seen.add(r)
                out.append(alt)
    return out


def _token_hit(a, b):
    xs, ys = tokens(a), tokens(b)
    if not xs or not ys:
        return False
    xj, yj = " ".join(xs), " ".join(ys)
    if xj == yj or xj in yj or yj in xj:
        return True
    sh, lg = (xs, ys) if len(xs) <= len(ys) else (ys, xs)
    return all(w in lg for w in sh)


def name_hit(a, b):
    if _qual(a) != _qual(b):
        return False
    ra, rb = raw(a), raw(b)
    if ra and rb and ra == rb:
        return True
    if _token_hit(a, b):
        return True
    for va in expand(a)[1:]:
        if raw(va) == rb or _token_hit(va, b):
            return True
    for vb in expand(b)[1:]:
        if raw(vb) == ra or _token_hit(a, vb):
            return True
    return False


def name_score(backing, yes_title):
    if not name_hit(backing, yes_title):
        return -1
    xs, ys = tokens(backing), tokens(yes_title)
    if raw(backing) == raw(yes_title) or (xs and ys and xs == ys):
        return 100
    if _token_hit(backing, yes_title):
        overlap = len(set(xs) & set(ys))
        return 80 + overlap * 2 - abs(len(xs) - len(ys))
    return 50


def find_team_market(markets, backing, yes_key="yes_sub_title"):
    if not markets or not backing:
        return None
    name, _side = backing_core(backing)
    name = name or backing
    scored = []
    for m in markets:
        yes = (m.get(yes_key) or "").strip()
        sc = name_score(name, yes)
        if sc >= 0 and yes:
            scored.append((sc, m))
    if not scored:
        return None
    scored.sort(key=lambda x: -x[0])
    if len(scored) > 1 and scored[0][0] == scored[1][0]:
        return None
    return scored[0][1]
