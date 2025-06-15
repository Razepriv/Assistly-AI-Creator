'use server';

/**
 * @fileOverview An AI agent that suggests file uploads to improve an assistant's knowledge base.
 *
 * - suggestFileUploads - A function that suggests file uploads based on the assistant's configuration.
 * - SuggestFileUploadsInput - The input type for the suggestFileUploads function.
 * - SuggestFileUploadsOutput - The return type for the suggestFileUploads function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFileUploadsInputSchema = z.object({
  assistantName: z.string().describe('The name of the assistant.'),
  systemPrompt: z.string().describe('The system prompt of the assistant.'),
});
export type SuggestFileUploadsInput = z.infer<typeof SuggestFileUploadsInputSchema>;

const SuggestFileUploadsOutputSchema = z.object({
  suggestedFiles: z.array(
    z.object({
      filename: z.string().describe('The name of the suggested file.'),
      description: z.string().describe('A description of why this file is suggested.'),
    })
  ).describe('A list of suggested files to upload, with descriptions.'),
});
export type SuggestFileUploadsOutput = z.infer<typeof SuggestFileUploadsOutputSchema>;

export async function suggestFileUploads(input: SuggestFileUploadsInput): Promise<SuggestFileUploadsOutput> {
  return suggestFileUploadsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFileUploadsPrompt',
  input: {schema: SuggestFileUploadsInputSchema},
  output: {schema: SuggestFileUploadsOutputSchema},
  prompt: `You are an AI assistant that suggests files to upload to improve the performance of other AI assistants.

  You will be given the name of the assistant, and its system prompt.
  Based on this information, you will suggest files that would improve the assistant's knowledge base.

  Assistant Name: {{{assistantName}}}
  System Prompt: {{{systemPrompt}}}

  Consider what kind of knowledge would be helpful for this assistant, and suggest files that would provide that knowledge.
  For example, if the assistant is a customer service chatbot for a specific company, you might suggest files that contain information about the company's products and services.
  If the assistant is a medical assistant, you might suggest files that contain information about medical conditions and treatments.
  Return the output in the format specified by the SuggestFileUploadsOutputSchema schema definition.
  `,
});

const suggestFileUploadsFlow = ai.defineFlow(
  {
    name: 'suggestFileUploadsFlow',
    inputSchema: SuggestFileUploadsInputSchema,
    outputSchema: SuggestFileUploadsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
