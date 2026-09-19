import dynamic from 'next/dynamic';
import dbConnect from '@/lib/mongodb';
import Listing from '@/lib/models/Listing';

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

export default async function MapExploreWrapper() {
  await dbConnect();
  
  // Fetch all properties to populate the map
  const properties = await Listing.find({}).lean();
  
  // Serialize the properties to pass them as props safely
  const serializedProperties = properties.map(p => {
    return {
      ...p,
      _id: p._id.toString(),
      createdAt: p.createdAt ? p.createdAt.toISOString() : null,
    };
  });

  return <PandoMapExplore dbProperties={serializedProperties} />;
}
