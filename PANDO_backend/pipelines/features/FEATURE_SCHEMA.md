# Property Feature Schema

Output of `pipelines.features.pipeline.engineer_property_features()`. One flat dict per property,
`property_id` plus 65 numeric/binary features (67 total keys at time of writing; grows if the
canonical property-type/location/amenity lists in `pipelines/cleaning/` grow).

## Identity

| Feature | Type | Source |
|---|---|---|
| `property_id` | string | passthrough, not used as a model input |

## Price & area (fitted min-max scaled, requires `fit_price_area_scalers` on the dataset first)

A property has either a sale `price` or a `rent_price`, never both (see `listing_purpose` in
the Property schema) — annual rent and sale price are different scales and must not be
conflated into one field. Each gets its own independently-fitted scaler and a `_known` flag.

| Feature | Range | Notes |
|---|---|---|
| `price_normalized` | 0.0–1.0 | min-max scaled against the dataset's observed sale-price range; 0.0 if the property has no sale price (e.g. a rent-only listing) |
| `price_known` | 0/1 | 1 if the source record had a sale `price` |
| `rent_price_normalized` | 0.0–1.0 | min-max scaled against the dataset's observed rent-price range; 0.0 if the property has no rent price |
| `rent_price_known` | 0/1 | 1 if the source record had a `rent_price` |
| `built_up_area_sqft_normalized` | 0.0–1.0 | min-max scaled against the dataset's observed area range |

## Numerical

| Feature | Type | Notes |
|---|---|---|
| `bedrooms` | float | raw count, 0.0 if missing |
| `bathrooms` | float | raw count, 0.0 if missing |
| `rental_yield` | float | raw %, 0.0 if missing |
| `rental_yield_known` | 0/1 | 1 if `rental_yield` was present in the source record |

## Geo

| Feature | Type | Notes |
|---|---|---|
| `latitude` | float | raw, 0.0 if missing |
| `longitude` | float | raw, 0.0 if missing |
| `geo_lat_scaled` | 0.0–1.0 | min-max scaled against a fixed Dubai bounding box (not dataset-fitted) |
| `geo_lon_scaled` | 0.0–1.0 | same, longitude |
| `geo_known` | 0/1 | 1 if both lat/lon were present |

## Property type (one-hot, 11 features: 10 canonical + "other")

`property_type_Apartment`, `property_type_Townhouse`, `property_type_Villa`,
`property_type_Penthouse`, `property_type_Duplex`, `property_type_Studio`,
`property_type_Office`, `property_type_Retail`, `property_type_Warehouse`,
`property_type_Land`, `property_type_other`

Canonical list: `pipelines/cleaning/property_type.py::CANONICAL_PROPERTY_TYPES`.

## Location (one-hot, 16 features: 15 canonical + "other")

`location_Dubai Marina`, `location_Jumeirah Village Circle`, `location_Downtown Dubai`,
`location_Palm Jumeirah`, `location_Business Bay`, `location_Jumeirah Lake Towers`,
`location_Arabian Ranches`, `location_Dubai Hills Estate`, `location_Al Barsha`,
`location_Dubai Silicon Oasis`, `location_Dubai Sports City`, `location_Jumeirah Beach Residence`,
`location_Dubai Creek Harbour`, `location_Mirdif`, `location_Dubai South`, `location_other`

Canonical list: `pipelines/cleaning/location.py::CANONICAL_LOCATIONS`.

## Amenities (multi-hot, 15 features)

`amenity_Gym`, `amenity_Pool`, `amenity_Parking`, `amenity_Security`, `amenity_Garden`,
`amenity_Private Beach`, `amenity_Kids Play Area`, `amenity_BBQ Area`, `amenity_Concierge`,
`amenity_Sauna`, `amenity_Steam Room`, `amenity_Tennis Court`, `amenity_Pet Friendly`,
`amenity_Balcony`, `amenity_Maid's Room`

Canonical list: `pipelines/cleaning/amenities.py::CANONICAL_AMENITIES`. Unlike the one-hot
encodings above, there is no "other" bucket — unrecognized amenities are simply not represented
(they're already dropped during Phase 1.2 cleaning).

## Nearby facilities (12 features: 6 distances + 6 known-flags)

| Feature | Notes |
|---|---|
| `metro_distance_km`, `schools_distance_km`, `hospitals_distance_km`, `shopping_distance_km`, `beaches_distance_km`, `business_districts_distance_km` | raw km; **50.0 fallback** if missing (chosen so "unknown" doesn't look like "very close") |
| `<field>_known` (×6) | 0/1, 1 if the source distance was present |

## Notes on missing-value strategy

Every feature with a plausible "unknown" state (`rental_yield`, geo, nearby facilities) pairs its
numeric value with a `_known` binary flag, rather than only defaulting the value — this lets a
downstream model learn to treat "unknown" differently from a genuine low/zero value.

## Persistence

- Fitted price/area scalers: `models/property_feature_scalers.json` (via `pipelines/features/scaling.py::save_scalers`/`load_scalers`)
- Engineered feature rows: MongoDB collection `hi_pando_property_features` (one document per property, keyed by `property_id`)
- Entry point: `python -m pipelines.run_feature_engineering`
