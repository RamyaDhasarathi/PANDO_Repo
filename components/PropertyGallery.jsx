"use client";

import { useState } from "react";

export default function PropertyGallery({ images, title }) {
  const [index, setIndex] = useState(0);

  function go(delta) {
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <div className="relative rounded-hp-lg overflow-hidden bg-hp-mint-100 h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={images[index]} alt={`${title} photo ${index + 1}`} className="w-full h-full min-h-[220px] object-cover block" />
      {images.length > 1 && (
        <>
          <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 left-[16px] w-[42px] h-[42px] rounded-full border-none bg-white/90 flex items-center justify-center cursor-pointer shadow-hp-md"
            onClick={() => go(-1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="absolute top-1/2 -translate-y-1/2 right-[16px] w-[42px] h-[42px] rounded-full border-none bg-white/90 flex items-center justify-center cursor-pointer shadow-hp-md"
            onClick={() => go(1)}
            aria-label="Next photo"
          >
            ›
          </button>
          <span className="absolute bottom-[16px] right-[16px] bg-[#10231d]/70 text-white text-[0.8rem] font-semibold px-[12px] py-[5px] rounded-hp-pill">
            {index + 1} / {images.length}
          </span>
        </>
      )}
    </div>
  );
}
