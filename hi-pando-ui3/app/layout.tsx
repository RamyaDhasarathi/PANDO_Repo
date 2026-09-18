import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PandoTTSRouteGuard from '@/components/PandoTTSRouteGuard'

export const metadata: Metadata = {
  title: 'Hi Pando — Your Real Estate Advisor',
  description: 'Real estate advice that talks back. Find your next place with Pando.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f7f0e6',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <PandoTTSRouteGuard />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
