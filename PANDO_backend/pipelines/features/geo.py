# Rough Dubai bounding box, used only to build a stable normalization range for lat/lon
# (not for validation — the schema already validates lat/lon are real coordinates).
DUBAI_LAT_RANGE = (24.7, 25.4)
DUBAI_LON_RANGE = (54.9, 55.6)


def _min_max_scale(value: float, low: float, high: float) -> float:
    if high == low:
        return 0.5
    return max(0.0, min(1.0, (value - low) / (high - low)))


def encode_geo(latitude: float | None, longitude: float | None) -> dict[str, float]:
    """Numeric geo features: raw coordinates plus a Dubai-relative min-max scaled position.
    Missing coordinates get the range midpoint (0.5) and a `geo_known` flag of 0."""
    known = latitude is not None and longitude is not None

    return {
        "latitude": float(latitude) if latitude is not None else 0.0,
        "longitude": float(longitude) if longitude is not None else 0.0,
        "geo_lat_scaled": _min_max_scale(latitude, *DUBAI_LAT_RANGE) if known else 0.5,
        "geo_lon_scaled": _min_max_scale(longitude, *DUBAI_LON_RANGE) if known else 0.5,
        "geo_known": int(known),
    }
