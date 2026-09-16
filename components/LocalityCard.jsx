"use client";

import { useRouter } from "next/navigation";
import styles from "./LocalityCard.module.css";

export default function LocalityCard({ locality }) {
  const router = useRouter();

  return (
    <div
      className={styles.card}
      onClick={() => router.push(`/search?location=${encodeURIComponent(locality.name)}`)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={locality.image} alt={locality.name} className={styles.image} loading="lazy" />
      <div className={styles.overlay}>
        <div className={styles.name}>{locality.name}</div>
        <div className={styles.count}>{locality.count} properties available</div>
      </div>
    </div>
  );
}
