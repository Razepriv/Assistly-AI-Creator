
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
    console.error('ElevenLabs Action Validation Error:', validatedFields.error.flatten());
    return {
      error: 'Invalid input: ' + (validatedFields.error.flatten().fieldErrors.text?.join(', ') || validatedFields.error.flatten().fieldErrors.voiceId?.join(', ') || 'Unknown validation error'),
      success: false,
    };
  }

  const { text, voiceId, modelId, stability, similarityBoost } = validatedFields.data;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  console.log('[ElevenLabs Action] Received voiceId:', voiceId);

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
    model_id: modelId || "eleven_multilingual_v2", // Default to multilingual_v2 if not provided
  };

  if (stability !== undefined || similarityBoost !== undefined) {
    body.voice_settings = {};
    if (stability !== undefined) {
      body.voice_settings.stability = stability;
    }
    if (similarityBoost !== undefined) {
      body.voice_settings.similarity_boost = similarityBoost;
    }
  }
  
  console.log('[ElevenLabs Action] Calling API:', elevenLabsApiUrl);
  console.log('[ElevenLabs Action] Request body:', JSON.stringify(body));

  try {
    const response = await fetch(elevenLabsApiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorResponseText = await response.text(); 
      console.error('[ElevenLabs Action] API Error Status:', response.status);
      console.error('[ElevenLabs Action] API Error Response Text:', errorResponseText);
      
      let errorDetailMessage = 'Unknown error from ElevenLabs API';
      try {
        const errorBodyJson = JSON.parse(errorResponseText);
        if (errorBodyJson.detail && typeof errorBodyJson.detail.message === 'string') {
            errorDetailMessage = errorBodyJson.detail.message;
        } else if (errorBodyJson.detail && typeof errorBodyJson.detail === 'string') {
            errorDetailMessage = errorBodyJson.detail;
        } else {
            errorDetailMessage = JSON.stringify(errorBodyJson);
        }
      } catch (e) {
        errorDetailMessage = errorResponseText.substring(0, 500); 
      }
      
      return { error: `ElevenLabs API Error: ${response.status} - ${errorDetailMessage}`, success: false };
    }

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    console.log('[ElevenLabs Action] Speech synthesis successful.');
    return { audioBase64: audioBase64, success: true };
  } catch (error) {
    console.error('[ElevenLabs Action] Failed to synthesize speech:', error);
    return { error: 'Failed to connect to ElevenLabs API. ' + (error instanceof Error ? error.message : String(error)), success: false };
  }
}
