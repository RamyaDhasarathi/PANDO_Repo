"use client";

import { useState } from "react";
import Link from "next/link";
import { bedroomLabel, formatPrice } from "@/lib/format";

export default function PropertyCard({ property }) {
  const [fav, setFav] = useState(false);

  return (
    <div className="flex flex-col bg-hp-surface rounded-hp-lg overflow-hidden border border-hp-line-soft shadow-hp-sm transition-all duration-250 ease-out h-full hover:-translate-y-[6px] hover:shadow-hp-lg group/card">
      <Link href={`/property/${property.id}`} className="relative aspect-[4/3] overflow-hidden bg-hp-mint-100 group/image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.images[0]}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/image:scale-[1.06] group-hover/card:scale-[1.06]"
          loading="lazy"
        />
        <span
          className={`absolute top-[12px] left-[12px] px-[12px] py-[6px] rounded-hp-pill text-[0.72rem] font-bold tracking-[0.03em] uppercase text-white backdrop-blur-[4px] ${
            property.purpose === "sale" ? "bg-[rgba(193,39,45,0.92)]" : "bg-[rgba(201,162,75,0.94)]"
          }`}
        >
          {property.purpose === "sale" ? "For Sale" : "For Rent"}
        </span>
        <button
          type="button"
          className="absolute top-[10px] right-[10px] w-[34px] h-[34px] rounded-full border-none bg-white/90 flex items-center justify-center cursor-pointer shadow-hp-sm transition-transform duration-150 ease-out hover:scale-[1.08] z-10"
          aria-label="Save to favorites"
          onClick={(e) => {
            e.preventDefault();
            setFav((v) => !v);
          }}
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
            <path
              d="M8 13.5s-6.5-4-6.5-8.3C1.5 2.7 3.3 1 5.5 1c1.3 0 2.4.7 2.5 1.7C8.1 1.7 9.2 1 10.5 1c2.2 0 4 1.7 4 4.2 0 4.3-6.5 8.3-6.5 8.3Z"
              stroke={fav ? "#e0555a" : "#29352f"}
              strokeWidth="1.3"
              fill={fav ? "#e0555a" : "none"}
            />
          </svg>
        </button>
      </Link>

      <Link href={`/property/${property.id}`} className="p-hp-4 pb-hp-5 flex flex-col gap-[6px] flex-1">
        <div className="text-[1.2rem] font-extrabold text-hp-ink tracking-[-0.01em]">
          {formatPrice(property)}
        </div>
        <div className="text-[0.95rem] font-semibold text-hp-charcoal">
          {bedroomLabel(property.bedrooms)} {property.type}
        </div>
        <div className="text-[0.83rem] text-hp-slate flex items-center gap-[4px]">{property.community}, {property.city}</div>

        <div className="mt-auto pt-hp-3 border-t border-dashed border-hp-line flex items-center gap-hp-4">
          <span className="flex items-center gap-[5px] text-[0.8rem] text-hp-slate font-semibold">🛏 {property.bedrooms || "-"}</span>
          <span className="flex items-center gap-[5px] text-[0.8rem] text-hp-slate font-semibold">🛁 {property.bathrooms || "-"}</span>
          <span className="flex items-center gap-[5px] text-[0.8rem] text-hp-slate font-semibold">📐 {property.areaSqft.toLocaleString()} sqft</span>
        </div>
      </Link>
    </div>
  );
}
