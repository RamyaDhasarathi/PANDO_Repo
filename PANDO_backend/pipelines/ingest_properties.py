import argparse
import json
import sys

from pydantic import ValidationError

from api.db import get_db
from pipelines.cleaning.duplicates import find_duplicates
from pipelines.cleaning.pipeline import clean_property_record
from pipelines.schemas.property_schema import Property

COLLECTION_NAME = "hi_pando_properties"


def load_records(path: str) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        data = [data]
    return data


def ingest(path: str, skip_cleaning: bool = False) -> None:
    raw_records = load_records(path)
    records = raw_records if skip_cleaning else [clean_property_record(r) for r in raw_records]

    duplicate_matches = find_duplicates(records)
    if duplicate_matches:
        print(f"Warning: {len(duplicate_matches)} duplicate pair(s) detected in input file:")
        for match in duplicate_matches:
            id_a = records[match.index_a].get("property_id", f"index {match.index_a}")
            id_b = records[match.index_b].get("property_id", f"index {match.index_b}")
            print(f"  - {id_a} <-> {id_b} ({match.reason})")

    db = get_db()
    collection = db[COLLECTION_NAME]

    inserted = 0
    updated = 0
    failed = 0

    for i, record in enumerate(records):
        try:
            prop = Property.model_validate(record)
        except ValidationError as e:
            failed += 1
            print(f"[{i}] Validation failed for property_id={record.get('property_id', '?')}:")
            print(e)
            continue

        doc = prop.model_dump(mode="json")
        result = collection.replace_one(
            {"property_id": doc["property_id"]}, doc, upsert=True
        )
        if result.upserted_id is not None:
            inserted += 1
        else:
            updated += 1

    print(f"Ingestion complete: {inserted} inserted, {updated} updated, {failed} failed.")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Manual entry point: ingest property records from a JSON file into MongoDB."
    )
    parser.add_argument("path", help="Path to a JSON file containing one record or a list of records.")
    parser.add_argument(
        "--skip-cleaning",
        action="store_true",
        help="Skip the Phase 1.2 cleaning pipeline and validate raw records as-is.",
    )
    args = parser.parse_args()
    ingest(args.path, skip_cleaning=args.skip_cleaning)
