from dataclasses import dataclass
from difflib import SequenceMatcher

from pipelines.cleaning.text_cleaning import normalize_key

FUZZY_NAME_THRESHOLD = 0.85
PRICE_TOLERANCE_PCT = 0.02


@dataclass
class DuplicateMatch:
    index_a: int
    index_b: int
    reason: str


def _name_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a, b).ratio()


def _prices_close(price_a: float, price_b: float, tolerance_pct: float = PRICE_TOLERANCE_PCT) -> bool:
    if price_a == 0 and price_b == 0:
        return True
    denom = max(abs(price_a), abs(price_b))
    if denom == 0:
        return True
    return abs(price_a - price_b) / denom <= tolerance_pct


def find_duplicates(records: list[dict]) -> list[DuplicateMatch]:
    """
    Detect duplicate property records by:
    - exact match on property_id
    - fuzzy match on (name similarity >= threshold) AND same normalized location AND close price

    Returns one DuplicateMatch per duplicate pair found (first occurrence kept implicitly by caller).
    """
    matches: list[DuplicateMatch] = []

    seen_ids: dict[str, int] = {}
    for i, record in enumerate(records):
        prop_id = record.get("property_id")
        if prop_id is None:
            continue
        if prop_id in seen_ids:
            matches.append(DuplicateMatch(seen_ids[prop_id], i, "duplicate property_id"))
        else:
            seen_ids[prop_id] = i

    matched_pairs = {(m.index_a, m.index_b) for m in matches}

    for i in range(len(records)):
        for j in range(i + 1, len(records)):
            if (i, j) in matched_pairs:
                continue

            a, b = records[i], records[j]
            name_a = normalize_key(a.get("property_name"))
            name_b = normalize_key(b.get("property_name"))
            loc_a = normalize_key(a.get("location"))
            loc_b = normalize_key(b.get("location"))

            if not name_a or not name_b or not loc_a or not loc_b:
                continue
            if loc_a != loc_b:
                continue

            price_a = a.get("price")
            price_b = b.get("price")
            if price_a is None or price_b is None:
                continue

            try:
                price_a, price_b = float(price_a), float(price_b)
            except (TypeError, ValueError):
                continue

            if _name_similarity(name_a, name_b) >= FUZZY_NAME_THRESHOLD and _prices_close(
                price_a, price_b
            ):
                matches.append(DuplicateMatch(i, j, "fuzzy match: name+location+price"))

    return matches
