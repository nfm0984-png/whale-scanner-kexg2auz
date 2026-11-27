#!/usr/bin/env python3
"""t1122: pinned sports cappers, Top 100 log, Golden 36h + Short Price."""
import os, sys, tempfile, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import top_cappers as tc
import wallet_flags as wf
import capper_history as ch
import coming_up as cu
import proven as pv


class TestPinnedAndTop100(unittest.TestCase):
    def test_pinned_wallets_include_both_examples(self):
        pins = set(tc.pinned_wallets())
        self.assertIn(tc.PINNED_GMPM2, pins)
        self.assertIn(tc.PINNED_AX2026, pins)
        rows = { (r.get("name") or "").lower(): r for r in tc.pinned_rows() }
        self.assertIn("gmpm2", rows)
        self.assertEqual(rows["gmpm2"]["wallet"].lower(), tc.PINNED_GMPM2)
        self.assertIn("ax2026", rows)
        self.assertEqual(rows["ax2026"]["wallet"].lower(), tc.PINNED_AX2026)

    def test_top100_builds_with_pinned_and_filters_mm(self):
        hist = {"cappers": [
            {"wallet": "0x1111111111111111111111111111111111111111", "name": "mmbot", "cw": 80, "cl": 20, "cn": 100, "croi": 25, "cprofit": 50000, "mm": True, "proven": True},
            {"wallet": "0x2222222222222222222222222222222222222222", "name": "jackpot", "cw": 5, "cl": 1, "cn": 6, "croi": 80, "cprofit": 8000, "oneOff": True},
            {"wallet": "0x3333333333333333333333333333333333333333", "name": "veteran", "cw": 60, "cl": 40, "cn": 100, "croi": 18, "cprofit": 40000, "proven": True, "badge": "Hot", "sports": {"NBA": {"n": 80, "roi": 22, "w": 50, "l": 30}}},
            {"wallet": tc.PINNED_GMPM2, "name": "gmpm2", "cw": 107, "cl": 78, "cn": 185, "croi": 13.7, "cprofit": 858113, "proven": True, "badge": "Hot"},
            {"wallet": tc.PINNED_AX2026, "name": "ax2026", "cw": 78, "cl": 57, "cn": 135, "croi": 21.2, "cprofit": 210401, "proven": True, "badge": "Hot"},
        ]}
        prev = os.environ.get("X")
        # write to the real path via build; it will persist. Use build and check payload in memory.
        import tempfile
        fd, path = tempfile.mkstemp(suffix=".json")
        os.close(fd)
        old = tc.PATH
        tc.PATH = path
        try:
            store = tc.load_store()
            payload = tc.build(hist, orca_lenses={"proven": [tc.PINNED_AX2026], "smart": [tc.PINNED_GMPM2], "copyable": []}, proven={"elite": []}, now=1795765689, store=store, log=lambda *a, **k: None)
        finally:
            tc.PATH = old
            try:
                os.remove(path)
            except OSError:
                pass
        names = [c["name"] for c in payload["cappers"]]
        wallets = [c["wallet"] for c in payload["cappers"]]
        self.assertIn("gmpm2", names)
        self.assertIn("ax2026", names)
        self.assertIn(tc.PINNED_GMPM2, wallets)
        self.assertIn(tc.PINNED_AX2026, wallets)
        self.assertNotIn("mmbot", names)
        self.assertNotIn("jackpot", names)
        self.assertIn("veteran", names)
        self.assertLessEqual(payload["count"], 100)
        self.assertGreaterEqual(payload["count"], 3)
        # pinned have tags
        by = {c["name"]: c for c in payload["cappers"]}
        self.assertIn("Pinned", by["gmpm2"]["tags"])
        self.assertTrue(by["gmpm2"].get("profile", "").endswith("gmpm2") or "polymarket.com" in (by["gmpm2"].get("profile") or ""))
        self.assertTrue((by["ax2026"].get("orca") or "").endswith(tc.PINNED_AX2026))


class TestFlagsAndAge(unittest.TestCase):
    def test_gmpm2_style_rebate_is_not_mm(self):
        # $105k rebate on $132M volume is 0.08% — directional sports book, not an LP.
        why = wf.mm_why({"tradeCount": 75651, "markets": 845, "makerRebate": 105043, "feesRefunded": 0, "volume": 132386045})
        self.assertIsNone(why)

    def test_real_mm_rebate_share_still_flags(self):
        why = wf.mm_why({"tradeCount": 20000, "markets": 500, "makerRebate": 80000, "feesRefunded": 0, "volume": 1_000_000})
        self.assertIsNotNone(why)
        self.assertIn("maker rebate", why)

    def test_trade_count_mm_still_flags(self):
        why = wf.mm_why({"tradeCount": 200000, "markets": 200, "makerRebate": 0, "feesRefunded": 0, "volume": 10})
        self.assertIsNotNone(why)

    def test_veteran_one_off_not_flagged_at_50pct(self):
        why = wf.oneoff_why({"pnl": 3_093_936, "biggestWin": 1_386_791, "markets": 848})
        self.assertIsNone(why)

    def test_thin_one_off_still_flagged(self):
        why = wf.oneoff_why({"pnl": 10000, "biggestWin": 6000, "markets": 8})
        self.assertIsNotNone(why)
        self.assertIn("60%", why)

    def test_ax2026_age_waived_with_established_book(self):
        now = 1795765689
        first = now - 29.6 * 86400
        c = {
            "firstTs": first, "n": 135, "roi": 21.2,
            "f14": {"n": 20, "roi": 15}, "win": {"year": {"pnl": 200000}},
            "kShare": 0.84, "avgEntry": 0.52, "mm": False, "oneOff": False,
            "big": {"n": 135, "roi": 21.2, "profit": 210401, "w": 78, "l": 57},
        }
        why = ch.eligibility(c, now=now)
        self.assertNotIn("account younger than 60 days", why)
        self.assertFalse(ch.recent_streak(c, now=now))

    def test_young_thin_account_still_blocked(self):
        now = 1795765689
        c = {
            "firstTs": now - 10 * 86400, "n": 8, "roi": 40,
            "f14": {"n": 8, "roi": 20}, "win": {"year": {"pnl": 2000}, "month": {"pnl": 1800}, "all": {"pnl": 2000}},
            "kShare": 0.9, "avgEntry": 0.5, "mm": False, "oneOff": False,
            "big": {"n": 8, "roi": 40, "profit": 2000, "w": 6, "l": 2},
        }
        why = ch.eligibility(c, now=now)
        self.assertTrue(any("younger than 60 days" in x or "under 30" in x or "recent-streak" in x or "profit under" in x for x in why))


class TestShortPriceAndGolden(unittest.TestCase):
    def test_short_price_keeps_87c_and_flags(self):
        side = {"kPrice": 0.87}
        self.assertTrue(cu.pick_payout_ok(side))
        self.assertTrue(cu.is_short_price(side))
        self.assertTrue(cu.pick_payout_ok({"kPrice": 0.70}))
        self.assertFalse(cu.is_short_price({"kPrice": 0.70}))
        self.assertFalse(cu.pick_payout_ok({"kPrice": 0.95}))  # 1.05x, under 1.10

    def test_window_row_converter_and_cross_sport_ok(self):
        pick = pv._window_row_to_pick({
            "wallet": tc.PINNED_AX2026, "cid": "0xabc", "side": "yes",
            "q": "Will Levante UD win?", "slug": "laliga-lev-rc-2026-11-27",
            "league": "LAL", "label": "Levante UD", "avg": 0.47, "now": 0.50,
            "cost": 2707, "startTs": 1795809600, "kalshi": {"status": "ok", "price": 0.50, "ticker": "KXLALIGAGAME-X", "action": "BUY YES"},
        })
        self.assertEqual(pick["pid"], "0xabc:yes")
        self.assertEqual(pick["cost"], 2707)
        self.assertIn(pick.get("src"), ("window", None, ""))

    def test_golden_targets_include_pinned_and_proven(self):
        caps = [
            {"wallet": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "name": "elite1", "proven": False},
            {"wallet": tc.PINNED_AX2026, "name": "ax2026", "proven": True, "pinned": False},
            {"wallet": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", "name": "cool", "badge": "Cooling", "proven": True},
        ]
        got = pv._golden_targets(caps, elite_ok={"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}, pinned=[tc.PINNED_AX2026])
        self.assertIn("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", got)
        self.assertIn(tc.PINNED_AX2026, got)
        self.assertNotIn("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", got)


if __name__ == "__main__":
    unittest.main()
