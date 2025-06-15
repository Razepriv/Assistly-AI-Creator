"use client";

import React, { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ModelConfigTab from './model-config-tab';
import AdvancedSettingsTab from './advanced-settings-tab';
import { useForm, FormProvider } from 'react-hook-form';
import type { AssistantConfig } from '@/types';
import { useConfigStore } from '@/store/config-store';
import { useAssistantStore } from '@/store/assistant-store';
import { Button } from '@/components/ui/button';
import { Save, Settings2, SlidersHorizontal, Puzzle, BarChart2, Info } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Basic Zod schema for validation example
const assistantConfigSchema = z.object({
  id: z.string(),
  assistantName: z.string().min(1, "Assistant name is required"),
  provider: z.literal("openai"),
  model: z.string().min(1, "Model selection is required"),
  firstMessage: z.string().min(1, "First message is required"),
  systemPrompt: z.string().min(10, "System prompt must be at least 10 characters"),
  maxTokens: z.number().min(1, "Max tokens must be at least 1").max(16384, "Max tokens cannot exceed 16384"),
  temperature: z.number().min(0).max(1),
  files: z.array(z.object({ name: z.string(), type: z.string(), size: z.number() })).optional(),
  systemPromptEnforcement: z.object({
    enabled: z.boolean(),
    level: z.string().optional(),
  }).optional(),
  toolsIntegrations: z.record(z.any()).optional(),
  analysisSettings: z.record(z.any()).optional(),
  voice: z.any().optional(), // Placeholder for voice config schema
  transcriber: z.any().optional(), // Placeholder for transcriber config schema
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
  const initialConfig = getConfig(assistantId) || (assistant ? loadConfig(assistantId, assistant.name) : undefined);
  
  const methods = useForm<AssistantConfig>({
    resolver: zodResolver(assistantConfigSchema),
    defaultValues: initialConfig,
  });

  useEffect(() => {
    if (initialConfig) {
      methods.reset(initialConfig);
    } else if (assistant && !initialConfig) {
      // This case might happen if config was deleted but assistant exists
      const newConf = loadConfig(assistantId, assistant.name);
      methods.reset(newConf);
    }
  }, [assistantId, initialConfig, methods, assistant, loadConfig]);
  
  // Subscribe to form changes and update Zustand store (debounced)
  useEffect(() => {
    const subscription = methods.watch((value, { name, type }) => {
      if (type === 'change' && name && initialConfig) { // Ensure initialConfig is loaded
        // Check if the value actually changed to prevent unnecessary updates
        const fieldName = name as keyof AssistantConfig;
        // @ts-ignore
        if (value[fieldName] !== initialConfig[fieldName]) {
          // For nested objects like systemPromptEnforcement, ensure the whole object is passed if a sub-property changes
          if (name.startsWith('systemPromptEnforcement.')) {
            updateConfig(assistantId, { systemPromptEnforcement: value.systemPromptEnforcement });
          } else {
             // @ts-ignore
            updateConfig(assistantId, { [name]: value[fieldName] });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [methods, updateConfig, assistantId, initialConfig]);


  const onSubmit = (data: AssistantConfig) => {
    updateConfig(assistantId, data);
    toast({
      title: "Configuration Saved",
      description: `Settings for "${data.assistantName}" have been successfully saved.`,
    });
  };
  
  const handleSave = () => {
    methods.handleSubmit(onSubmit)();
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
      <form onSubmit={methods.handleSubmit(onSubmit)} className="h-full flex flex-col">
        <Tabs defaultValue="model" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-1">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 gap-2 h-auto p-1 bg-muted rounded-lg">
              <TabsTrigger value="model" className="flex-col md:flex-row h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
                <Settings2 className="md:mr-2 h-5 w-5" /> Model
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex-col md:flex-row h-auto py-2 data-[state=active]:bg-background data-[state=active]:shadow-md">
                <SlidersHorizontal className="md:mr-2 h-5 w-5" /> Advanced
              </TabsTrigger>
              {/* Placeholder Tabs */}
              <TabsTrigger value="voice" disabled className="flex-col md:flex-row h-auto py-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:mr-2 lucide lucide-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg> Voice</TabsTrigger>
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
            {/* Placeholder Content */}
            <TabsContent value="voice" className="mt-0"><div className="p-4 text-center text-muted-foreground">Voice settings coming soon.</div></TabsContent>
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
