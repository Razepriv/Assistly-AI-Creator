import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  model: 'googleai/gemini-pro', // Defaulting to a Google AI model
  // You can also specify models per-provider in flows if needed, e.g., model: 'googleai/gemini-1.5-flash-latest'
});
