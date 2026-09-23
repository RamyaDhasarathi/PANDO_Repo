'use client';
import dynamic from 'next/dynamic';

const PandoMapExplore = dynamic(
  () => import('@/components/home/PandoMapExplore'),
  { ssr: false, loading: () => (
    <div style={{ width: '100vw', height: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#c5a059', fontFamily: 'sans-serif', fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>
        Loading map…
      </div>
    </div>
  )}
);

export default function MapExploreWrapper() {
  return <PandoMapExplore />;
}
