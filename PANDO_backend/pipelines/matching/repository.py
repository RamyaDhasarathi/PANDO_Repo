from api.db import get_db
from pipelines.matching.property_category import is_residential
from pipelines.schemas.property_schema import Property

COLLECTION_NAME = "hi_pando_properties"


def load_all_properties(residential_only: bool = True) -> list[Property]:
    """Loads properties from hi_pando_properties. Hi Pando is residential-only for now (per
    user decision) — commercial properties (Office, Retail, Warehouse, and any other
    non-residential label) are excluded by default before they ever reach matching."""
    db = get_db()
    docs = db[COLLECTION_NAME].find({}, {"_id": 0})
    properties = [Property.model_validate(doc) for doc in docs]

    if residential_only:
        properties = [p for p in properties if is_residential(p.property_type)]

    return properties
