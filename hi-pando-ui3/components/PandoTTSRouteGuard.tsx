'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { stopPandoSpeech } from '@/lib/ttsService'

/**
 * Mounted once in the root layout. Guarantees Pando's voice never carries over
 * from one route to the next, and stops speaking if the component unmounts.
 */
export default function PandoTTSRouteGuard() {
  const pathname = usePathname()

  useEffect(() => {
    stopPandoSpeech()
  }, [pathname])

  useEffect(() => {
    return () => stopPandoSpeech()
  }, [])

  return null
}
