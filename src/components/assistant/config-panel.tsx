
"use client";

import React, { useEffect, useRef, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelConfigTab from './model-config-tab';
import AdvancedSettingsTab from './advanced-settings-tab';
import VoiceSettingsTab from './voice-settings-tab';
import { useForm, FormProvider } from 'react-hook-form';
import type { AssistantConfig } from '@/types';
import { useConfigStore } from '@/store/config-store';
import { useAssistantStore } from '@/store/assistant-store';
import { Button } from '@/components/ui/button';
import { Save, Settings2, SlidersHorizontal, Puzzle, BarChart2, Info, Mic2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { DEFAULT_VOICE_CONFIG } from '@/lib/constants';

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

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
  voice: z.object({
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
  }).optional().default(DEFAULT_VOICE_CONFIG),
  toolsIntegrations: z.record(z.any()).optional(),
  analysisSettings: z.record(z.any()).optional(),
  transcriber: z.any().optional(),
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
      // This case handles when initialConfigData might still be undefined
      // but an assistant exists, meaning loadConfig should create it.
      // The next render cycle should pick up the new initialConfigData.
      const newConfData = loadConfig(assistantId, assistant.name);
      const newConfWithDefaults = { // Ensure voice defaults are applied here too
        ...newConfData,
        voice: newConfData.voice || DEFAULT_VOICE_CONFIG,
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
        } else {
          const fieldNameKey = name as keyof AssistantConfig;
          // @ts-ignore
          updateConfig(assistantId, { [fieldNameKey]: valueToUpdate });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, updateConfig, assistantId]);


  const onSubmit = (data: AssistantConfig) => {
    updateConfig(assistantId, data);
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
      const firstErrorKey = Object.keys(methods.formState.errors)[0];
      if (firstErrorKey) {
        const firstError = methods.formState.errors[firstErrorKey as keyof AssistantConfig];
        let errorMessage = "Please check the form for errors.";
        // @ts-ignore
        if(firstError && firstError.message) errorMessage = firstError.message;
        // @ts-ignore
        else if (firstError && typeof firstError === 'object' && firstErrorKey === 'voice') {
           // @ts-ignore
           const voiceErrorKey = Object.keys(firstError)[0];
           // @ts-ignore
           if (voiceErrorKey && firstError[voiceErrorKey] && firstError[voiceErrorKey].message) {
             // @ts-ignore
            errorMessage = `Voice setting error: ${firstError[voiceErrorKey].message}`;
           }
        }

        toast({
          title: "Validation Error",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
         toast({
          title: "Validation Error",
          description: "Please correct the errors in the form.",
          variant: "destructive",
        });
      }
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
              <TabsTrigger value="transcriber" disabled className="flex-col md:flex-row h-auto py-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:mr-2 lucide lucide-mic"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg> Transcriber</TabsTrigger>
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
            <TabsContent value="transcriber" className="mt-0"><div className="p-4 text-center text-muted-foreground">Transcriber options coming soon.</div></TabsContent>
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
