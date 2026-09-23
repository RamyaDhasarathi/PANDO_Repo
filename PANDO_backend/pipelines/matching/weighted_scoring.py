import json
from pathlib import Path

from pipelines.matching.scorers import ALL_SCORERS, score_all
from pipelines.schemas.property_schema import Property
from pipelines.schemas.user_dna_schema import UserDNA

DEFAULT_WEIGHTS_PATH = Path(__file__).resolve().parents[2] / "config" / "recommendation_weights.json"

_WEIGHT_SUM_TOLERANCE = 1e-6


def load_weights(path: str | Path = DEFAULT_WEIGHTS_PATH) -> dict[str, float]:
    with open(path, encoding="utf-8") as f:
        weights = json.load(f)

    missing = set(ALL_SCORERS) - set(weights)
    extra = set(weights) - set(ALL_SCORERS)
    if missing:
        raise ValueError(f"Weights config is missing match types: {sorted(missing)}")
    if extra:
        raise ValueError(f"Weights config has unknown match types: {sorted(extra)}")

    total = sum(weights.values())
    if abs(total - 1.0) > _WEIGHT_SUM_TOLERANCE:
        raise ValueError(f"Weights must sum to 1.0, got {total}")

    return weights


def compute_recommendation_score(
    user_dna: UserDNA, property_: Property, weights: dict[str, float]
) -> tuple[float, dict[str, float]]:
    """Returns (weighted_total_score, individual_match_scores) so callers can both rank by the
    total and generate explanations (Phase 2.6) from the component breakdown."""
    match_scores = score_all(user_dna, property_)
    total = sum(match_scores[name] * weight for name, weight in weights.items())
    return total, match_scores
