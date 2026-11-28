#!/usr/bin/env python3
"""t1134: Best Double qualifying rules."""
import os, sys, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import best_double as bd


def cap(name="Ace", tag="high", month=1000, year=5000, sport=None, cost=5000, **extra):
    row = {
        "name": name,
        "cost": cost,
        "size": {"tag": tag, "mult": 4.0 if tag == "high" else (0.3 if tag == "fun" else 1.0)},
        "monthPnl": month,
        "yearPnl": year,
        "sport": sport or {"name": "NBA", "n": 20, "w": 14, "l": 6, "roi": 12},
    }
    row.update(extra)
    return row


def pick(pid="p1", game="g1", price=0.68, entry=0.66, backers=None, own=10, opp=2, **extra):
    row = {
        "id": pid,
        "gameId": game,
        "label": extra.get("label") or "Lakers",
        "game": extra.get("gameName") or "Lakers vs Spurs",
        "league": "NBA",
        "price": price,
        "entry": entry,
        "backers": backers if backers is not None else [cap()],
        "ownScore": own,
        "oppScore": opp,
    }
    row.update(extra)
    return row


class TestSkips(unittest.TestCase):
    def test_same_game_does_not_make_a_double(self):
        # Two strong legs on the same game, nothing else → no double.
        a = pick("a", "g1", 0.70, backers=[cap("Ann")])
        b = pick("b", "g1", 0.65, backers=[cap("Bob")])
        self.assertIsNone(bd.select_double([a, b]))
        # Add a third qualifying leg on a different game → legs come from two games.
        c = pick("c", "g2", 0.62, backers=[cap("Cara")])
        d = bd.select_double([a, b, c])
        self.assertIsNotNone(d)
        games = {leg["gameId"] for leg in d["legs"]}
        self.assertEqual(len(games), 2)
        self.assertIn("g2", games)
        self.assertIn("g1", games)

    def test_90c_favorite_is_skipped(self):
        short = pick("s", "g1", 0.90, backers=[cap("Ann")])
        ok = pick("o", "g2", 0.68, backers=[cap("Bob")])
        other = pick("t", "g3", 0.64, backers=[cap("Cara")])
        self.assertEqual(bd.why_skip(short), "short_favorite")
        d = bd.select_double([short, ok, other])
        ids = [leg["id"] for leg in d["legs"]]
        self.assertNotIn("s", ids)
        self.assertEqual(set(ids), {"o", "t"})
        # 91¢ also skipped; 89¢ still allowed (may pick up a 'short favorite' against-reason).
        self.assertEqual(bd.why_skip(pick("x", "g", 0.91, backers=[cap()])), "short_favorite")
        self.assertIsNone(bd.why_skip(pick("y", "g", 0.89, entry=0.88, backers=[cap()])))

    def test_down_capper_is_skipped(self):
        down_month = pick("d1", "g1", 0.68, backers=[cap("Down", month=-200, year=5000)])
        down_year = pick("d2", "g2", 0.66, backers=[cap("DownY", month=800, year=-100)])
        ok1 = pick("o1", "g3", 0.64, backers=[cap("Up1")])
        ok2 = pick("o2", "g4", 0.70, backers=[cap("Up2")])
        self.assertEqual(bd.why_skip(down_month), "no_qualifying_capper")
        self.assertEqual(bd.why_skip(down_year), "no_qualifying_capper")
        d = bd.select_double([down_month, down_year, ok1, ok2])
        ids = [leg["id"] for leg in d["legs"]]
        self.assertEqual(set(ids), {"o1", "o2"})

    def test_fun_size_is_skipped(self):
        fun = pick("f", "g1", 0.68, backers=[cap("Tiny", tag="fun"), cap("Also", tag="fun")])
        ok1 = pick("o1", "g2", 0.64, backers=[cap("Up1")])
        ok2 = pick("o2", "g3", 0.70, backers=[cap("Up2")])
        self.assertEqual(bd.why_skip(fun), "fun_size")
        d = bd.select_double([fun, ok1, ok2])
        ids = [leg["id"] for leg in d["legs"]]
        self.assertNotIn("f", ids)
        self.assertEqual(set(ids), {"o1", "o2"})


class TestOtherGates(unittest.TestCase):
    def test_longshot_and_stale_and_opp(self):
        self.assertEqual(bd.why_skip(pick("l", "g", 0.35, backers=[cap()])), "longshot")
        self.assertEqual(bd.why_skip(pick("s", "g", 0.68, entry=0.60, backers=[cap()])), "stale")  # +8¢
        self.assertEqual(bd.why_skip(pick("o", "g", 0.68, own=5, opp=9, backers=[cap()])), "opp_stronger")
        self.assertIsNone(bd.why_skip(pick("ok", "g", 0.68, entry=0.66, own=10, opp=2, backers=[cap()])))

    def test_several_cappers_can_qualify_without_high_conf(self):
        p = pick("m", "g", 0.68, backers=[
            cap("Ann", tag="normal"),
            cap("Bob", tag="normal"),
        ])
        self.assertIsNone(bd.why_skip(p))
        self.assertEqual(len(bd.qualifying_backers(p)), 2)

    def test_single_normal_size_does_not_qualify(self):
        p = pick("n", "g", 0.68, backers=[cap("Ann", tag="normal")])
        self.assertEqual(bd.why_skip(p), "no_qualifying_capper")

    def test_no_double_when_only_one_game_qualifies(self):
        self.assertIsNone(bd.select_double([pick("a", "g1", 0.68, backers=[cap()])]))
        self.assertIsNone(bd.select_double([]))

    def test_payout_and_win_chance_on_ten(self):
        # 70¢ × 70¢ → 49% win chance, $10 / 0.49 ≈ $20.41 back.
        a = pick("a", "g1", 0.70, backers=[cap("Ann")])
        b = pick("b", "g2", 0.70, backers=[cap("Bob")])
        d = bd.select_double([a, b])
        self.assertEqual(d["stake"], 10)
        self.assertEqual(d["winChance"], 49.0)
        self.assertEqual(d["payout"], 20.41)
        self.assertIn("Both legs must win", d["note"])
        self.assertIn("half the time", d["note"])
        self.assertTrue(d["legs"][0]["reasonsFor"])
        self.assertTrue(isinstance(d["legs"][0]["reasonsAgainst"], list))


if __name__ == "__main__":
    unittest.main()
