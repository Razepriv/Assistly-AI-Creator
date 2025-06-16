
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
// Using aliased import for types from '@/types' to avoid naming conflicts with Zod-inferred types
import type { AssistantConfig as FullAssistantConfig, TestChatMessage as FullTestChatMessage, TestAssistantChatInput as FullTestAssistantChatInput, TestAssistantChatOutput as FullTestAssistantChatOutput } from '@/types';

// Zod schema for AssistantConfig (subset of FullAssistantConfig, only fields needed by the flow)
const AssistantConfigSchema = z.object({
  id: z.string(),
  assistantName: z.string(),
  provider: z.literal("openai"),
  model: z.string(),
  firstMessage: z.string(), // Though not used in this prompt, part of the broader config
  systemPrompt: z.string(),
  maxTokens: z.number(),
  temperature: z.number(),
  // Ensure other fields from FullAssistantConfig are optional or handled if needed by the flow/prompt
  files: z.array(z.object({ name: z.string(), type: z.string(), size: z.number(), dataUri: z.string().optional() })).optional().default([]),
  voice: z.any().optional(), // Using z.any() for simplicity as voice config is complex and not used here
  transcriber: z.any().optional(), // Same for transcriber
  systemPromptEnforcement: z.object({ enabled: z.boolean(), level: z.string().optional() }).optional(),
  toolsIntegrations: z.record(z.any()).optional(),
  analysisSettings: z.record(z.any()).optional(),
});

const TestChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  isThinking: z.boolean().optional(),
});

// This Zod schema defines the input for the Genkit flow and prompt
const TestAssistantChatInputSchemaInternal = z.object({
  userInput: z.string().describe('The current message from the user.'),
  assistantConfig: AssistantConfigSchema.describe('The configuration of the assistant being tested.'),
  chatHistory: z.array(TestChatMessageSchema).describe('The history of the current test conversation.'),
});
// Type alias for Zod-inferred type
type TestAssistantChatInputInternal = z.infer<typeof TestAssistantChatInputSchemaInternal>;

const TestAssistantChatOutputSchemaInternal = z.object({
  assistantResponse: z.string().describe("The assistant's generated response."),
});
// Type alias for Zod-inferred type
type TestAssistantChatOutputInternal = z.infer<typeof TestAssistantChatOutputSchemaInternal>;


// Exported function uses types from '@/types'
export async function testAssistantChat(input: FullTestAssistantChatInput): Promise<FullTestAssistantChatOutput> {
  // The input here is FullTestAssistantChatInput.
  // When passed to testAssistantChatFlow, Zod will parse it against TestAssistantChatInputSchemaInternal.
  return testAssistantChatFlow(input as any); // Cast as any to satisfy Genkit's stricter Zod type, parsing handles it.
}

const testAssistantChatPromptDefinition = ai.definePrompt({
  name: 'testAssistantChatPrompt',
  input: { schema: TestAssistantChatInputSchemaInternal },
  output: { schema: TestAssistantChatOutputSchemaInternal },
  prompt: (input: TestAssistantChatInputInternal) => {
    let historySegment = '';
    if (input.chatHistory && input.chatHistory.length > 0) {
      historySegment = 'Previous conversation:\n';
      historySegment += input.chatHistory
        .map(msg => {
          if (msg.role === 'user') {
            return `User: ${msg.content}`;
          }
          if (msg.role === 'assistant') {
            return `Assistant: ${msg.content}`;
          }
          return null; 
        })
        .filter(Boolean) 
        .join('\n');
      historySegment += '\n'; 
    }

    // Construct the full prompt string programmatically
    const fullPrompt = `
System Prompt: ${input.assistantConfig.systemPrompt}

${historySegment}Current User Input: ${input.userInput}

Assistant Response:
`;
    // Trim to remove leading/trailing whitespace from the template literal itself
    return fullPrompt.trim();
  },
  configBuilder: (input: TestAssistantChatInputInternal) => {
    return {
      model: input.assistantConfig.model,
      temperature: input.assistantConfig.temperature,
      maxOutputTokens: input.assistantConfig.maxTokens,
    };
  },
});

const testAssistantChatFlow = ai.defineFlow(
  {
    name: 'testAssistantChatFlow',
    inputSchema: TestAssistantChatInputSchemaInternal,
    outputSchema: TestAssistantChatOutputSchemaInternal,
  },
  async (input: TestAssistantChatInputInternal) : Promise<TestAssistantChatOutputInternal> => {
    const { output } = await testAssistantChatPromptDefinition(input);
    if (!output) {
      return { assistantResponse: "I'm sorry, I couldn't generate a response." };
    }
    return output;
  }
);

