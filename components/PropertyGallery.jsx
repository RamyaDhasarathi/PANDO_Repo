"use client";

import { useState } from "react";
import styles from "./PropertyGallery.module.css";

export default function PropertyGallery({ images, title }) {
  const [index, setIndex] = useState(0);

  function go(delta) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className={styles.wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={`${title} photo ${index + 1}`} className={styles.mainImage} />
      {images.length > 1 && (
        <>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navPrev}`}
            onClick={() => go(-1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className={`${styles.navBtn} ${styles.navNext}`}
            onClick={() => go(1)}
            aria-label="Next photo"
          >
            ›
          </button>
          <span className={styles.counter}>
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}
