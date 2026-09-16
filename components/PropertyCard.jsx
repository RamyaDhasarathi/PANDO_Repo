"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./PropertyCard.module.css";
import { bedroomLabel, formatPrice } from "@/lib/format";

export default function PropertyCard({ property }) {
  const [fav, setFav] = useState(false);

  return (
    <div className={styles.card}>
      <Link href={`/property/${property.id}`} className={styles.imageWrap}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={property.images[0]}
          alt={property.title}
          className={styles.image}
          loading="lazy"
        />
        <span
          className={`${styles.badge} ${
            property.purpose === "sale" ? styles.badgeSale : styles.badgeRent
          }`}
        >
          {property.purpose === "sale" ? "For Sale" : "For Rent"}
        </span>
        <button
          type="button"
          className={`${styles.favBtn} ${fav ? styles.favActive : ""}`}
          aria-label="Save to favorites"
          onClick={(e) => {
            e.preventDefault();
            setFav((v) => !v);
          }}
        >
          <svg width="16" height="14" viewBox="0 0 16 14" fill="none">
            <path
              d="M8 13.5s-6.5-4-6.5-8.3C1.5 2.7 3.3 1 5.5 1c1.3 0 2.4.7 2.5 1.7C8.1 1.7 9.2 1 10.5 1c2.2 0 4 1.7 4 4.2 0 4.3-6.5 8.3-6.5 8.3Z"
              stroke="#29352f"
              strokeWidth="1.3"
              fill={fav ? "#e0555a" : "none"}
            />
          </svg>
        </button>
      </Link>

      <Link href={`/property/${property.id}`} className={styles.body}>
        <div className={styles.price}>
          {formatPrice(property)}
        </div>
        <div className={styles.title}>
          {bedroomLabel(property.bedrooms)} {property.type}
        </div>
        <div className={styles.location}>{property.community}, {property.city}</div>

        <div className={styles.facts}>
          <span className={styles.fact}>🛏 {property.bedrooms || "-"}</span>
          <span className={styles.fact}>🛁 {property.bathrooms || "-"}</span>
          <span className={styles.fact}>📐 {property.areaSqft.toLocaleString()} sqft</span>
        </div>
      </Link>
    </div>
  );
}
