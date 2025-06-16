
'use server';

import { z } from 'zod';
import type { DeepgramTranscriptionState, TranscriberConfig } from '@/types';

const DeepgramRequestSchema = z.object({
  audioDataUri: z.string().startsWith('data:audio/', { message: 'Audio data URI is required and must be valid.' }),
  model: z.string().optional().default('nova-2'),
  language: z.string().optional().default('en-US'),
  punctuate: z.boolean().optional().default(true),
  smart_format: z.boolean().optional().default(true),
  keywords: z.string().optional(), // For custom vocabulary, joined by ':'
});

export async function transcribeDeepgramAudio(
  prevState: DeepgramTranscriptionState,
  formData: FormData
): Promise<DeepgramTranscriptionState> {
  console.log('[Deepgram Action] Received FormData keys:', Array.from(formData.keys()));
  const audioDataUri = formData.get('audioDataUri') as string;
  const model = formData.get('model') as string || 'nova-2';
  const language = formData.get('language') as string || 'en-US';
  const punctuate = formData.get('punctuate') === 'true'; 
  const smart_format = formData.get('smart_format') === 'true';
  const keywords = formData.get('keywords') as string || undefined; // Expect colon-separated string

  console.log('[Deepgram Action] Parsed FormData values:');
  console.log('[Deepgram Action] - audioDataUri (first 100 chars):', audioDataUri?.substring(0, 100));
  console.log('[Deepgram Action] - model:', model);
  console.log('[Deepgram Action] - language:', language);
  console.log('[Deepgram Action] - punctuate:', punctuate);
  console.log('[Deepgram Action] - smart_format:', smart_format);
  console.log('[Deepgram Action] - keywords:', keywords);

  const validatedFields = DeepgramRequestSchema.safeParse({
    audioDataUri,
    model,
    language,
    punctuate,
    smart_format,
    keywords,
  });

  if (!validatedFields.success) {
    console.error('[Deepgram Action] Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Invalid input: ' + (validatedFields.error.flatten().fieldErrors.audioDataUri?.join(', ') || JSON.stringify(validatedFields.error.flatten().fieldErrors)),
      success: false,
    };
  }
  
  console.log('[Deepgram Action] Validated fields:', validatedFields.data);

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error('[Deepgram Action] Deepgram API key is not configured.');
    return { error: 'Deepgram API key is not configured on the server.', success: false };
  }

  try {
    const parts = validatedFields.data.audioDataUri.split(',');
    if (parts.length !== 2) {
        console.error('[Deepgram Action] Invalid audio data URI format. Expected 2 parts, got:', parts.length);
        throw new Error('Invalid audio data URI format. Ensure it starts with data:<mimetype>;base64,<encoded_data>');
    }
    const mimeTypePartHeader = parts[0].split(':')[1]; 
    console.log('[Deepgram Action] Full MimeTypePartHeader from client:', mimeTypePartHeader);
    const mimeTypePart = mimeTypePartHeader.split(';')[0]; 
    const base64Data = parts[1];

    console.log('[Deepgram Action] Extracted MimeType for Content-Type header:', mimeTypePart);
    if (!mimeTypePart || !base64Data) {
        console.error('[Deepgram Action] Failed to extract MimeType or Base64 data from URI.');
        throw new Error('Failed to parse audio data URI. MimeType or data missing.');
    }

    const audioBuffer = Buffer.from(base64Data, 'base64');
    console.log('[Deepgram Action] Audio Buffer Length:', audioBuffer.length);

    if (audioBuffer.length === 0) {
        console.error('[Deepgram Action] Audio buffer is empty after base64 decoding.');
        return { error: 'Audio data is empty after processing. Recording might be too short or silent.', success: false };
    }

    const queryParams = new URLSearchParams({
        model: validatedFields.data.model,
        language: validatedFields.data.language,
        punctuate: String(validatedFields.data.punctuate),
        smart_format: String(validatedFields.data.smart_format),
    });

    if (validatedFields.data.keywords) {
        // Deepgram expects keywords multiple times: &keywords=term1&keywords=term2
        // URLSearchParams typically joins multiple same keys with commas, check Deepgram docs if this is an issue.
        // For simple cases, split and append manually if direct append doesn't work as expected by Deepgram.
        // The current `keywords` field in FormData is a single colon-separated string.
        // We'll split it and add each keyword.
        const keywordArray = validatedFields.data.keywords.split(':');
        keywordArray.forEach(kw => {
            if (kw.trim()) queryParams.append('keywords', kw.trim());
        });
        console.log('[Deepgram Action] Added keywords to queryParams:', validatedFields.data.keywords);
    }

    const deepgramApiUrl = `https://api.deepgram.com/v1/listen?${queryParams.toString()}`;
    
    console.log('[Deepgram Action] Calling API URL:', deepgramApiUrl);
    
    const response = await fetch(deepgramApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': mimeTypePart, 
        'Accept': 'application/json',
      },
      body: audioBuffer,
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error(`[Deepgram Action] API Error Status: ${response.status} ${response.statusText}`);
      console.error('[Deepgram Action] API Error Response Body:', JSON.stringify(responseData, null, 2));
      const errorMessage = responseData.err_msg || responseData.reason || responseData.error || JSON.stringify(responseData) || 'Unknown error from Deepgram API';
      return { error: `Deepgram API Error (${response.status}): ${errorMessage}`, success: false };
    }

    console.log('[Deepgram Action] API Success Response:', JSON.stringify(responseData, null, 2));

    if (responseData.results && responseData.results.channels && responseData.results.channels.length > 0 &&
        responseData.results.channels[0].alternatives && responseData.results.channels[0].alternatives.length > 0) {
      const transcript = responseData.results.channels[0].alternatives[0].transcript;
      if (transcript && transcript.trim().length > 0) {
        console.log('[Deepgram Action] Transcription successful:', transcript);
        return { transcribedText: transcript, success: true };
      } else {
        console.log('[Deepgram Action] Transcription successful but received empty transcript.');
        return { transcribedText: "", success: true }; 
      }
    } else {
      console.warn('[Deepgram Action] Transcription response did not contain expected transcript structure. Full response:', JSON.stringify(responseData, null, 2));
      return { error: 'Transcription failed: No transcript in response structure.', success: false };
    }
  } catch (error) {
    console.error('[Deepgram Action] General error during transcription:', error);
    let errorMessage = 'Failed to process audio transcription. ';
    if (error instanceof Error) {
        errorMessage += error.message;
    } else {
        errorMessage += String(error);
    }
    return { error: errorMessage, success: false };
  }
}
