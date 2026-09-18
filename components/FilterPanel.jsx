"use client";


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
    <div className="bg-hp-surface border border-hp-line-soft rounded-hp-lg p-hp-5 flex flex-col gap-hp-5">
      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">
          Filters
          <button type="button" className="self-start bg-transparent border-none text-hp-primary-dark font-bold text-[0.82rem] cursor-pointer p-0" onClick={onReset}>
            Reset all
          </button>
        </div>
      </div>

      <div className="h-[1px] bg-hp-line-soft" />

      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">Purpose</div>
        <div className="flex flex-wrap gap-[8px]">
          {["sale", "rent"].map((p) => (
            <button
              key={p}
              type="button"
              className={`border-[1.5px] border-hp-line rounded-hp-pill px-[14px] py-[6px] text-[0.8rem] font-semibold cursor-pointer ${filters.purpose === p ? "bg-hp-primary border-hp-primary text-white" : "bg-hp-bg text-hp-charcoal"}`}
              onClick={() => onChange({ purpose: filters.purpose === p ? "" : p })}
            >
              {p === "sale" ? "Buy" : "Rent"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">Property Type</div>
        {PROPERTY_TYPES.map((t) => (
          <label key={t} className="flex items-center gap-[10px] text-[0.88rem] text-hp-charcoal cursor-pointer">
            <input
              type="checkbox"
              className="w-[16px] h-[16px] accent-hp-primary cursor-pointer"
              checked={filters.types?.includes(t) || false}
              onChange={() => toggleArrayValue("types", t)}
            />
            {t}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">Price Range (AED)</div>
        <div className="flex items-center gap-[8px]">
          <input
            type="number"
            className="w-full border-[1.5px] border-hp-line rounded-[10px] px-[10px] py-[9px] text-[0.85rem] outline-none focus:border-hp-primary"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) => onChange({ minPrice: e.target.value })}
          />
          <span>–</span>
          <input
            type="number"
            className="w-full border-[1.5px] border-hp-line rounded-[10px] px-[10px] py-[9px] text-[0.85rem] outline-none focus:border-hp-primary"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) => onChange({ maxPrice: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">Bedrooms</div>
        <div className="flex flex-wrap gap-[8px]">
          {BEDROOM_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              className={`border-[1.5px] border-hp-line rounded-hp-pill px-[14px] py-[6px] text-[0.8rem] font-semibold cursor-pointer ${filters.bedrooms?.includes(b) ? "bg-hp-primary border-hp-primary text-white" : "bg-hp-bg text-hp-charcoal"}`}
              onClick={() => toggleArrayValue("bedrooms", b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">Area (sq. ft.)</div>
        <div className="flex items-center gap-[8px]">
          <input
            type="number"
            className="w-full border-[1.5px] border-hp-line rounded-[10px] px-[10px] py-[9px] text-[0.85rem] outline-none focus:border-hp-primary"
            placeholder="Min"
            value={filters.minArea || ""}
            onChange={(e) => onChange({ minArea: e.target.value })}
          />
          <span>–</span>
          <input
            type="number"
            className="w-full border-[1.5px] border-hp-line rounded-[10px] px-[10px] py-[9px] text-[0.85rem] outline-none focus:border-hp-primary"
            placeholder="Max"
            value={filters.maxArea || ""}
            onChange={(e) => onChange({ maxArea: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-hp-3">
        <div className="text-[0.85rem] font-bold text-hp-ink flex items-center justify-between">Amenities</div>
        {AMENITY_OPTIONS.map((a) => (
          <label key={a} className="flex items-center gap-[10px] text-[0.88rem] text-hp-charcoal cursor-pointer">
            <input
              type="checkbox"
              className="w-[16px] h-[16px] accent-hp-primary cursor-pointer"
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
