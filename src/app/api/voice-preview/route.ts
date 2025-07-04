import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ElevenLabsSpeechSchema = z.object({
  text: z.string().min(1, { message: 'Text for speech synthesis is required.' }),
  voiceId: z.string().min(1, { message: 'Voice ID is required.' }),
  model_id: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarity_boost: z.number().min(0).max(1).optional(),
  style: z.number().min(0).max(1).optional(),
  use_speaker_boost: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[Voice Preview API] Processing request');

    const apiKeyFromEnv = process.env.ELEVENLABS_API_KEY;

    if (!apiKeyFromEnv) {
      console.error('[Voice Preview API] CRITICAL: ELEVENLABS_API_KEY is not set');
      return NextResponse.json({
        error: 'Server configuration error: ElevenLabs API key is missing.',
        success: false
      }, { status: 500 });
    }

    const body = await request.json();
    console.log('[Voice Preview API] Request body:', body);

    const validatedData = ElevenLabsSpeechSchema.parse(body);

    const elevenLabsPayload = {
      text: validatedData.text,
      model_id: validatedData.model_id || 'eleven_multilingual_v2',
      voice_settings: {
        stability: validatedData.stability ?? 0.5,
        similarity_boost: validatedData.similarity_boost ?? 0.5,
        style: validatedData.style ?? 0.0,
        use_speaker_boost: validatedData.use_speaker_boost ?? true,
      },
    };

    console.log('[Voice Preview API] Calling ElevenLabs API');
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${validatedData.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKeyFromEnv,
        },
        body: JSON.stringify(elevenLabsPayload),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error('[Voice Preview API] ElevenLabs API error:', errorText);
      return NextResponse.json({
        error: `ElevenLabs API error: ${elevenLabsResponse.status} ${elevenLabsResponse.statusText}`,
        success: false
      }, { status: 400 });
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log('[Voice Preview API] Successfully generated audio');
    return NextResponse.json({
      audioBase64,
      success: true
    });

  } catch (error) {
    console.error('[Voice Preview API] Error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      success: false
    }, { status: 500 });
  }
}
