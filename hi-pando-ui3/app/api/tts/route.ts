import { Readable } from 'node:stream'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { NextRequest } from 'next/server'

// Microsoft Edge's free neural "Read Aloud" voice — natural, friendly, female.
// No API key or quota; uses the same unofficial protocol as edge-tts CLIs.
const EDGE_TTS_VOICE = 'en-US-JennyNeural'

export async function POST(request: NextRequest) {
  const { text } = await request.json()
  if (!text || typeof text !== 'string') {
    return Response.json({ error: 'Missing text' }, { status: 400 })
  }

  try {
    const tts = new MsEdgeTTS()
    await tts.setMetadata(EDGE_TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)

    return new Response(Readable.toWeb(audioStream) as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('Edge TTS request failed:', e)
    return Response.json({ error: 'Edge TTS request failed' }, { status: 502 })
  }
}
