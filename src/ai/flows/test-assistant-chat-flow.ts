
'use server';
/**
 * @fileOverview A Genkit flow for handling test chats with an assistant.
 *
 * - testAssistantChat - A function that generates a response from the assistant.
 * - TestAssistantChatInput - The input type for the testAssistantChat function.
 * - TestAssistantChatOutput - The return type for the testAssistantChat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { TestAssistantChatInput, TestAssistantChatOutput, AssistantConfig, TestChatMessage } from '@/types';

// Zod schema for AssistantConfig (simplified for flow input, actual config can be richer)
const AssistantConfigSchema = z.object({
  id: z.string(),
  assistantName: z.string(),
  provider: z.literal("openai"),
  model: z.string(),
  firstMessage: z.string(),
  systemPrompt: z.string(),
  maxTokens: z.number(),
  temperature: z.number(),
  // files and other detailed configs are not directly used by the LLM prompt in this basic chat flow
  // but are part of the AssistantConfig type. We only strictly need what the prompt uses.
});

const TestChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  isThinking: z.boolean().optional(),
});

const TestAssistantChatInputSchema = z.object({
  userInput: z.string().describe('The current message from the user.'),
  assistantConfig: AssistantConfigSchema.describe('The configuration of the assistant being tested.'),
  chatHistory: z.array(TestChatMessageSchema).describe('The history of the current test conversation.'),
});

const TestAssistantChatOutputSchema = z.object({
  assistantResponse: z.string().describe("The assistant's generated response."),
});

export async function testAssistantChat(input: TestAssistantChatInput): Promise<TestAssistantChatOutput> {
  return testAssistantChatFlow(input);
}

const systemPromptTemplate = `System Prompt: {{{assistantConfig.systemPrompt}}}`;

const historyTemplate = `
{{#if chatHistory.length}}
Previous conversation:
{{#each chatHistory}}
{{#if (eq this.role "user")}}User: {{this.content}}{{/if}}
{{#if (eq this.role "assistant")}}Assistant: {{this.content}}{{/if}}
{{/each}}
{{/if}}`;

const currentUserInputTemplate = `Current User Input: {{{userInput}}}`;

const prompt = ai.definePrompt({
  name: 'testAssistantChatPrompt',
  input: { schema: TestAssistantChatInputSchema },
  output: { schema: TestAssistantChatOutputSchema },
  // Constructing the prompt string to send to the LLM
  // The order is important: System instructions, then history, then current input.
  prompt: `
${systemPromptTemplate}

${historyTemplate}

${currentUserInputTemplate}

Assistant Response:
`,
  // We can pass model and other generation config directly from the assistant's config
  configBuilder: (input) => {
    return {
      model: input.assistantConfig.model,
      temperature: input.assistantConfig.temperature,
      maxOutputTokens: input.assistantConfig.maxTokens,
      // stopSequences: ... if needed
    };
  },
});

const testAssistantChatFlow = ai.defineFlow(
  {
    name: 'testAssistantChatFlow',
    inputSchema: TestAssistantChatInputSchema,
    outputSchema: TestAssistantChatOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      // This case should ideally be handled by Zod schema validation or prompt output validation
      // but as a fallback:
      return { assistantResponse: "I'm sorry, I couldn't generate a response." };
    }
    return output;
  }
);
