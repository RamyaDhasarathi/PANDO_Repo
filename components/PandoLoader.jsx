'use client';

import React from 'react';
import Image from 'next/image';

export default function PandoLoader() {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Outer Green Pulse */}
        <div className="absolute inset-0 rounded-full border-2 border-[#1E7A5F] opacity-20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        
        {/* Inner Red Pulse */}
        <div className="absolute inset-2 rounded-full border-2 border-[#d22c23] opacity-40 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite_0.2s]"></div>
        
        {/* Mascot Center */}
        <div className="relative z-10 w-16 h-16 rounded-full overflow-hidden shadow-lg bg-white p-1 border border-gray-100">
          <Image 
            src="/pando-favicon.png" 
            alt="Pando Loading" 
            width={64} 
            height={64} 
            className="w-full h-full object-cover rounded-full animate-pulse"
            onError={(e) => { e.target.src = '/images/pando-agent.png'; }}
          />
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <h3 className="text-[#111827] font-bold text-lg tracking-tight mb-1">Syncing Matrix Parameters</h3>
        <p className="text-[#6B7280] text-sm font-medium">Curating ultra-prime portfolios...</p>
      </div>
    </div>
  );
}
