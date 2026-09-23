import re
from typing import Optional

# Static rates to AED. Fine for cleaning/dev purposes; not a live FX feed.
_FX_TO_AED = {
    "AED": 1.0,
    "USD": 3.6725,
    "EUR": 4.0,
    "GBP": 4.7,
}

_CURRENCY_SYMBOLS = {
    "$": "USD",
    "€": "EUR",
    "£": "GBP",
    "aed": "AED",
    "dhs": "AED",
    "dh": "AED",
    "usd": "USD",
    "eur": "EUR",
    "gbp": "GBP",
}


def _detect_currency(text: str) -> str:
    lower = text.lower()
    for symbol, code in _CURRENCY_SYMBOLS.items():
        if symbol in lower:
            return code
    return "AED"


def normalize_price(raw_value: object) -> Optional[float]:
    """Parse a messy price string/number and return a normalized AED float, or None if unparseable."""
    if raw_value is None:
        return None
    if isinstance(raw_value, (int, float)):
        return float(raw_value)

    text = str(raw_value).strip()
    if not text:
        return None

    currency = _detect_currency(text)

    multiplier = 1.0
    lower = text.lower()
    if re.search(r"million|\bmn\b|\d\s*m\b", lower):
        multiplier = 1_000_000.0
    elif re.search(r"thousand|\d\s*k\b", lower):
        multiplier = 1_000.0

    digits = re.sub(r"[^0-9.]", "", text)
    if not digits:
        return None

    try:
        amount = float(digits)
    except ValueError:
        return None

    amount *= multiplier
    return round(amount * _FX_TO_AED[currency], 2)
