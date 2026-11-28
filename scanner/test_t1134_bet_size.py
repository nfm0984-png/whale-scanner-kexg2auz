#!/usr/bin/env python3
"""t1134: odds-bucketed bet-size confidence labels."""
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import bet_size as bs


def past(n, cost=100, avg=0.70, prefix="p"):
    return [{"id": "%s%d" % (prefix, i), "cost": cost, "avg": avg} for i in range(n)]


class TestBuckets(unittest.TestCase):
    def test_longshot_mid_favorite_heavy(self):
        self.assertEqual(bs.odds_bucket(0.20), "longshot")
        self.assertEqual(bs.odds_bucket(0.349), "longshot")
        self.assertEqual(bs.odds_bucket(0.35), "mid")
        self.assertEqual(bs.odds_bucket(0.649), "mid")
        self.assertEqual(bs.odds_bucket(0.65), "favorite")
        self.assertEqual(bs.odds_bucket(0.849), "favorite")
        self.assertEqual(bs.odds_bucket(0.85), "heavy")
        self.assertEqual(bs.odds_bucket(0.99), "heavy")
        self.assertEqual(bs.odds_bucket(1.0), "heavy")

    def test_invalid_odds_have_no_bucket(self):
        self.assertIsNone(bs.odds_bucket(None))
        self.assertIsNone(bs.odds_bucket(0))
        self.assertIsNone(bs.odds_bucket(0.009))
        self.assertIsNone(bs.odds_bucket(1.01))
        self.assertIsNone(bs.odds_bucket("nope"))


class TestThresholds(unittest.TestCase):
    def test_exactly_3x_is_high(self):
        info = bs.compare_bet(300, 0.70, past(8, 100, 0.70))
        self.assertEqual(info["tag"], "high")
        self.assertEqual(info["mult"], 3.0)
        self.assertEqual(info["via"], "similar")
        self.assertTrue(info["label"].startswith("🔥 High confidence"))
        self.assertIn("3.0x their usual bet", info["label"])
        self.assertIn("$100 at similar odds", info["label"])

    def test_just_under_3x_is_normal(self):
        # 2.8x stays Normal. Tag uses the raw ratio (3x or more), not the rounded display.
        info = bs.compare_bet(280, 0.70, past(8, 100, 0.70))
        self.assertEqual(info["tag"], "normal")
        self.assertEqual(info["mult"], 2.8)
        self.assertTrue(info["label"].startswith("👍 Normal size"))

    def test_exactly_half_is_fun(self):
        info = bs.compare_bet(50, 0.70, past(8, 100, 0.70))
        self.assertEqual(info["tag"], "fun")
        self.assertEqual(info["mult"], 0.5)
        self.assertTrue(info["label"].startswith("🎈 Fun bet"))
        self.assertIn("0.5x their usual bet", info["label"])

    def test_just_over_half_is_normal(self):
        info = bs.compare_bet(51, 0.70, past(8, 100, 0.70))
        self.assertEqual(info["tag"], "normal")
        self.assertEqual(info["mult"], 0.5)  # 0.51 rounds to 0.5
        info = bs.compare_bet(60, 0.70, past(8, 100, 0.70))
        self.assertEqual(info["tag"], "normal")
        self.assertEqual(info["mult"], 0.6)

    def test_seven_past_bets_is_thin_even_if_huge(self):
        info = bs.compare_bet(10000, 0.70, past(7, 100, 0.70))
        self.assertEqual(info["tag"], "thin")
        self.assertIsNone(info["mult"])
        self.assertEqual(info["label"], "❔ Not enough history yet (7 past bets)")

    def test_zero_history(self):
        info = bs.compare_bet(500, 0.70, [])
        self.assertEqual(info["tag"], "thin")
        self.assertEqual(info["label"], "❔ Not enough history yet (0 past bets)")

    def test_singular_past_bet_word(self):
        info = bs.compare_bet(500, 0.70, past(1, 100, 0.70))
        self.assertEqual(info["label"], "❔ Not enough history yet (1 past bet)")


class TestBucketFallback(unittest.TestCase):
    def test_similar_odds_when_bucket_has_eight(self):
        rows = past(8, 80, 0.25, "L") + past(8, 200, 0.70, "F")
        info = bs.compare_bet(400, 0.22, rows)
        self.assertEqual(info["via"], "similar")
        self.assertEqual(info["usual"], 80)
        self.assertEqual(info["n"], 8)
        self.assertEqual(info["tag"], "high")
        self.assertIn("at similar odds", info["label"])

    def test_falls_back_to_all_odds_when_bucket_is_thin(self):
        rows = past(3, 80, 0.25, "L") + past(8, 200, 0.70, "F")
        info = bs.compare_bet(100, 0.22, rows)
        self.assertEqual(info["via"], "all")
        self.assertEqual(info["n"], 11)
        # median of 3x80 + 8x200 = 200
        self.assertEqual(info["usual"], 200)
        self.assertEqual(info["tag"], "fun")
        self.assertIn("across all odds", info["label"])

    def test_no_entry_price_uses_all_odds(self):
        info = bs.compare_bet(300, None, past(8, 100, 0.70))
        self.assertEqual(info["tag"], "high")
        self.assertEqual(info["via"], "all")
        self.assertIn("across all odds", info["label"])


class TestPercentileAndExclude(unittest.TestCase):
    def test_percentile_example_13_of_17(self):
        # 13 smaller than 500, 4 larger → 13/17 ≈ 76%
        rows = [{"id": "s%d" % i, "cost": 10, "avg": 0.60} for i in range(13)]
        rows += [{"id": "b%d" % i, "cost": 900, "avg": 0.60} for i in range(4)]
        info = bs.compare_bet(500, 0.60, rows)
        self.assertEqual(info["n"], 17)
        self.assertEqual(info["pct"], 76)
        self.assertIn("bigger than 76% of 17 past bets", info["label"])

    def test_excludes_the_current_pick(self):
        rows = past(8, 100, 0.70) + [{"id": "current", "cost": 10000, "avg": 0.70}]
        info = bs.compare_bet(100, 0.70, rows, exclude_id="current")
        self.assertEqual(info["n"], 8)
        self.assertEqual(info["usual"], 100)
        self.assertEqual(info["tag"], "normal")

    def test_full_high_confidence_line(self):
        # Usual $69, current 5x, bigger than 76% of 17 similar-odds bets.
        rows = [{"id": "s%d" % i, "cost": 20, "avg": 0.40} for i in range(13)]
        rows += [{"id": "b%d" % i, "cost": 80, "avg": 0.40} for i in range(4)]
        # median of 13x20 + 4x80: sorted, mid is index 8 → 20. Need usual $69.
        # Build 17 bets whose median is 69.
        lows = [{"id": "s%d" % i, "cost": 50, "avg": 0.40} for i in range(8)]
        highs = [{"id": "b%d" % i, "cost": 90, "avg": 0.40} for i in range(8)]
        mid = [{"id": "m", "cost": 69, "avg": 0.40}]
        # current 5.0x of 69 = 345. Bigger than the 8 lows + mid = 9/17 ≈ 53%.
        # For 76%, need 13 smaller. So 13 at < 345 and 4 at >= 345.
        rows = [{"id": "s%d" % i, "cost": 50, "avg": 0.40} for i in range(13)]
        rows += [{"id": "b%d" % i, "cost": 400, "avg": 0.40} for i in range(4)]
        # median of 13x50 + 4x400: sorted[8] = 50. Want $69.
        # Use 8x50 + 1x69 + 8x80 → median 69. And 13 smaller than 345:
        # 8x50 + 69 + some of the 80s that are < 345 (all 8 are) = 17 smaller.
        # Need 4 larger than 345: set 4 of the highs to 400, and fill so median is 69
        # and 13 are < 345.
        rows = (
            [{"id": "s%d" % i, "cost": 50, "avg": 0.40} for i in range(8)]
            + [{"id": "m", "cost": 69, "avg": 0.40}]
            + [{"id": "u%d" % i, "cost": 80, "avg": 0.40} for i in range(4)]
            + [{"id": "b%d" % i, "cost": 400, "avg": 0.40} for i in range(4)]
        )
        # 17 bets, median = sorted[8] = 69. 8+1+4=13 smaller than 345. Yes.
        info = bs.compare_bet(345, 0.40, rows)
        self.assertEqual(info["tag"], "high")
        self.assertEqual(info["usual"], 69)
        self.assertEqual(info["mult"], 5.0)
        self.assertEqual(info["pct"], 76)
        self.assertEqual(
            info["label"],
            "🔥 High confidence · 5.0x their usual bet ($69 at similar odds) · bigger than 76% of 17 past bets",
        )


class TestCardTags(unittest.TestCase):
    def test_any_high_is_big(self):
        backers = [
            {"size": {"tag": "high"}},
            {"size": {"tag": "fun"}},
        ]
        self.assertEqual(bs.pick_size_tag(backers), "big")

    def test_all_fun_is_fun_size(self):
        backers = [{"size": {"tag": "fun"}}, {"size": {"tag": "fun"}}]
        self.assertEqual(bs.pick_size_tag(backers), "fun")

    def test_mixed_fun_and_normal_has_no_card_tag(self):
        backers = [{"size": {"tag": "fun"}}, {"size": {"tag": "normal"}}]
        self.assertIsNone(bs.pick_size_tag(backers))

    def test_fun_plus_thin_is_not_fun_size(self):
        backers = [{"size": {"tag": "fun"}}, {"size": {"tag": "thin"}}]
        self.assertIsNone(bs.pick_size_tag(backers))

    def test_empty_is_none(self):
        self.assertIsNone(bs.pick_size_tag([]))
        self.assertIsNone(bs.pick_size_tag(None))


class TestRealCappers(unittest.TestCase):
    """Run the scorer on real scanner history (skip if the file is not present)."""

    @classmethod
    def setUpClass(cls):
        path = os.path.join(HERE, "capper_history.json")
        cls.hist = bs.defaultdict(list)
        if os.path.exists(path):
            bs.ingest_capper_history_file(cls.hist, path)
        cls.available = sum(1 for rows in cls.hist.values() if len(rows) >= 8)

    def test_history_file_has_established_cappers(self):
        if not self.hist:
            self.skipTest("capper_history.json not present")
        self.assertGreaterEqual(self.available, 10)

    def test_labels_on_current_coming_up_backers(self):
        # Uses already-fetched history only; does not decrypt or print data.json.
        if self.available < 1:
            self.skipTest("not enough history")
        # Pick a wallet with 8+ bets and score a synthetic current bet at its median.
        wallet, rows = next((w, r) for w, r in self.hist.items() if len(r) >= 8 and any(x.get("avg") for x in r))
        mid = rows[len(rows) // 2]
        info = bs.compare_bet(mid["cost"], mid.get("avg") or 0.5, rows, exclude_id=mid.get("id"))
        self.assertIn(info["tag"], ("high", "normal", "fun", "thin"))
        self.assertTrue(info["label"])
        if info["tag"] != "thin":
            self.assertIn("x their usual bet", info["label"])
        # And a 5x ticket against the same book should read High (if the bucket holds).
        usual_src = [r for r in rows if r.get("avg") and bs.odds_bucket(r["avg"]) == bs.odds_bucket(mid.get("avg") or 0.5)]
        use = usual_src if len(usual_src) >= 8 else rows
        usual = bs._median([r["cost"] for r in use])
        big = bs.compare_bet(usual * 5, mid.get("avg") or 0.5, rows, exclude_id=mid.get("id"))
        self.assertEqual(big["tag"], "high")
        self.assertTrue(big["label"].startswith("🔥 High confidence"))


if __name__ == "__main__":
    unittest.main()
