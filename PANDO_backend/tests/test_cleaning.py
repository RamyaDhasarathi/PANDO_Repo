from pipelines.cleaning.amenities import normalize_amenities, normalize_amenity
from pipelines.cleaning.area import normalize_area_to_sqft
from pipelines.cleaning.duplicates import find_duplicates
from pipelines.cleaning.location import normalize_location
from pipelines.cleaning.missing_values import apply_missing_value_defaults
from pipelines.cleaning.pipeline import clean_property_record
from pipelines.cleaning.price import normalize_price
from pipelines.cleaning.property_type import normalize_property_type
from pipelines.cleaning.text_cleaning import clean_text, normalize_key


class TestTextCleaning:
    def test_strips_and_collapses_whitespace(self):
        assert clean_text("  Marina   Sky   Residence \n") == "Marina Sky Residence"

    def test_normalizes_nbsp(self):
        assert clean_text("Palm Jumeirah") == "Palm Jumeirah"

    def test_empty_becomes_none(self):
        assert clean_text("   ") is None
        assert clean_text(None) is None

    def test_normalize_key_lowercases_and_strips_punctuation(self):
        assert normalize_key("Jumeirah Village Circle (JVC)") == "jumeirah village circle jvc"


class TestPropertyTypeNormalization:
    def test_known_variants(self):
        assert normalize_property_type("Apt") == "Apartment"
        assert normalize_property_type("  condo  ") == "Apartment"
        assert normalize_property_type("Town House") == "Townhouse"
        assert normalize_property_type("Beachfront Villa") == "Villa"
        assert normalize_property_type("PENT HOUSE") == "Penthouse"

    def test_canonical_value_passthrough(self):
        assert normalize_property_type("Apartment") == "Apartment"

    def test_unrecognized_returns_none(self):
        assert normalize_property_type("Spaceship") is None
        assert normalize_property_type(None) is None
        assert normalize_property_type("") is None


class TestLocationNormalization:
    def test_known_variants(self):
        assert normalize_location("JVC") == "Jumeirah Village Circle"
        assert normalize_location("the marina") == "Dubai Marina"
        assert normalize_location("Down Town Dubai") == "Downtown Dubai"
        assert normalize_location("JBR") == "Jumeirah Beach Residence"

    def test_unrecognized_returns_none(self):
        assert normalize_location("Nowhereville") is None


class TestAmenityNormalization:
    def test_single_variant(self):
        assert normalize_amenity("Swimming Pool") == "Pool"
        assert normalize_amenity("Gymnasium") == "Gym"
        assert normalize_amenity("unknown thing") is None

    def test_list_normalization_dedupes_and_drops_unknown(self):
        raw = ["Swimming Pool", "Pool", "Gymnasium", "Made Up Amenity", None]
        assert normalize_amenities(raw) == ["Pool", "Gym"]

    def test_empty_list(self):
        assert normalize_amenities([]) == []
        assert normalize_amenities(None) == []


class TestPriceNormalization:
    def test_plain_number(self):
        assert normalize_price(1650000) == 1650000.0

    def test_comma_formatted_string(self):
        assert normalize_price("1,650,000") == 1650000.0

    def test_aed_prefix(self):
        assert normalize_price("AED 1,650,000") == 1650000.0

    def test_usd_conversion(self):
        assert normalize_price("$500,000") == round(500_000 * 3.6725, 2)

    def test_million_shorthand(self):
        assert normalize_price("1.5M") == 1_500_000.0
        assert normalize_price("1.5 million AED") == 1_500_000.0

    def test_unparseable_returns_none(self):
        assert normalize_price("price on request") is None
        assert normalize_price(None) is None


class TestAreaNormalization:
    def test_plain_sqft_number(self):
        assert normalize_area_to_sqft(1150) == 1150.0

    def test_sqft_string(self):
        assert normalize_area_to_sqft("1,150 sqft") == 1150.0

    def test_sqm_conversion(self):
        assert normalize_area_to_sqft("100 sqm") == round(100 * 10.7639, 2)
        assert normalize_area_to_sqft("100 m2") == round(100 * 10.7639, 2)

    def test_unparseable_returns_none(self):
        assert normalize_area_to_sqft("large") is None


class TestMissingValueDefaults:
    def test_optional_scalars_default_to_none(self):
        result = apply_missing_value_defaults({"property_id": "P1"})
        assert result["developer"] is None
        assert result["parking"] is None
        assert result["floor"] is None

    def test_list_fields_default_to_empty_list(self):
        result = apply_missing_value_defaults({"property_id": "P1"})
        assert result["amenities"] == []
        assert result["property_purpose"] == []

    def test_does_not_override_present_values(self):
        result = apply_missing_value_defaults({"property_id": "P1", "parking": 0, "developer": "Emaar"})
        assert result["parking"] == 0
        assert result["developer"] == "Emaar"

    def test_nearby_facilities_defaults_to_empty_dict(self):
        result = apply_missing_value_defaults({"property_id": "P1"})
        assert result["nearby_facilities"] == {}


class TestDuplicateDetection:
    def test_exact_id_duplicate(self):
        records = [
            {"property_id": "P1", "property_name": "A", "location": "Dubai Marina", "price": 100},
            {"property_id": "P1", "property_name": "A copy", "location": "Dubai Marina", "price": 100},
        ]
        matches = find_duplicates(records)
        assert len(matches) == 1
        assert matches[0].reason == "duplicate property_id"

    def test_fuzzy_name_location_price_duplicate(self):
        records = [
            {
                "property_id": "P1",
                "property_name": "Marina Sky Residence",
                "location": "Dubai Marina",
                "price": 1650000,
            },
            {
                "property_id": "P2",
                "property_name": "Marina Sky Residences",
                "location": "Dubai Marina",
                "price": 1652000,
            },
        ]
        matches = find_duplicates(records)
        assert len(matches) == 1
        assert matches[0].reason == "fuzzy match: name+location+price"

    def test_different_location_not_duplicate(self):
        records = [
            {
                "property_id": "P1",
                "property_name": "Marina Sky Residence",
                "location": "Dubai Marina",
                "price": 1650000,
            },
            {
                "property_id": "P2",
                "property_name": "Marina Sky Residence",
                "location": "JVC",
                "price": 1650000,
            },
        ]
        assert find_duplicates(records) == []

    def test_different_price_not_duplicate(self):
        records = [
            {
                "property_id": "P1",
                "property_name": "Marina Sky Residence",
                "location": "Dubai Marina",
                "price": 1000000,
            },
            {
                "property_id": "P2",
                "property_name": "Marina Sky Residence",
                "location": "Dubai Marina",
                "price": 2000000,
            },
        ]
        assert find_duplicates(records) == []

    def test_no_duplicates_in_distinct_records(self):
        records = [
            {"property_id": "P1", "property_name": "A", "location": "Dubai Marina", "price": 100},
            {"property_id": "P2", "property_name": "B", "location": "JVC", "price": 200},
        ]
        assert find_duplicates(records) == []


class TestCleaningPipelineIntegration:
    def test_messy_record_end_to_end(self):
        messy = {
            "property_id": "HP-0099",
            "property_name": "  Marina   Sky Residence \n",
            "developer": " Emaar ",
            "property_type": "Apt",
            "location": "the marina",
            "community": "  Marina Promenade  ",
            "price": "AED 1,650,000",
            "bedrooms": 2,
            "bathrooms": 2,
            "built_up_area_sqft": "1,150 sqft",
            "completion_status": "Ready",
            "amenities": ["Swimming Pool", "Gymnasium", "Made Up Amenity"],
        }

        cleaned = clean_property_record(messy)

        assert cleaned["property_name"] == "Marina Sky Residence"
        assert cleaned["developer"] == "Emaar"
        assert cleaned["property_type"] == "Apartment"
        assert cleaned["location"] == "Dubai Marina"
        assert cleaned["community"] == "Marina Promenade"
        assert cleaned["price"] == 1650000.0
        assert cleaned["built_up_area_sqft"] == 1150.0
        assert cleaned["amenities"] == ["Pool", "Gym"]
        assert cleaned["parking"] is None
        assert cleaned["property_purpose"] == []

    def test_unrecognized_property_type_falls_back_to_cleaned_raw_text(self):
        messy = {"property_type": "  Spaceship  "}
        cleaned = clean_property_record(messy)
        assert cleaned["property_type"] == "Spaceship"
