"use client";

import styles from "./FilterPanel.module.css";

const PROPERTY_TYPES = ["Apartment", "Villa", "Townhouse", "Plot", "Commercial"];
const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4+"];
const AMENITY_OPTIONS = ["Pool", "Gym", "Parking", "Pet-friendly", "Furnished"];

export default function FilterPanel({ filters, onChange, onReset }) {
  function toggleArrayValue(key, value) {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ [key]: next });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.group}>
        <div className={styles.groupTitle}>
          Filters
          <button type="button" className={styles.resetBtn} onClick={onReset}>
            Reset all
          </button>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.group}>
        <div className={styles.groupTitle}>Purpose</div>
        <div className={styles.pillRow}>
          {["sale", "rent"].map((p) => (
            <button
              key={p}
              type="button"
              className={`${styles.pill} ${filters.purpose === p ? styles.pillActive : ""}`}
              onClick={() => onChange({ purpose: filters.purpose === p ? "" : p })}
            >
              {p === "sale" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Property Type</div>
        {PROPERTY_TYPES.map((t) => (
          <label key={t} className={styles.checkRow}>
            <input
              type="checkbox"
              checked={filters.types?.includes(t) || false}
              onChange={() => toggleArrayValue("types", t)}
            />
            {t}
          </label>
        ))}
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Price Range (AED)</div>
        <div className={styles.rangeInputs}>
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Bedrooms</div>
        <div className={styles.pillRow}>
          {BEDROOM_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              className={`${styles.pill} ${filters.bedrooms?.includes(b) ? styles.pillActive : ""}`}
              onClick={() => toggleArrayValue("bedrooms", b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Area (sq. ft.)</div>
        <div className={styles.rangeInputs}>
          <input
            type="number"
            placeholder="Min"
            value={filters.minArea || ""}
            onChange={(e) => onChange({ minArea: e.target.value })}
          />
          <span>–</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxArea || ""}
            onChange={(e) => onChange({ maxArea: e.target.value })}
          />
        </div>
      </div>

      <div className={styles.group}>
        <div className={styles.groupTitle}>Amenities</div>
        {AMENITY_OPTIONS.map((a) => (
          <label key={a} className={styles.checkRow}>
            <input
              type="checkbox"
              checked={filters.amenities?.includes(a) || false}
              onChange={() => toggleArrayValue("amenities", a)}
            />
            {a}
          </label>
        ))}
      </div>
    </div>
  );
}
