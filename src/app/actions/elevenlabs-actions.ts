
'use server';

import { z } from 'zod';

// Adjusted schema to match typical ElevenLabs parameters more closely
const ElevenLabsSpeechSchema = z.object({
  text: z.string().min(1, { message: 'Text for speech synthesis is required.' }),
  voiceId: z.string().min(1, { message: 'Voice ID is required.' }),
  model_id: z.string().optional(), // model_id, not modelId
  stability: z.number().min(0).max(1).optional(),
  similarity_boost: z.number().min(0).max(1).optional(), // similarity_boost
  style: z.number().min(0).max(1).optional(), // For style_exaggeration
  use_speaker_boost: z.boolean().optional(), // For speaker_boost
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

  const stabilityValue = formData.get('stability');
  const similarityBoostValue = formData.get('similarityBoost');
  const styleValue = formData.get('style');
  const useSpeakerBoostValue = formData.get('use_speaker_boost');

  const validatedFields = ElevenLabsSpeechSchema.safeParse({
    text: formData.get('text'),
    voiceId: formData.get('voiceId'),
    model_id: formData.get('model_id') || undefined,
    stability: stabilityValue ? parseFloat(stabilityValue as string) : undefined,
    similarity_boost: similarityBoostValue ? parseFloat(similarityBoostValue as string) : undefined,
    style: styleValue ? parseFloat(styleValue as string) : undefined,
    use_speaker_boost: useSpeakerBoostValue === 'true' ? true : (useSpeakerBoostValue === 'false' ? false : undefined),
  });

  if (!validatedFields.success) {
    console.error('ElevenLabs Action Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Invalid input: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
      success: false,
    };
  }

  const { text, voiceId, model_id, stability, similarity_boost, style, use_speaker_boost } = validatedFields.data;
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
    model_id: model_id || "eleven_multilingual_v2", 
  };

  const voice_settings: Record<string, any> = {};
  if (stability !== undefined) voice_settings.stability = stability;
  if (similarity_boost !== undefined) voice_settings.similarity_boost = similarity_boost;
  if (style !== undefined) voice_settings.style = style; // style_exaggeration
  if (use_speaker_boost !== undefined) voice_settings.use_speaker_boost = use_speaker_boost;
  
  if (Object.keys(voice_settings).length > 0) {
    body.voice_settings = voice_settings;
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
        } else if (errorBodyJson.detail && Array.isArray(errorBodyJson.detail) && errorBodyJson.detail.length > 0 && typeof errorBodyJson.detail[0].msg === 'string') {
            errorDetailMessage = errorBodyJson.detail[0].msg; // Handle cases where error is in an array
        } else if (errorBodyJson.detail && typeof errorBodyJson.detail === 'string') {
            errorDetailMessage = errorBodyJson.detail;
        } else {
            errorDetailMessage = JSON.stringify(errorBodyJson);
        }
      } catch (e) {
        // If parsing fails, use the raw text, truncated if too long
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
