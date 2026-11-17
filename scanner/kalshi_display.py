#!/usr/bin/env python3
"""Build kalshi_display.json from live Kalshi event markets for tickers in the current scan.
Used by the page to prefer Yes on a team's own contract and to show Kalshi's titles/subtitles.
"""
import json, os, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
API = "https://api.elections.kalshi.com/trade-api/v2"
OUT = os.path.join(ROOT, "kalshi_display.json")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def fp(v):
    if v is None or v == "":
        return None
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if x > 0 else None


def collect_tickers():
    tickers = set()

    def walk(obj):
        if isinstance(obj, dict):
            t = obj.get("ticker") or obj.get("oppTicker")
            if isinstance(t, str) and t.startswith("KX"):
                tickers.add(t)
            k = obj.get("kalshi")
            if isinstance(k, dict):
                for key in ("ticker", "oppTicker"):
                    v = k.get(key)
                    if isinstance(v, str) and v.startswith("KX"):
                        tickers.add(v)
            for v in obj.values():
                walk(v)
        elif isinstance(obj, list):
            for v in obj:
                walk(v)

    for name in ("data.json", "proven_picks.json"):
        path = os.path.join(ROOT, name)
        if os.path.exists(path):
            with open(path) as f:
                walk(json.load(f))
    return sorted(tickers)


def event_ticker_of(ticker, market=None):
    if market and market.get("event_ticker"):
        return market["event_ticker"]
    if ticker and "-" in ticker:
        return ticker.rsplit("-", 1)[0]
    return None


def slim_market(m):
    return {
        "ticker": m.get("ticker"),
        "title": m.get("title") or "",
        "yes_sub_title": m.get("yes_sub_title") or "",
        "no_sub_title": m.get("no_sub_title") or "",
        "yes_ask": fp(m.get("yes_ask_dollars")),
        "no_ask": fp(m.get("no_ask_dollars")),
    }


def main():
    tickers = collect_tickers()
    events = {}
    by_ticker = {}
    seen_ev = set()
    for t in tickers:
        try:
            raw = get(API + "/markets/" + t)
        except Exception as e:
            print("skip", t, e)
            continue
        m = raw.get("market") or raw
        ev_tk = event_ticker_of(t, m)
        if not ev_tk or ev_tk in seen_ev:
            if ev_tk:
                by_ticker[t] = ev_tk
            continue
        seen_ev.add(ev_tk)
        try:
            evraw = get(API + "/events/" + ev_tk + "?with_nested_markets=true")
        except Exception as e:
            print("skip event", ev_tk, e)
            continue
        ev = evraw.get("event") or evraw
        mkts = ev.get("markets") or []
        events[ev_tk] = {
            "title": ev.get("title") or "",
            "sub_title": ev.get("sub_title") or "",
            "markets": [slim_market(x) for x in mkts if x.get("ticker")],
        }
        for x in mkts:
            if x.get("ticker"):
                by_ticker[x["ticker"]] = ev_tk
        by_ticker[t] = ev_tk
    out = {"events": events, "byTicker": by_ticker}
    with open(OUT, "w") as f:
        json.dump(out, f, indent=2)
        f.write("\n")
    print("kalshi_display.json: %d events, %d tickers (from %d scan tickers)" % (len(events), len(by_ticker), len(tickers)))


if __name__ == "__main__":
    main()
