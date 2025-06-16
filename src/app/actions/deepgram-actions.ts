
'use server';

import { z } from 'zod';
import type { DeepgramTranscriptionState, TranscriberConfig } from '@/types';

const DeepgramRequestSchema = z.object({
  audioDataUri: z.string().startsWith('data:audio/', { message: 'Audio data URI is required and must be valid.' }),
  model: z.string().optional().default('nova-2'),
  language: z.string().optional().default('en-US'),
  punctuate: z.boolean().optional().default(true),
  smart_format: z.boolean().optional().default(true),
  // Add other Deepgram parameters as needed based on TranscriberConfig
});

export async function transcribeDeepgramAudio(
  prevState: DeepgramTranscriptionState,
  formData: FormData
): Promise<DeepgramTranscriptionState> {
  const audioDataUri = formData.get('audioDataUri') as string;
  const model = formData.get('model') as string || 'nova-2';
  const language = formData.get('language') as string || 'en-US';
  const punctuate = formData.get('punctuate') === 'true'; // FormData values are strings
  const smart_format = formData.get('smart_format') === 'true';


  const validatedFields = DeepgramRequestSchema.safeParse({
    audioDataUri,
    model,
    language,
    punctuate,
    smart_format,
  });

  if (!validatedFields.success) {
    console.error('Deepgram Action Validation Error:', validatedFields.error.flatten().fieldErrors);
    return {
      error: 'Invalid input: ' + (validatedFields.error.flatten().fieldErrors.audioDataUri?.join(', ') || 'Unknown validation error'),
      success: false,
    };
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    console.error('Deepgram API key is not configured.');
    return { error: 'Deepgram API key is not configured on the server.', success: false };
  }

  try {
    // Extract base64 data and mimeType from data URI
    const parts = validatedFields.data.audioDataUri.split(',');
    if (parts.length !== 2) throw new Error('Invalid audio data URI format');
    const mimeTypePart = parts[0].split(':')[1].split(';')[0];
    const base64Data = parts[1];
    const audioBuffer = Buffer.from(base64Data, 'base64');

    const deepgramApiUrl = `https://api.deepgram.com/v1/listen?model=${validatedFields.data.model}&language=${validatedFields.data.language}&punctuate=${validatedFields.data.punctuate}&smart_format=${validatedFields.data.smart_format}`;
    
    console.log('[Deepgram Action] Calling API:', deepgramApiUrl);
    // console.log('[Deepgram Action] Audio Buffer Length:', audioBuffer.length); // Sensitive, log length only

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
      console.error('[Deepgram Action] API Error Status:', response.status);
      console.error('[Deepgram Action] API Error Response:', responseData);
      const errorMessage = responseData.err_msg || responseData.reason || 'Unknown error from Deepgram API';
      return { error: `Deepgram API Error: ${response.status} - ${errorMessage}`, success: false };
    }

    if (responseData.results && responseData.results.channels && responseData.results.channels.length > 0 &&
        responseData.results.channels[0].alternatives && responseData.results.channels[0].alternatives.length > 0) {
      const transcript = responseData.results.channels[0].alternatives[0].transcript;
      if (transcript && transcript.trim().length > 0) {
        console.log('[Deepgram Action] Transcription successful:', transcript);
        return { transcribedText: transcript, success: true };
      } else {
        console.log('[Deepgram Action] Transcription successful but received empty transcript.');
        return { transcribedText: "", success: true }; // Success but empty
      }
    } else {
      console.warn('[Deepgram Action] Transcription response did not contain expected transcript structure:', responseData);
      return { error: 'Transcription failed: No transcript in response.', success: false };
    }
  } catch (error) {
    console.error('[Deepgram Action] Failed to transcribe audio:', error);
    return { error: 'Failed to connect to Deepgram API. ' + (error instanceof Error ? error.message : String(error)), success: false };
  }
}
