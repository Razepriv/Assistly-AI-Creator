
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
  console.log('[ElevenLabs Action] Entered synthesizeElevenLabsSpeech server action.');

  const apiKeyFromEnv = process.env.ELEVENLABS_API_KEY;

  if (!apiKeyFromEnv) {
    console.error('[ElevenLabs Action] CRITICAL: ELEVENLABS_API_KEY is not set in the environment variables. Please check your .env file and restart the server.');
    // Return a user-friendly error, but the "Failed to fetch" might still occur if this action crashes before this point.
    return { 
      error: 'Server configuration error: ElevenLabs API key is missing. Please contact support or check server logs for more details.', 
      success: false 
    };
  } else {
    console.log(`[ElevenLabs Action] ELEVENLABS_API_KEY is present (length: ${apiKeyFromEnv.length}).`);
  }
  
  console.log('[ElevenLabs Action] Attempting to parse FormData. Received FormData keys:', Array.from(formData.keys()));
  let text, voiceId, model_id_form, stabilityValue, similarityBoostValue, styleValue, useSpeakerBoostValue;
  
  try {
    text = formData.get('text') as string;
    voiceId = formData.get('voiceId') as string;
    model_id_form = formData.get('model_id') as string || undefined;
    stabilityValue = formData.get('stability');
    similarityBoostValue = formData.get('similarityBoost');
    styleValue = formData.get('style');
    useSpeakerBoostValue = formData.get('use_speaker_boost');
    console.log('[ElevenLabs Action] Successfully retrieved values from FormData.');
    console.log('[ElevenLabs Action] Parsed FormData values (initial retrieval):');
    console.log('[ElevenLabs Action] - text:', text ? `"${text.substring(0,100)}..."` : "undefined");
    console.log('[ElevenLabs Action] - voiceId:', voiceId);
    console.log('[ElevenLabs Action] - model_id (from form):', model_id_form);
    console.log('[ElevenLabs Action] - stabilityValue (raw):', stabilityValue);
    console.log('[ElevenLabs Action] - similarityBoostValue (raw):', similarityBoostValue);
    console.log('[ElevenLabs Action] - styleValue (raw):', styleValue);
    console.log('[ElevenLabs Action] - useSpeakerBoostValue (raw):', useSpeakerBoostValue);

  } catch (e: any) {
    console.error('[ElevenLabs Action] Error retrieving data from FormData:', e);
    return { error: `Server error: Could not process form data. Details: ${e.message}`, success: false };
  }
  
  const validatedFields = ElevenLabsSpeechSchema.safeParse({
    text: text,
    voiceId: voiceId,
    model_id: model_id_form,
    stability: stabilityValue !== null && stabilityValue !== undefined && stabilityValue !== '' ? parseFloat(stabilityValue as string) : undefined,
    similarity_boost: similarityBoostValue !== null && similarityBoostValue !== undefined && similarityBoostValue !== '' ? parseFloat(similarityBoostValue as string) : undefined,
    style: styleValue !== null && styleValue !== undefined && styleValue !== '' ? parseFloat(styleValue as string) : undefined,
    use_speaker_boost: useSpeakerBoostValue === 'true' ? true : (useSpeakerBoostValue === 'false' ? false : undefined),
  });

  if (!validatedFields.success) {
    console.error('[ElevenLabs Action] Zod Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Invalid input for speech synthesis: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors),
      success: false,
    };
  }
  
  console.log('[ElevenLabs Action] Validated fields by Zod:', validatedFields.data);

  const { 
    text: validatedText, 
    voiceId: validatedVoiceId, 
    model_id: validatedModelId, 
    stability, 
    similarity_boost, 
    style, 
    use_speaker_boost 
  } = validatedFields.data;
  
  const elevenLabsApiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${validatedVoiceId}`;
  const headers = {
    'Accept': 'audio/mpeg',
    'Content-Type': 'application/json',
    'XI-API-KEY': apiKeyFromEnv, // Already confirmed this is present
  };

  const body: Record<string, any> = {
    text: validatedText,
    model_id: validatedModelId || "eleven_multilingual_v2", 
  };

  const voice_settings: Record<string, any> = {};
  if (stability !== undefined) voice_settings.stability = stability;
  if (similarity_boost !== undefined) voice_settings.similarity_boost = similarity_boost;
  if (style !== undefined) voice_settings.style = style; 
  if (use_speaker_boost !== undefined) voice_settings.use_speaker_boost = use_speaker_boost;
  
  if (Object.keys(voice_settings).length > 0) {
    body.voice_settings = voice_settings;
  }
  
  console.log('[ElevenLabs Action] Calling API URL:', elevenLabsApiUrl);
  console.log('[ElevenLabs Action] Request Headers (API Key Redacted):', JSON.stringify(headers, (key, value) => key === 'XI-API-KEY' ? 'REDACTED' : value));
  console.log('[ElevenLabs Action] Request body:', JSON.stringify(body));

  try {
    const response = await fetch(elevenLabsApiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    });

    console.log(`[ElevenLabs Action] API Response Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      let errorResponseText = await response.text(); 
      console.error('[ElevenLabs Action] API Error Response Body:', errorResponseText);
      
      let errorDetailMessage = 'Unknown error from ElevenLabs API';
      try {
        const errorBodyJson = JSON.parse(errorResponseText);
        if (errorBodyJson.detail && typeof errorBodyJson.detail.message === 'string') {
            errorDetailMessage = errorBodyJson.detail.message;
        } else if (errorBodyJson.detail && Array.isArray(errorBodyJson.detail) && errorBodyJson.detail.length > 0 && typeof errorBodyJson.detail[0].msg === 'string') {
            errorDetailMessage = errorBodyJson.detail[0].msg; 
        } else if (errorBodyJson.detail && typeof errorBodyJson.detail === 'string') {
            errorDetailMessage = errorBodyJson.detail;
        } else {
            errorDetailMessage = JSON.stringify(errorBodyJson); // Fallback to stringifying the detail object
        }
      } catch (e) {
        // If parsing errorBodyJson fails, use the raw text, truncated
        errorDetailMessage = errorResponseText.substring(0, 500) + (errorResponseText.length > 500 ? "..." : ""); 
      }
      
      return { error: `ElevenLabs API Error (${response.status}): ${errorDetailMessage}`, success: false };
    }

    const audioBuffer = await response.arrayBuffer();
    if (audioBuffer.byteLength === 0) {
        console.warn('[ElevenLabs Action] Received empty audio buffer from ElevenLabs.');
        return { error: 'ElevenLabs returned empty audio. The input text might be too short or contain unsupported characters.', success: false };
    }
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    console.log('[ElevenLabs Action] Speech synthesis successful. Audio data URI to be returned (length approx):', `data:audio/mpeg;base64,${audioBase64}`.length);
    return { audioBase64: audioBase64, success: true };

  } catch (error) {
    console.error('[ElevenLabs Action] General error during external fetch or response processing (e.g., network issue, DNS, malformed response from ElevenLabs):', error);
    let errorMessage = 'Failed to connect to ElevenLabs API or process its response. ';
    if (error instanceof Error) {
        errorMessage += error.message;
        if (error.cause) { 
            errorMessage += ` Cause: ${JSON.stringify(error.cause)}`;
        }
    } else {
        errorMessage += String(error);
    }
    return { error: errorMessage, success: false };
  }
}
