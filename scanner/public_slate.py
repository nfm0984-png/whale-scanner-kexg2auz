#!/usr/bin/env python3
"""Plain, non-secret current-picks summary for cross-scanner badges. Never writes decrypted data.json."""
import json, os
from datetime import datetime
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "public_slate.json")
PT = ZoneInfo("America/Los_Angeles")


def _yes_no(side):
    act = (side.get("action") or "").upper()
    if "YES" in act:
        return "Yes"
    if "NO" in act:
        return "No"
    yn = (side.get("yesNo") or side.get("side") or "").strip()
    if yn.lower() in ("yes", "y"):
        return "Yes"
    if yn.lower() in ("no", "n"):
        return "No"
    return yn


def picks_from_coming(games):
    out = []
    for g in games or []:
        game = (g.get("game") or "").strip()
        start_ts = g.get("startTs") or 0
        for m in g.get("markets") or []:
            for s in m.get("sides") or []:
                n = s.get("cappers") or len(s.get("backers") or [])
                if not n:
                    continue
                ticker = (s.get("ticker") or "").strip().upper()
                if not ticker and not (s.get("label") or s.get("side")):
                    continue
                out.append({
                    "ticker": ticker,
                    "yesNo": _yes_no(s),
                    "side": (s.get("label") or s.get("side") or "").strip(),
                    "game": game or (s.get("eventTitle") or s.get("marketTitle") or ""),
                    "startTs": start_ts,
                    "bt": m.get("kind") or "",
                    "n": int(n),
                })
    return out


def write(picks, path=OUT, source="whale"):
    now = datetime.now(PT)
    data = {
        "source": source,
        "ts": int(now.timestamp()),
        "updatedAt": now.strftime("%a %b %-d · %-I:%M %p PT"),
        "picks": picks,
    }
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    return data


def write_from_data(data, path=OUT):
    picks = picks_from_coming(data.get("comingUp") or data.get("games") or [])
    d = write(picks, path)
    print("public_slate", d["updatedAt"], "n", len(picks))
    return d


if __name__ == "__main__":
    path = os.path.join(ROOT, "data.json")
    obj = json.load(open(path))
    if isinstance(obj, dict) and obj.get("enc") == 1:
        from gate_crypto import decrypt_obj
        obj = decrypt_obj(obj)
    write_from_data(obj)
