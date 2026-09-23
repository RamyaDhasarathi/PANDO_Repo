from pipelines.cleaning.amenities import normalize_amenities
from pipelines.cleaning.area import normalize_area_to_sqft
from pipelines.cleaning.location import normalize_location
from pipelines.cleaning.missing_values import apply_missing_value_defaults
from pipelines.cleaning.price import normalize_price
from pipelines.cleaning.property_type import normalize_property_type
from pipelines.cleaning.text_cleaning import clean_text

_TEXT_FIELDS = ["property_name", "developer", "view", "handover_date"]


def clean_property_record(raw_record: dict) -> dict:
    """
    Apply the full Phase 1.2 cleaning pipeline to one raw property record, returning a
    cleaned dict ready for Property schema validation. Does not raise on bad/unrecognized
    values (e.g. an unknown property type becomes None) — validation is the schema's job.
    """
    record = dict(raw_record)

    for field in _TEXT_FIELDS:
        if field in record:
            record[field] = clean_text(record[field])

    if "property_type" in record:
        record["property_type"] = normalize_property_type(
            record["property_type"]
        ) or clean_text(record["property_type"])

    if "location" in record:
        record["location"] = normalize_location(record["location"]) or clean_text(
            record["location"]
        )

    if "community" in record:
        record["community"] = clean_text(record["community"])

    if "price" in record:
        record["price"] = normalize_price(record["price"])

    if "rent_price" in record:
        record["rent_price"] = normalize_price(record["rent_price"])

    if "built_up_area_sqft" in record:
        record["built_up_area_sqft"] = normalize_area_to_sqft(record["built_up_area_sqft"])

    if "amenities" in record:
        record["amenities"] = normalize_amenities(record["amenities"])

    record = apply_missing_value_defaults(record)

    return record
