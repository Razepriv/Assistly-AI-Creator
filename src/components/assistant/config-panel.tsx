
"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelConfigTab from './model-config-tab';
import AdvancedSettingsTab from './advanced-settings-tab';
import VoiceSettingsTab from './voice-settings-tab';
import TranscriberSettingsTab from './transcriber-settings-tab'; // Import new tab
import { useForm, FormProvider } from 'react-hook-form';
import type { AssistantConfig } from '@/types';
import { useConfigStore } from '@/store/config-store';
import { useAssistantStore } from '@/store/assistant-store';
import { Button } from '@/components/ui/button';
import { Save, Settings2, SlidersHorizontal, Puzzle, BarChart2, Info, Mic2, Mic } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DEFAULT_VOICE_CONFIG, DEFAULT_TRANSCRIBER_CONFIG } from '@/lib/constants';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const voiceConfigSchema = z.object({
  provider: z.string().min(1, "Voice provider is required"),
  voiceId: z.string().min(1, "Voice selection is required"),
  language: z.string().min(1, "Language is required"),
  backgroundSound: z.enum(['default', 'office', 'cafe', 'nature', 'white_noise_brown', 'white_noise_pink', 'custom']),
  backgroundSoundUrl: z.string().url("Must be a valid URL if provided").optional().or(z.literal('')),
  backgroundVolume: z.number().min(0).max(1),
  loopBackgroundSound: z.boolean(),
  inputMinCharacters: z.number().min(0).int("Must be an integer"),
  speakingRate: z.number().min(0.5).max(2.0),
  pitch: z.number().min(0.5).max(2.0),
  masterVolume: z.number().min(0).max(1),
  punctuationBoundaries: z.array(z.string()).optional(),
  customPunctuation: z.array(z.string()).optional(),
  pauseDurations: z.object({
      comma: z.number().optional(),
      period: z.number().optional(),
      semicolon: z.number().optional(),
  }).optional(),
  smartChunking: z.boolean().optional(),
  emotion: z.string().optional(),
  tone: z.string().optional(),
  voiceEffects: z.object({
      echo: z.boolean().optional(),
      reverb: z.boolean().optional(),
      clarityEnhancement: z.boolean().optional(),
  }).optional(),
  noiseReduction: z.boolean().optional(),
  audioQuality: z.object({
      bitrate: z.number().optional(),
      sampleRate: z.number().optional(),
  }).optional(),
}).default(DEFAULT_VOICE_CONFIG);

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
  provider: z.literal("openai"),
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
  ).max(MAX_FILES, `Cannot upload more than ${MAX_FILES} files`).optional(),
  systemPromptEnforcement: z.object({
    enabled: z.boolean(),
    level: z.string().optional(),
  }).optional(),
  voice: voiceConfigSchema.optional(),
  transcriber: transcriberConfigSchema.optional(),
  toolsIntegrations: z.record(z.any()).optional(),
  analysisSettings: z.record(z.any()).optional(),
});


interface ConfigPanelProps {
  assistantId: string;
}

export default function ConfigPanel({ assistantId }: ConfigPanelProps) {
  const { toast } = useToast();
  const getConfig = useConfigStore((state) => state.getConfig);
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const updateConfig = useConfigStore((state) => state.updateConfig);
  const getAssistantById = useAssistantStore((state) => state.getAssistantById);

  const assistant = getAssistantById(assistantId);
  const initialConfigData = getConfig(assistantId) || (assistant ? loadConfig(assistantId, assistant.name) : undefined);

  const initialConfig = useMemo(() => {
    if (!initialConfigData) return undefined;
    return {
      ...initialConfigData,
      voice: initialConfigData.voice || DEFAULT_VOICE_CONFIG,
      transcriber: initialConfigData.transcriber || DEFAULT_TRANSCRIBER_CONFIG,
    };
  }, [initialConfigData]);

  const methods = useForm<AssistantConfig>({
    resolver: zodResolver(assistantConfigSchema),
    defaultValues: initialConfig,
    mode: "onBlur",
  });

  const isResetting = useRef(false);

  useEffect(() => {
    if (initialConfig) {
      isResetting.current = true;
      methods.reset(initialConfig);
      const timerId = setTimeout(() => { isResetting.current = false; }, 0);
      return () => clearTimeout(timerId);
    } else if (assistant && !initialConfigData) {
      const newConfData = loadConfig(assistantId, assistant.name);
      const newConfWithDefaults = { 
        ...newConfData,
        voice: newConfData.voice || DEFAULT_VOICE_CONFIG,
        transcriber: newConfData.transcriber || DEFAULT_TRANSCRIBER_CONFIG,
      };
      isResetting.current = true;
      methods.reset(newConfWithDefaults);
      const timerId = setTimeout(() => { isResetting.current = false; }, 0);
      return () => clearTimeout(timerId);
    }
  }, [assistantId, initialConfig, initialConfigData, methods, assistant, loadConfig]);


  useEffect(() => {
    const subscription = methods.watch((formValue, { name, type }) => {
      if (isResetting.current) {
        return; 
      }

      if (type === 'change' && name) {
        // @ts-ignore
        const valueToUpdate = formValue[name as keyof AssistantConfig];
         if (name.startsWith('systemPromptEnforcement.')) {
            updateConfig(assistantId, { systemPromptEnforcement: formValue.systemPromptEnforcement });
        } else if (name.startsWith('voice.')) {
            updateConfig(assistantId, { voice: formValue.voice });
        } else if (name.startsWith('transcriber.')) {
            updateConfig(assistantId, { transcriber: formValue.transcriber });
        }
         else {
          const fieldNameKey = name as keyof AssistantConfig;
          // @ts-ignore
          updateConfig(assistantId, { [fieldNameKey]: valueToUpdate });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, updateConfig, assistantId]);


  const onSubmit = (data: AssistantConfig) => {
    // Ensure defaults are applied if optional fields are missing before saving
    const dataToSave = {
      ...data,
      voice: data.voice || DEFAULT_VOICE_CONFIG,
      transcriber: data.transcriber || DEFAULT_TRANSCRIBER_CONFIG,
    };
    updateConfig(assistantId, dataToSave);
    toast({
      title: "Configuration Saved",
      description: `Settings for "${data.assistantName}" have been successfully saved.`,
    });
  };

  const handleSave = async () => {
    const isValid = await methods.trigger();
    if (isValid) {
      methods.handleSubmit(onSubmit)();
    } else {
      const errors = methods.formState.errors;
      const firstErrorKey = Object.keys(errors)[0] as keyof AssistantConfig | undefined;
      
      let errorMessage = "Please check the form for errors.";

      if (firstErrorKey) {
        const errorField = errors[firstErrorKey];
        if (errorField && 'message' in errorField && typeof errorField.message === 'string') {
          errorMessage = errorField.message;
        } else if (firstErrorKey === 'voice' && errorField && typeof errorField === 'object') {
            const voiceErrorKey = Object.keys(errorField)[0] as keyof AssistantConfig['voice'];
            // @ts-ignore
            if (voiceErrorKey && errorField[voiceErrorKey] && errorField[voiceErrorKey].message) {
                // @ts-ignore
                errorMessage = `Voice setting error: ${errorField[voiceErrorKey].message}`;
            }
        } else if (firstErrorKey === 'transcriber' && errorField && typeof errorField === 'object') {
            const transcriberErrorKey = Object.keys(errorField)[0] as keyof AssistantConfig['transcriber'];
            // @ts-ignore
            if (transcriberErrorKey && errorField[transcriberErrorKey] && errorField[transcriberErrorKey].message) {
                // @ts-ignore
                errorMessage = `Transcriber setting error: ${errorField[transcriberErrorKey].message}`;
            // @ts-ignore
            } else if (transcriberErrorKey && errorField[transcriberErrorKey] && typeof errorField[transcriberErrorKey] === 'object') {
                // Handle nested objects within transcriber, e.g., smartFormatting
                // @ts-ignore
                const nestedErrorKey = Object.keys(errorField[transcriberErrorKey])[0];
                // @ts-ignore
                if (nestedErrorKey && errorField[transcriberErrorKey][nestedErrorKey] && errorField[transcriberErrorKey][nestedErrorKey].message) {
                    // @ts-ignore
                    errorMessage = `Transcriber error (${transcriberErrorKey}): ${errorField[transcriberErrorKey][nestedErrorKey].message}`;
                }
            }
        }
      }

      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (!initialConfig) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-8">
        <div className="text-center">
          <Info className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Loading Assistant Configuration...</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            If this persists, the assistant might not exist or there was an issue loading its settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col">
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
      </form>
    </FormProvider>
  );
}
