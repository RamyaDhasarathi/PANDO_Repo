import pytest

from pipelines.features.categorical import encode_amenities, encode_location, encode_property_type
from pipelines.features.geo import encode_geo
from pipelines.features.numerical import (
    encode_bedrooms_bathrooms,
    encode_nearby_facilities,
    encode_rental_yield,
)
from pipelines.features.pipeline import (
    engineer_features_for_dataset,
    engineer_property_features,
    fit_price_area_scalers,
)
from pipelines.features.scaling import MinMaxScaler, load_scalers, save_scalers


class TestCategoricalEncoding:
    def test_property_type_one_hot(self):
        encoding = encode_property_type("Apartment")
        assert encoding["property_type_Apartment"] == 1
        assert encoding["property_type_Villa"] == 0
        assert encoding["property_type_other"] == 0
        assert sum(encoding.values()) == 1

    def test_property_type_unrecognized_goes_to_other(self):
        encoding = encode_property_type("Spaceship")
        assert encoding["property_type_other"] == 1
        assert encoding["property_type_Apartment"] == 0

    def test_location_one_hot(self):
        encoding = encode_location("Dubai Marina")
        assert encoding["location_Dubai Marina"] == 1
        assert encoding["location_Jumeirah Village Circle"] == 0
        assert sum(encoding.values()) == 1

    def test_amenities_multi_hot(self):
        encoding = encode_amenities(["Pool", "Gym"])
        assert encoding["amenity_Pool"] == 1
        assert encoding["amenity_Gym"] == 1
        assert encoding["amenity_Garden"] == 0

    def test_amenities_multi_hot_empty(self):
        encoding = encode_amenities([])
        assert all(v == 0 for v in encoding.values())

    def test_amenities_multiple_can_be_set(self):
        encoding = encode_amenities(["Pool", "Gym", "Garden"])
        assert sum(encoding.values()) == 3


class TestNumericalFeatures:
    def test_bedrooms_bathrooms(self):
        result = encode_bedrooms_bathrooms(2, 3)
        assert result == {"bedrooms": 2.0, "bathrooms": 3.0}

    def test_bedrooms_bathrooms_none_defaults_to_zero(self):
        result = encode_bedrooms_bathrooms(None, None)
        assert result == {"bedrooms": 0.0, "bathrooms": 0.0}

    def test_rental_yield_known(self):
        result = encode_rental_yield(6.7)
        assert result["rental_yield"] == 6.7
        assert result["rental_yield_known"] == 1

    def test_rental_yield_missing(self):
        result = encode_rental_yield(None)
        assert result["rental_yield"] == 0.0
        assert result["rental_yield_known"] == 0

    def test_nearby_facilities_known(self):
        result = encode_nearby_facilities({"metro_distance_km": 0.4, "schools_distance_km": 2.1})
        assert result["metro_distance_km"] == 0.4
        assert result["metro_distance_km_known"] == 1
        assert result["schools_distance_km"] == 2.1
        assert result["schools_distance_km_known"] == 1
        assert result["hospitals_distance_km_known"] == 0

    def test_nearby_facilities_missing_uses_fallback(self):
        result = encode_nearby_facilities({})
        assert result["metro_distance_km"] == 50.0
        assert result["metro_distance_km_known"] == 0

    def test_nearby_facilities_none_input(self):
        result = encode_nearby_facilities(None)
        assert result["metro_distance_km"] == 50.0


class TestGeoEncoding:
    def test_known_coordinates(self):
        result = encode_geo(25.0805, 55.1403)
        assert result["latitude"] == 25.0805
        assert result["longitude"] == 55.1403
        assert result["geo_known"] == 1
        assert 0.0 <= result["geo_lat_scaled"] <= 1.0
        assert 0.0 <= result["geo_lon_scaled"] <= 1.0

    def test_missing_coordinates(self):
        result = encode_geo(None, None)
        assert result["geo_known"] == 0
        assert result["geo_lat_scaled"] == 0.5
        assert result["geo_lon_scaled"] == 0.5


class TestMinMaxScaler:
    def test_fit_and_transform(self):
        scaler = MinMaxScaler(field_name="price").fit([1_000_000, 2_000_000, 3_000_000])
        assert scaler.transform(1_000_000) == 0.0
        assert scaler.transform(3_000_000) == 1.0
        assert scaler.transform(2_000_000) == 0.5

    def test_transform_clamps_out_of_range(self):
        scaler = MinMaxScaler(field_name="price").fit([1_000_000, 2_000_000])
        assert scaler.transform(5_000_000) == 1.0
        assert scaler.transform(-100) == 0.0

    def test_transform_none_returns_zero(self):
        scaler = MinMaxScaler(field_name="price").fit([1_000_000, 2_000_000])
        assert scaler.transform(None) == 0.0

    def test_transform_before_fit_raises(self):
        scaler = MinMaxScaler(field_name="price")
        with pytest.raises(RuntimeError):
            scaler.transform(100)

    def test_fit_with_all_none_raises(self):
        scaler = MinMaxScaler(field_name="price")
        with pytest.raises(ValueError):
            scaler.fit([None, None])

    def test_fit_with_equal_min_max(self):
        scaler = MinMaxScaler(field_name="price").fit([500, 500])
        assert scaler.transform(500) == 0.5

    def test_save_and_load_roundtrip(self, tmp_path):
        scaler = MinMaxScaler(field_name="price").fit([1_000_000, 2_000_000])
        path = tmp_path / "scalers.json"
        save_scalers({"price": scaler}, str(path))

        loaded = load_scalers(str(path))
        assert loaded["price"].transform(1_500_000) == scaler.transform(1_500_000)


class TestFeatureEngineeringPipeline:
    SAMPLE_RECORDS = [
        {
            "property_id": "HP-0001",
            "property_type": "Apartment",
            "location": "Dubai Marina",
            "latitude": 25.0805,
            "longitude": 55.1403,
            "price": 1_000_000,
            "bedrooms": 2,
            "bathrooms": 2,
            "built_up_area_sqft": 1000,
            "amenities": ["Gym", "Pool"],
            "rental_yield": 6.5,
            "nearby_facilities": {"metro_distance_km": 0.5},
        },
        {
            "property_id": "HP-0002",
            "property_type": "Townhouse",
            "location": "Jumeirah Village Circle",
            "latitude": None,
            "longitude": None,
            "price": 2_000_000,
            "bedrooms": 3,
            "bathrooms": 3,
            "built_up_area_sqft": 2000,
            "amenities": [],
            "rental_yield": None,
            "nearby_facilities": {},
        },
    ]

    def test_fit_price_area_scalers(self):
        scalers = fit_price_area_scalers(self.SAMPLE_RECORDS)
        assert scalers["price"].transform(1_000_000) == 0.0
        assert scalers["price"].transform(2_000_000) == 1.0
        assert scalers["built_up_area_sqft"].transform(1000) == 0.0

    def test_engineer_property_features_single_record(self):
        scalers = fit_price_area_scalers(self.SAMPLE_RECORDS)
        features = engineer_property_features(self.SAMPLE_RECORDS[0], scalers)

        assert features["property_id"] == "HP-0001"
        assert features["price_normalized"] == 0.0
        assert features["bedrooms"] == 2.0
        assert features["property_type_Apartment"] == 1
        assert features["location_Dubai Marina"] == 1
        assert features["amenity_Gym"] == 1
        assert features["amenity_Pool"] == 1
        assert features["rental_yield_known"] == 1
        assert features["metro_distance_km"] == 0.5
        assert features["geo_known"] == 1

    def test_engineer_property_features_missing_data(self):
        scalers = fit_price_area_scalers(self.SAMPLE_RECORDS)
        features = engineer_property_features(self.SAMPLE_RECORDS[1], scalers)

        assert features["rental_yield_known"] == 0
        assert features["geo_known"] == 0
        assert features["metro_distance_km_known"] == 0
        assert all(features[f"amenity_{a}"] == 0 for a in ["Gym", "Pool", "Garden"])

    def test_engineer_features_for_dataset_end_to_end(self):
        feature_rows, scalers = engineer_features_for_dataset(self.SAMPLE_RECORDS)

        assert len(feature_rows) == 2
        assert feature_rows[0]["price_normalized"] == 0.0
        assert feature_rows[1]["price_normalized"] == 1.0
        assert "price" in scalers
        assert "built_up_area_sqft" in scalers

    def test_all_feature_rows_have_same_keys(self):
        feature_rows, _ = engineer_features_for_dataset(self.SAMPLE_RECORDS)
        assert set(feature_rows[0].keys()) == set(feature_rows[1].keys())


class TestSaleVsRentPriceFeatures:
    MIXED_RECORDS = [
        {
            "property_id": "SALE-1",
            "property_type": "Apartment",
            "location": "Dubai Marina",
            "price": 1_000_000,
            "rent_price": None,
            "bedrooms": 2,
            "bathrooms": 2,
            "built_up_area_sqft": 1000,
            "amenities": [],
            "rental_yield": None,
            "nearby_facilities": {},
        },
        {
            "property_id": "RENT-1",
            "property_type": "Apartment",
            "location": "Dubai Marina",
            "price": None,
            "rent_price": 120_000,
            "bedrooms": 1,
            "bathrooms": 1,
            "built_up_area_sqft": 800,
            "amenities": [],
            "rental_yield": None,
            "nearby_facilities": {},
        },
    ]

    def test_sale_only_record_has_no_rent_price(self):
        feature_rows, _ = engineer_features_for_dataset(self.MIXED_RECORDS)
        sale_row = feature_rows[0]
        assert sale_row["price_known"] == 1
        assert sale_row["rent_price_known"] == 0
        assert sale_row["rent_price_normalized"] == 0.0

    def test_rent_only_record_has_no_sale_price(self):
        feature_rows, _ = engineer_features_for_dataset(self.MIXED_RECORDS)
        rent_row = feature_rows[1]
        assert rent_row["price_known"] == 0
        assert rent_row["price_normalized"] == 0.0
        assert rent_row["rent_price_known"] == 1
        # only one rent_price value in the dataset -> scaler min==max -> midpoint 0.5
        assert rent_row["rent_price_normalized"] == 0.5

    def test_rent_price_never_corrupts_sale_price_scaler(self):
        scalers = fit_price_area_scalers(self.MIXED_RECORDS)
        # the sale-price scaler must be fit only from the one real sale price (1,000,000),
        # never from the rent_price (120,000) — otherwise the range would be skewed.
        assert scalers["price"].min_value == 1_000_000
        assert scalers["price"].max_value == 1_000_000

    def test_all_prices_missing_omits_scaler(self):
        no_price_records = [
            {**self.MIXED_RECORDS[0], "price": None, "rent_price": None},
        ]
        scalers = fit_price_area_scalers(no_price_records)
        assert "price" not in scalers
        assert "rent_price" not in scalers
        features = engineer_property_features(no_price_records[0], scalers)
        assert features["price_normalized"] == 0.0
        assert features["rent_price_normalized"] == 0.0
