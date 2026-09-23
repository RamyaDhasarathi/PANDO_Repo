import re
from typing import Optional

SQM_TO_SQFT = 10.7639


def normalize_area_to_sqft(raw_value: object) -> Optional[float]:
    """Parse a messy area string/number and return normalized built-up area in sqft."""
    if raw_value is None:
        return None
    if isinstance(raw_value, (int, float)):
        return round(float(raw_value), 2)

    text = str(raw_value).strip()
    if not text:
        return None

    lower = text.lower()
    is_sqm = bool(re.search(r"sq\.?\s*m(?:eters?)?\b|sqm|m2|m²", lower))

    unit_stripped = re.sub(r"sq\.?\s*(?:ft|feet|m(?:eters?)?)\b|sqft|sqm|m2|m²", "", lower)
    digits = re.sub(r"[^0-9.]", "", unit_stripped)
    if not digits:
        return None

    try:
        amount = float(digits)
    except ValueError:
        return None

    if is_sqm:
        amount *= SQM_TO_SQFT

    return round(amount, 2)
