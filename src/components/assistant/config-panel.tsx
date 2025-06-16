
"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelConfigTab from './model-config-tab';
import AdvancedSettingsTab from './advanced-settings-tab';
import VoiceSettingsTab from './voice-settings-tab';
import TranscriberSettingsTab from './transcriber-settings-tab';
import { useForm, FormProvider } from 'react-hook-form';
import type { AssistantConfig } from '@/types';
import { useConfigStore } from '@/store/config-store';
// import { useAssistantStore } from '@/store/assistant-store'; // Not directly used for name, editable name handles that
import { Button } from '@/components/ui/button';
import { Save, Settings2, SlidersHorizontal, Puzzle, BarChart2, Info, Mic2, Mic } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DEFAULT_ASSISTANT_CONFIG, DEFAULT_VOICE_CONFIG, DEFAULT_TRANSCRIBER_CONFIG } from '@/lib/constants';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Zod schema for VoiceConfig
const voiceConfigSchema = z.object({
  provider: z.string().min(1, "Voice provider is required"),
  voiceId: z.string().min(1, "Voice selection is required"),
  language: z.string().min(1, "Language is required"),
  backgroundSound: z.enum(['default', 'office', 'cafe', 'nature', 'white_noise_brown', 'white_noise_pink', 'custom']),
  backgroundSoundUrl: z.string().url("Must be a valid URL if custom sound is selected and URL is provided").optional().or(z.literal('')),
  backgroundVolume: z.number().min(0).max(1),
  loopBackgroundSound: z.boolean(),
  inputMinCharacters: z.number().min(0).int("Must be an integer"),
  speakingRate: z.number().min(0.5).max(2.0),
  pitch: z.number().min(0.5).max(2.0),
  masterVolume: z.number().min(0).max(1),
  punctuationBoundaries: z.array(z.string()).default(['.', '?', '!']),
  customPunctuation: z.array(z.string()).default([]),
  pauseDurations: z.object({
      comma: z.number().default(150),
      period: z.number().default(300),
      semicolon: z.number().default(250),
  }).default({ comma: 150, period: 300, semicolon: 250 }),
  smartChunking: z.boolean().default(true),
  emotion: z.string().default('neutral'),
  tone: z.string().default('neutral'),
  voiceEffects: z.object({
      echo: z.boolean().default(false),
      reverb: z.boolean().default(false),
      clarityEnhancement: z.boolean().default(true),
  }).default({ echo: false, reverb: false, clarityEnhancement: true }),
  noiseReduction: z.boolean().default(false),
  audioQuality: z.object({
      bitrate: z.number().default(128),
      sampleRate: z.number().default(24000),
  }).default({ bitrate: 128, sampleRate: 24000 }),
}).default(DEFAULT_VOICE_CONFIG).refine(data => {
    if (data.backgroundSound === 'custom' && (!data.backgroundSoundUrl || data.backgroundSoundUrl.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: "Custom background sound URL is required when 'Custom URL' is selected.",
    path: ["backgroundSoundUrl"],
});


const transcriberConfigSchema = z.object({
  provider: z.enum(['deepgram', 'openai', 'assemblyai']).default('deepgram'),
  model: z.string().min(1, "Transcriber model is required"),
  language: z.string().min(1, "Transcriber language is required"),
  autoDetectLanguage: z.boolean().default(false),
  smartFormatting: z.object({
    enabled: z.boolean().default(true),
    punctuation: z.boolean().default(true),
    capitalization: z.boolean().default(true),
    speakerLabels: z.boolean().default(false),
    fillerWordRemoval: z.boolean().default(false),
    profanityFilter: z.boolean().default(false),
  }).default(DEFAULT_TRANSCRIBER_CONFIG.smartFormatting),
  audioProcessing: z.object({
    backgroundDenoising: z.boolean().default(false),
    denoisingIntensity: z.enum(['light', 'medium', 'strong']).default('medium'),
    volumeNormalization: z.boolean().default(false),
    echoCancellation: z.boolean().default(false),
  }).default(DEFAULT_TRANSCRIBER_CONFIG.audioProcessing),
  qualityControl: z.object({
    confidenceThreshold: z.number().min(0).max(1).default(0.85),
    minWordLength: z.number().min(0).int("Min word length must be an integer").default(0),
    customVocabulary: z.array(z.string()).optional().default([]),
    filterLowConfidence: z.boolean().default(false),
  }).default(DEFAULT_TRANSCRIBER_CONFIG.qualityControl),
}).default(DEFAULT_TRANSCRIBER_CONFIG);


const assistantConfigSchema = z.object({
  id: z.string(),
  assistantName: z.string().min(1, "Assistant name is required"),
  provider: z.literal("openai"), // Only OpenAI for LLM provider for now
  model: z.string().min(1, "Model selection is required"),
  firstMessage: z.string().min(1, "First message is required"),
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
  maxTokens: z.number().min(1, "Max tokens must be at least 1").max(16384, "Max tokens cannot exceed 16384").int("Max tokens must be an integer"),
  temperature: z.number().min(0).max(1),
  files: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      size: z.number().max(MAX_FILE_SIZE_BYTES, `File size cannot exceed ${MAX_FILE_SIZE_MB}MB`),
      dataUri: z.string().optional(),
    })
  ).max(MAX_FILES, `Cannot upload more than ${MAX_FILES} files`).optional().default([]),
  systemPromptEnforcement: z.object({
    enabled: z.boolean().default(false),
    level: z.string().optional().default("moderate"),
  }).optional().default({ enabled: false, level: "moderate" }),
  voice: voiceConfigSchema, // Use the detailed voice schema
  transcriber: transcriberConfigSchema, // Use the detailed transcriber schema
  toolsIntegrations: z.record(z.any()).optional(),
  analysisSettings: z.record(z.any()).optional(),
});


interface ConfigPanelProps {
  assistantId: string;
}

export default function ConfigPanel({ assistantId }: ConfigPanelProps) {
  const { toast } = useToast();
  const getConfig = useConfigStore((state) => state.getConfig);
  const updateConfig = useConfigStore((state) => state.updateConfig);

  const initialConfigData = getConfig(assistantId);

  const initialConfig = useMemo(() => {
    if (!initialConfigData) return undefined;
    // Use Zod to parse and apply defaults, ensuring a complete object for the form.
    // This helps stabilize the initialConfig object reference.
    try {
      const parsedConfig = assistantConfigSchema.parse(initialConfigData);
      return parsedConfig;
    } catch (e) {
      console.error("Zod parsing error for initialConfigData:", e);
      // Fallback to a structure that at least has id and name, plus defaults
      // This might happen if localStorage data is malformed or outdated.
      return {
        id: initialConfigData.id,
        assistantName: initialConfigData.assistantName,
        ...DEFAULT_ASSISTANT_CONFIG, // Apply full defaults
        voice: initialConfigData.voice || DEFAULT_VOICE_CONFIG, // Ensure voice is present
        transcriber: initialConfigData.transcriber || DEFAULT_TRANSCRIBER_CONFIG, // Ensure transcriber is present
      };
    }
  }, [initialConfigData]);

  const methods = useForm<AssistantConfig>({
    resolver: zodResolver(assistantConfigSchema),
    defaultValues: initialConfig || { ...DEFAULT_ASSISTANT_CONFIG, id: assistantId, assistantName: "Loading..." },
    mode: "onBlur",
  });

  const isResetting = useRef(false);

  useEffect(() => {
    if (initialConfig) {
      isResetting.current = true;
      methods.reset(initialConfig);
      queueMicrotask(() => { // Changed from setTimeout(0) to queueMicrotask
        isResetting.current = false;
      });
    }
  }, [initialConfig, methods]);


  useEffect(() => {
    const subscription = methods.watch((formValue, { name, type }) => {
      if (isResetting.current) {
        return;
      }
      // Auto-save on blur for specific fields, or on change for things like sliders/switches.
      // The exact logic here might need refinement based on desired UX for auto-saving.
      // For now, let's assume any "change" could be auto-saved.
      if (type === 'change' && name && assistantId) {
        // We need to be careful here to pass the correct nested structure if name is nested.
        let updatePayload: Partial<AssistantConfig> = {};

        if (name.startsWith('voice.')) {
            updatePayload.voice = formValue.voice;
        } else if (name.startsWith('transcriber.')) {
            updatePayload.transcriber = formValue.transcriber;
        } else if (name.startsWith('systemPromptEnforcement.')) {
            updatePayload.systemPromptEnforcement = formValue.systemPromptEnforcement;
        }
         else {
          const fieldNameKey = name as keyof AssistantConfig;
          // @ts-ignore - formValue might not be a perfect Partial<AssistantConfig> here, but RHF handles types.
          updatePayload[fieldNameKey] = formValue[fieldNameKey];
        }

        if (Object.keys(updatePayload).length > 0) {
             updateConfig(assistantId, updatePayload);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, updateConfig, assistantId]);


  const onSubmit = (data: AssistantConfig) => {
    const validatedData = assistantConfigSchema.parse(data); // Re-validate and ensure defaults
    updateConfig(assistantId, validatedData);
    toast({
      title: "Configuration Saved",
      description: `Settings for "${validatedData.assistantName}" have been successfully saved.`,
    });
  };

  const handleSave = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      // RHF's handleSubmit will pass the latest form values, already validated.
      methods.handleSubmit(onSubmit)();
    } else {
      const errors = methods.formState.errors;
      let errorMessage = "Please check the form for errors.";

      const findFirstErrorMessage = (obj: any, path: string = ''): string | null => {
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          if (obj[key] && typeof obj[key].message === 'string') {
            return `${obj[key].message} (Field: ${currentPath})`;
          }
          if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) { // Avoid iterating array indices
            const nestedMessage = findFirstErrorMessage(obj[key], currentPath);
            if (nestedMessage) return nestedMessage;
          }
        }
        return null;
      };

      const specificError = findFirstErrorMessage(errors);
      if (specificError) {
        errorMessage = specificError;
      } else if (errors.root?.message) {
        errorMessage = errors.root.message;
      }


      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
       console.error("Validation errors:", errors);
    }
  };

  if (!initialConfig) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-8">
        <div className="text-center">
          <Info className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Loading Assistant Configuration...</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Please wait or select an assistant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <div className="h-full flex flex-col"> {/* Ensure no onSubmit prop here */}
        <Tabs defaultValue="model" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-1">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 h-auto p-1 bg-muted rounded-lg">
              <TabsTrigger value="model" className="flex-col md:flex-row h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
                <Settings2 className="md:mr-2 h-5 w-5" /> Model
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-col md:flex-row h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
                <SlidersHorizontal className="md:mr-2 h-5 w-5" /> Advanced
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex-col md:flex-row h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
                 <Mic2 className="md:mr-2 h-5 w-5" /> Voice
              </TabsTrigger>
              <TabsTrigger value="transcriber" className="flex-col md:flex-row h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
                <Mic className="md:mr-2 h-5 w-5" /> Transcriber
              </TabsTrigger>
              <TabsTrigger value="tools" disabled className="flex-col md:flex-row h-auto py-2"><Puzzle className="md:mr-2 h-5 w-5" /> Tools</TabsTrigger>
              <TabsTrigger value="analysis" disabled className="flex-col md:flex-row h-auto py-2"><BarChart2 className="md:mr-2 h-5 w-5" /> Analysis</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            <TabsContent value="model" className="mt-0">
              <ModelConfigTab />
            </TabsContent>
            <TabsContent value="advanced" className="mt-0">
              <AdvancedSettingsTab />
            </TabsContent>
            <TabsContent value="voice" className="mt-0">
              <VoiceSettingsTab />
            </TabsContent>
            <TabsContent value="transcriber" className="mt-0">
              <TranscriberSettingsTab />
            </TabsContent>
            <TabsContent value="tools" className="mt-0"><div className="p-4 text-center text-muted-foreground">Tools & Integrations coming soon.</div></TabsContent>
            <TabsContent value="analysis" className="mt-0"><div className="p-4 text-center text-muted-foreground">Analysis settings coming soon.</div></TabsContent>
          </div>
        </Tabs>

        <div className="mt-auto p-4 border-t bg-background sticky bottom-0">
          <Button type="button" onClick={handleSave} size="lg" className="w-full md:w-auto">
            <Save className="mr-2 h-5 w-5" />
            Save Configuration
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}
