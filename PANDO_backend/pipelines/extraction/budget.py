import re
from typing import Optional

from pipelines.cleaning.price import normalize_price
from pipelines.schemas.user_dna_schema import Budget

# Matches one money-like phrase: optional currency word/symbol, a number (with optional
# commas/decimals), optional magnitude word (million/m/k/thousand). Reused as the unit the
# range-detector below composes into "under X" / "X to Y" / "around X" phrases.
_MONEY_TOKEN = r"(?:aed|dhs?|usd|\$|€|£)?\s?[\d,]+(?:\.\d+)?\s?(?:million|mn|thousand|m|k)?"

_RANGE_PATTERN = re.compile(
    rf"(?P<low>{_MONEY_TOKEN})\s*(?:-|to|and)\s*(?P<high>{_MONEY_TOKEN})", re.IGNORECASE
)
_UNDER_PATTERN = re.compile(
    rf"(?:under|below|less than|up to|max(?:imum)?(?: of)?|within)\s*(?P<amount>{_MONEY_TOKEN})",
    re.IGNORECASE,
)
_OVER_PATTERN = re.compile(
    rf"(?:over|above|more than|at least|min(?:imum)?(?: of)?|starting (?:at|from))\s*(?P<amount>{_MONEY_TOKEN})",
    re.IGNORECASE,
)
_AROUND_PATTERN = re.compile(
    rf"(?:around|about|approximately|roughly|~|budget(?: of| is)?)\s*(?P<amount>{_MONEY_TOKEN})",
    re.IGNORECASE,
)
_BARE_MONEY_PATTERN = re.compile(
    rf"(?P<amount>{_MONEY_TOKEN})", re.IGNORECASE
)

# A bare number is only treated as money if it's large enough to plausibly be a price
# (in AED) or carries a magnitude/currency marker — otherwise "2 bedroom" would match "2".
_MIN_PLAUSIBLE_BARE_AMOUNT = 10_000


def _looks_like_money(token: str) -> bool:
    return bool(re.search(r"million|mn|thousand|\bm\b|\bk\b|aed|dhs?|usd|\$|€|£", token, re.IGNORECASE))


def extract_budget(text: str) -> Optional[Budget]:
    """Extract a Budget (min/max) from free-form text. Returns None if no money-like phrase
    is found. A single bare figure is treated as the max (e.g. "around 1.5M" -> max only);
    an explicit range or "under X"/"over X" phrase sets min and/or max accordingly."""
    if not text:
        return None

    range_match = _RANGE_PATTERN.search(text)
    if range_match:
        low = normalize_price(range_match.group("low"))
        high = normalize_price(range_match.group("high"))
        if low is not None and high is not None:
            return Budget(min=min(low, high), max=max(low, high))

    under_match = _UNDER_PATTERN.search(text)
    over_match = _OVER_PATTERN.search(text)
    if under_match or over_match:
        max_val = normalize_price(under_match.group("amount")) if under_match else None
        min_val = normalize_price(over_match.group("amount")) if over_match else None
        if max_val is not None or min_val is not None:
            return Budget(min=min_val, max=max_val)

    around_match = _AROUND_PATTERN.search(text)
    if around_match:
        amount = normalize_price(around_match.group("amount"))
        if amount is not None:
            return Budget(max=amount)

    for match in _BARE_MONEY_PATTERN.finditer(text):
        token = match.group("amount")
        digits = re.sub(r"[^0-9.]", "", token)
        if not digits:
            continue
        if _looks_like_money(token) or float(digits) >= _MIN_PLAUSIBLE_BARE_AMOUNT:
            amount = normalize_price(token)
            if amount is not None and amount >= _MIN_PLAUSIBLE_BARE_AMOUNT:
                return Budget(max=amount)

    return None
