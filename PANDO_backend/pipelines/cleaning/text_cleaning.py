import re
import unicodedata
from typing import Optional


def clean_text(value: object) -> Optional[str]:
    """Normalize a free-text field: strip, collapse whitespace, normalize unicode, drop empties."""
    if value is None:
        return None
    text = str(value)
    text = unicodedata.normalize("NFKC", text)
    text = text.replace(" ", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text or None


def normalize_key(value: object) -> str:
    """Lowercase, trimmed, whitespace-collapsed form used as a lookup key for canonical maps."""
    text = clean_text(value)
    if text is None:
        return ""
    return re.sub(r"[^a-z0-9]+", " ", text.lower()).strip()
