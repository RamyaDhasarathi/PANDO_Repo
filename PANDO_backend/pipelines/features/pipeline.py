from pipelines.features.categorical import encode_amenities, encode_location, encode_property_type
from pipelines.features.geo import encode_geo
from pipelines.features.numerical import (
    encode_bedrooms_bathrooms,
    encode_nearby_facilities,
    encode_rental_yield,
)
from pipelines.features.scaling import MinMaxScaler


def fit_price_area_scalers(records: list[dict]) -> dict[str, MinMaxScaler]:
    """Fit min-max scalers for price, rent_price, and built_up_area_sqft across the given
    (cleaned) dataset. price/rent_price are fit independently since a listing only ever has
    one of the two populated (see listing_purpose) and the two are on different scales
    (sale price vs. annual rent)."""
    prices = [r.get("price") for r in records]
    rent_prices = [r.get("rent_price") for r in records]
    areas = [r.get("built_up_area_sqft") for r in records]

    scalers = {
        "built_up_area_sqft": MinMaxScaler(field_name="built_up_area_sqft").fit(areas),
    }

    if any(p is not None for p in prices):
        scalers["price"] = MinMaxScaler(field_name="price").fit(prices)
    if any(p is not None for p in rent_prices):
        scalers["rent_price"] = MinMaxScaler(field_name="rent_price").fit(rent_prices)

    return scalers


def engineer_property_features(record: dict, scalers: dict[str, MinMaxScaler]) -> dict:
    """
    Convert one cleaned property record (matching the Property schema shape) into a flat dict
    of machine-readable features. `scalers` must be pre-fit (see fit_price_area_scalers) on the
    full dataset so price/area normalization is consistent across all records.
    """
    features: dict = {"property_id": record.get("property_id")}

    price = record.get("price")
    rent_price = record.get("rent_price")
    features["price_normalized"] = scalers["price"].transform(price) if "price" in scalers else 0.0
    features["price_known"] = int(price is not None)
    features["rent_price_normalized"] = (
        scalers["rent_price"].transform(rent_price) if "rent_price" in scalers else 0.0
    )
    features["rent_price_known"] = int(rent_price is not None)
    features["built_up_area_sqft_normalized"] = scalers["built_up_area_sqft"].transform(
        record.get("built_up_area_sqft")
    )

    features.update(encode_bedrooms_bathrooms(record.get("bedrooms"), record.get("bathrooms")))
    features.update(encode_property_type(record.get("property_type")))
    features.update(encode_location(record.get("location")))
    features.update(encode_geo(record.get("latitude"), record.get("longitude")))
    features.update(encode_amenities(record.get("amenities") or []))
    features.update(encode_rental_yield(record.get("rental_yield")))
    features.update(encode_nearby_facilities(record.get("nearby_facilities") or {}))

    return features


def engineer_features_for_dataset(records: list[dict]) -> tuple[list[dict], dict[str, MinMaxScaler]]:
    """Fit scalers on the dataset and engineer features for every record. Returns the feature
    rows plus the fitted scalers, so the same scalers can be persisted and reused at inference time."""
    scalers = fit_price_area_scalers(records)
    feature_rows = [engineer_property_features(r, scalers) for r in records]
    return feature_rows, scalers
