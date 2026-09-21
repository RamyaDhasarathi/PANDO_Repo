import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Microsoft Edge's free neural "Read Aloud" voice — natural, friendly, female.
// No API key or quota; uses the same unofficial protocol as edge-tts CLIs.
const EDGE_TTS_VOICE = 'en-US-JennyNeural';

export async function POST(request) {
  const { text } = await request.json();
  if (!text || typeof text !== 'string') {
    return Response.json({ error: 'Missing text' }, { status: 400 });
  }

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(EDGE_TTS_VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    // Safeguard msedge-tts against uncaughtException (TypeError: Cannot read properties of undefined (reading 'audio'))
    // caused by trailing WebSocket packets after stream teardown or client abort.
    const originalPush = tts._pushAudioData;
    if (typeof originalPush === 'function') {
      tts._pushAudioData = function (data, requestId) {
        try {
          if (requestId && this._streams && this._streams[requestId] && this._streams[requestId].audio) {
            originalPush.call(this, data, requestId);
          }
        } catch {
          // Ignore trailing WebSocket chunks after stream end or closed stream
        }
      };
    }

    const { audioStream } = tts.toStream(text);

    audioStream.on('error', () => {
      // Suppress internal stream errors gracefully
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (e) {
    console.warn('Edge TTS request failed:', e?.message || e);
    return Response.json({ error: 'Edge TTS request failed' }, { status: 502 });
  }
}
