"""Split visibility for Ranked, Coming Up, and Golden Picks.

Hide true coin-flip / even splits. Show the heavy majority side when the
game is clearly lopsided, so a 3-vs-1 (or 2:1 caps with a clear dollar
majority) is not blanked. Dollar and capper floors elsewhere stay untouched.
"""

# Majority must have at least 2x the backers of the minority, and 2.5x the dollars,
# unless it is a clear 3+ vs 1 capper lean (always shown).
CAP_RATIO = 2
USD_RATIO = 2.5


def is_lopsided_majority(own_n, own_usd, opp_n, opp_usd):
    """True when `own` is the heavy side we should keep visible."""
    try:
        own_n = int(own_n or 0)
        opp_n = int(opp_n or 0)
        own_usd = float(own_usd or 0)
        opp_usd = float(opp_usd or 0)
    except (TypeError, ValueError):
        return False
    if own_n < 1 or opp_n < 1:
        return False
    if own_n >= 3 and opp_n == 1:
        return True
    return own_n >= CAP_RATIO * opp_n and own_usd >= USD_RATIO * opp_usd


def is_coin_flip(a_n, a_usd, b_n, b_usd):
    """True when neither side is a clear lopsided majority (hide both)."""
    return not is_lopsided_majority(a_n, a_usd, b_n, b_usd) and not is_lopsided_majority(b_n, b_usd, a_n, a_usd)


def stance(own_n, own_usd, opp_n, opp_usd):
    """'none' | 'majority' | 'hide' (coin-flip or minority)."""
    if own_n < 1 or opp_n < 1:
        return 'none'
    if is_lopsided_majority(own_n, own_usd, opp_n, opp_usd):
        return 'majority'
    return 'hide'


def badge(own_n, opp_n):
    return '%d–%d' % (int(own_n or 0), int(opp_n or 0))
