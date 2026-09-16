'use client';

import React from 'react';
import dynamic from 'next/dynamic';

const RealPandoMapInner = dynamic(() => import('./RealPandoMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-white relative">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-[#d22c23] border-t-transparent animate-spin"></div>
        <p className="font-bold text-xs tracking-wider uppercase text-slate-300">Loading Real Dubai Map...</p>
      </div>
    </div>
  ),
});

export default function RealPandoMap(props) {
  return <RealPandoMapInner {...props} />;
}
