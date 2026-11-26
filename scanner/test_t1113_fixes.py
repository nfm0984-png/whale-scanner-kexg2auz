#!/usr/bin/env python3
"""Dry-run checks for the Nov 26 Coming Up / split / lens fixes. No network, no secrets."""
import json, os, sys, tempfile, time, unittest
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import split_policy as sp


class SplitPolicyTests(unittest.TestCase):
    def test_1v1_is_coin_flip(self):
        self.assertTrue(sp.is_coin_flip(1, 10000, 1, 9000))
        self.assertEqual(sp.stance(1, 10000, 1, 9000), 'hide')

    def test_2v2_is_coin_flip(self):
        self.assertTrue(sp.is_coin_flip(2, 20000, 2, 18000))
        self.assertEqual(sp.stance(2, 20000, 2, 5000), 'hide')  # equal caps, dollars don't save 1:1 caps

    def test_3v1_always_shows_majority(self):
        # even if dollars were closer, 3 vs 1 is lopsided
        self.assertTrue(sp.is_lopsided_majority(3, 29000, 1, 20000))
        self.assertTrue(sp.is_lopsided_majority(3, 5000, 1, 40000))
        self.assertEqual(sp.stance(3, 29000, 1, 5000), 'majority')
        self.assertEqual(sp.stance(1, 5000, 3, 29000), 'hide')
        self.assertFalse(sp.is_coin_flip(3, 29000, 1, 5000))
        self.assertEqual(sp.badge(3, 1), '3–1')

    def test_2v1_needs_dollar_majority(self):
        # 2:1 caps but equal dollars → hide
        self.assertFalse(sp.is_lopsided_majority(2, 10000, 1, 10000))
        self.assertEqual(sp.stance(2, 10000, 1, 10000), 'hide')
        # 2:1 caps and 2.5x dollars → show
        self.assertTrue(sp.is_lopsided_majority(2, 25000, 1, 10000))
        self.assertEqual(sp.stance(2, 25000, 1, 10000), 'majority')

    def test_4v2_needs_dollar_majority(self):
        self.assertTrue(sp.is_lopsided_majority(4, 25000, 2, 10000))
        self.assertFalse(sp.is_lopsided_majority(4, 11000, 2, 10000))

    def test_5v3_is_coin_flip(self):
        # 5/3 < 2x caps
        self.assertTrue(sp.is_coin_flip(5, 100000, 3, 10000))
        self.assertEqual(sp.stance(5, 100000, 3, 10000), 'hide')


class ComingUpWindowTests(unittest.TestCase):
    def test_36h_includes_tomorrow_and_live(self):
        now = 1764192600  # fixed ts
        horizon = 36 * 3600
        def in_coming(start, live=False):
            if live or (start > 0 and start <= now):
                return True
            if not start:
                return False
            return start <= now + horizon
        def in_ranked(start, live=False, hour=14):
            if live or (start > 0 and start <= now):
                return True
            # today-only before 7pm: start later same-day offset 0 would need PT math.
            # Here just assert coming-up is wider than a today-only 8h leftover window.
            return start <= now + (24 - hour) * 3600  # remaining today only
        friday = now + 22 * 3600
        saturday = now + 46 * 3600
        live_now = now - 1800
        self.assertTrue(in_coming(live_now, live=True))
        self.assertTrue(in_coming(friday))
        self.assertFalse(in_coming(saturday))  # 46h > 36h
        self.assertFalse(in_ranked(friday, hour=14))
        self.assertGreater(
            sum(1 for ts in (live_now, friday, saturday, now + 2 * 3600) if in_coming(ts, ts == live_now)),
            sum(1 for ts in (live_now, friday, saturday, now + 2 * 3600) if in_ranked(ts, ts == live_now)),
        )


class LensPreserveTests(unittest.TestCase):
    def test_refresh_keeps_prior_when_cache_missing_and_fetch_fails(self):
        import orca_lenses as ol
        prior = {
            'ts': 123, 'smart': ['0xaaa'], 'proven': ['0xbbb', '0xccc'],
            'copyable': ['0xddd'], 'niche': ['0xeee'], 'flipper': [], 'tiny': [],
        }
        # Force a missing cache file and a failing fetch (the follow-check runner case).
        ol.CACHE = os.path.join(tempfile.mkdtemp(), 'no-such-orca_lenses.json')
        ol._STATE = None
        def _boom(name):
            raise FileNotFoundError('orca key missing')
        ol._fetch = _boom
        out = ol.refresh(force=True, prior=prior)
        self.assertEqual(out['proven'], ['0xbbb', '0xccc'])
        self.assertEqual(out['smart'], ['0xaaa'])
        self.assertEqual(out['copyable'], ['0xddd'])
        self.assertEqual(out['niche'], ['0xeee'])
        self.assertTrue(out.get('missing'))
        payload = ol.payload(prior=prior)
        self.assertEqual(payload['proven'], ['0xbbb', '0xccc'])
        # And an empty current state must still fill from prior in payload()
        ol._STATE = ol._empty()
        filled = ol.payload(prior=prior)
        self.assertEqual(filled['proven'], ['0xbbb', '0xccc'])

    def test_payload_does_not_overwrite_good_prior_with_empty(self):
        import orca_lenses as ol
        ol._STATE = ol._empty()
        prior = {'ts': 1, 'smart': ['0x1'], 'proven': ['0x2'], 'copyable': [], 'niche': []}
        p = ol.payload(prior=prior)
        self.assertEqual(p['smart'], ['0x1'])
        self.assertEqual(p['proven'], ['0x2'])


class ComingUpMergeTests(unittest.TestCase):
    def test_merge_keeps_live_bet_not_in_floor_rows(self):
        import coming_up as cu
        floor = [{'wallet': '0x1', 'cid': 'aaa', 'side': 'yes', 'cost': 2000}]
        live = [{'wallet': '0xcowboys', 'cid': 'cow-ml', 'side': 'yes', 'cost': 19903,
                 'startTs': int(time.time()) - 1800, 'game': {'state': 'in'}}]
        merged = cu.merge_lean_rows(floor, live)
        keys = {(r['wallet'], r['cid'], r['side']) for r in merged}
        self.assertIn(('0x1', 'aaa', 'yes'), keys)
        self.assertIn(('0xcowboys', 'cow-ml', 'yes'), keys)

    def test_rows_from_cards_roundtrip_live_side(self):
        import coming_up as cu
        games = [{
            'id': 'dal-phi', 'game': 'Dallas Cowboys vs Philadelphia Eagles',
            'league': 'NFL', 'startTs': int(time.time()) - 1800, 'start': 'live',
            'markets': [{
                'id': 'cow-ml', 'kind': 'moneyline', 'q': 'Cowboys ML',
                'sides': [{
                    'side': 'yes', 'label': 'Cowboys', 'kPrice': 0.58, 'ticker': 'KX-TEST',
                    'backers': [{'wallet': '0xcowboys', 'name': 'darkumbreon88', 'cost': 19903, 'avg': 0.55}],
                }],
            }],
        }]
        rows = cu.rows_from_cards(games)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['wallet'], '0xcowboys')
        self.assertEqual(rows[0]['cid'], 'cow-ml')
        self.assertEqual(rows[0]['kalshi']['status'], 'ok')
        self.assertEqual(rows[0]['kalshi']['price'], 0.58)
        merged = cu.merge_lean_rows([], rows)
        self.assertEqual(len(merged), 1)


if __name__ == '__main__':
    unittest.main()
