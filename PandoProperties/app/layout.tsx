import type { Metadata } from 'next';
import './globals.css';
import PandoTTSRouteGuard from '@/components/PandoTTSRouteGuard';

export const metadata: Metadata = {
  title: 'Pando AI — Recommended Properties | Dubai Prime Residential Intelligence',
  description: 'Synthesized ultra-luxury residences tailored in real-time to your bespoke architecture, lifestyle, private mooring needs, and high-yield profile.',
  keywords: 'Dubai luxury real estate, Palm Jumeirah, Dubai Hills Estate, Dubai Marina, Downtown Dubai, Pando AI, property intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full h-[100dvh] overflow-hidden bg-[#FBF6EE] text-[#111111] antialiased selection:bg-[#F7DDE0] selection:text-[#D92828]">
        <PandoTTSRouteGuard />
        {children}
      </body>
    </html>
  );
}
