'use server';

import { z } from 'zod';

const ElevenLabsSpeechSchema = z.object({
  text: z.string().min(1, { message: 'Text for speech synthesis is required.' }),
  voiceId: z.string().min(1, { message: 'Voice ID is required.' }),
  modelId: z.string().optional(),
  stability: z.number().min(0).max(1).optional(),
  similarityBoost: z.number().min(0).max(1).optional(),
});

export interface ElevenLabsSpeechState {
  audioBase64?: string | null;
  error?: string | null;
  success: boolean;
}

export async function synthesizeElevenLabsSpeech(
  prevState: ElevenLabsSpeechState,
  formData: FormData
): Promise<ElevenLabsSpeechState> {
  const validatedFields = ElevenLabsSpeechSchema.safeParse({
    text: formData.get('text'),
    voiceId: formData.get('voiceId'),
    modelId: formData.get('modelId') || undefined, // Ensure undefined if not present
    stability: formData.get('stability') ? parseFloat(formData.get('stability') as string) : undefined,
    similarityBoost: formData.get('similarityBoost') ? parseFloat(formData.get('similarityBoost') as string) : undefined,
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid input: ' + validatedFields.error.flatten().fieldErrors.text?.join(', ') || validatedFields.error.flatten().fieldErrors.voiceId?.join(', '),
      success: false,
    };
  }

  const { text, voiceId, modelId, stability, similarityBoost } = validatedFields.data;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    console.error('ElevenLabs API key is not configured.');
    return { error: 'ElevenLabs API key is not configured on the server.', success: false };
  }

  const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const headers = {
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json',
    'XI-API-KEY': apiKey,
  };

  const body: Record<string, any> = {
    text: text,
  };

  if (modelId) {
    body.model_id = modelId;
  }
  if (stability !== undefined || similarityBoost !== undefined) {
    body.voice_settings = {};
    if (stability !== undefined) {
      body.voice_settings.stability = stability;
    }
    if (similarityBoost !== undefined) {
      body.voice_settings.similarity_boost = similarityBoost;
    }
  }

  try {
    const response = await fetch(elevenLabsApiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ detail: { message: 'Unknown error from ElevenLabs API' } }));
      console.error('ElevenLabs API Error:', response.status, errorBody);
      return { error: `ElevenLabs API Error: ${response.status} - ${errorBody.detail?.message || JSON.stringify(errorBody)}`, success: false };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    return { audioBase64: audioBase64, success: true };
  } catch (error) {
    console.error('Failed to synthesize speech with ElevenLabs:', error);
    return { error: 'Failed to connect to ElevenLabs API. ' + (error instanceof Error ? error.message : String(error)), success: false };
  }
}
