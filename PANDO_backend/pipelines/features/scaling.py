import json
from dataclasses import dataclass


@dataclass
class MinMaxScaler:
    """Fittable min-max scaler for a single numeric field. Must be fit on a dataset before use,
    so the same fitted range is reused consistently across training and inference."""

    field_name: str
    min_value: float = 0.0
    max_value: float = 1.0
    _fitted: bool = False

    def fit(self, values: list[float]) -> "MinMaxScaler":
        clean_values = [v for v in values if v is not None]
        if not clean_values:
            raise ValueError(f"Cannot fit {self.field_name} scaler: no non-null values provided.")
        self.min_value = min(clean_values)
        self.max_value = max(clean_values)
        self._fitted = True
        return self

    def transform(self, value: float | None) -> float:
        if not self._fitted:
            raise RuntimeError(f"{self.field_name} scaler must be fit before use.")
        if value is None:
            return 0.0
        if self.max_value == self.min_value:
            return 0.5
        scaled = (value - self.min_value) / (self.max_value - self.min_value)
        return max(0.0, min(1.0, scaled))

    def to_dict(self) -> dict:
        return {
            "field_name": self.field_name,
            "min_value": self.min_value,
            "max_value": self.max_value,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "MinMaxScaler":
        scaler = cls(field_name=data["field_name"], min_value=data["min_value"], max_value=data["max_value"])
        scaler._fitted = True
        return scaler


def save_scalers(scalers: dict[str, MinMaxScaler], path: str) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump({name: s.to_dict() for name, s in scalers.items()}, f, indent=2)


def load_scalers(path: str) -> dict[str, MinMaxScaler]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return {name: MinMaxScaler.from_dict(d) for name, d in data.items()}
