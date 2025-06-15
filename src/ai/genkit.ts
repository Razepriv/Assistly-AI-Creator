import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openai} from '@genkit-ai/openai'; // Import the OpenAI plugin - Temporarily removed

export const ai = genkit({
  plugins: [
    googleAI(),
    // openai() // Add the OpenAI plugin - Temporarily removed
  ],
  model: 'googleai/gemini-pro', // Defaulting to a Google AI model
  // You can also specify models per-provider in flows if needed, e.g., model: 'googleai/gemini-1.5-flash-latest'
});
