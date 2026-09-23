from pipelines.matching.property_category import is_residential, property_category


class TestPropertyCategory:
    def test_residential_types(self):
        for t in ["Apartment", "Townhouse", "Villa", "Penthouse", "Duplex", "Studio"]:
            assert property_category(t) == "residential", t

    def test_commercial_types(self):
        for t in ["Office", "Retail", "Warehouse"]:
            assert property_category(t) == "commercial", t

    def test_bare_commercial_label_is_commercial(self):
        """Regression: a source record with propertyType='Commercial' (not a canonical
        Office/Retail/Warehouse label) must still be classified as commercial, not slip
        through as unrecognized/neutral."""
        assert property_category("Commercial") == "commercial"

    def test_land_is_neither_category(self):
        assert property_category("Land") is None

    def test_unrecognized_type_is_neither_category(self):
        assert property_category("Mansion") is None

    def test_case_insensitive(self):
        assert property_category("commercial") == "commercial"
        assert property_category("APARTMENT") == "residential"


class TestIsResidential:
    def test_residential_true(self):
        assert is_residential("Apartment") is True

    def test_commercial_false(self):
        assert is_residential("Office") is False
        assert is_residential("Commercial") is False

    def test_land_false(self):
        assert is_residential("Land") is False
