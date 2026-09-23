import argparse
import json

from api.db import get_db
from pipelines.features.pipeline import engineer_features_for_dataset
from pipelines.features.scaling import save_scalers

FEATURES_COLLECTION_NAME = "hi_pando_property_features"
DEFAULT_SCALERS_PATH = "models/property_feature_scalers.json"


def run(scalers_path: str = DEFAULT_SCALERS_PATH) -> None:
    db = get_db()
    records = list(db["hi_pando_properties"].find({}, {"_id": 0}))

    if not records:
        print("No property records found in hi_pando_properties — nothing to engineer.")
        return

    feature_rows, scalers = engineer_features_for_dataset(records)

    save_scalers(scalers, scalers_path)
    print(f"Saved fitted scalers to {scalers_path}")

    features_collection = db[FEATURES_COLLECTION_NAME]
    for row in feature_rows:
        features_collection.replace_one(
            {"property_id": row["property_id"]}, row, upsert=True
        )

    print(
        f"Engineered features for {len(feature_rows)} properties, "
        f"written to '{FEATURES_COLLECTION_NAME}'."
    )
    print(f"Feature count per row: {len(feature_rows[0])}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run the property feature-engineering pipeline against hi_pando_properties."
    )
    parser.add_argument(
        "--scalers-path",
        default=DEFAULT_SCALERS_PATH,
        help=f"Where to persist fitted scalers (default: {DEFAULT_SCALERS_PATH})",
    )
    args = parser.parse_args()
    run(scalers_path=args.scalers_path)
