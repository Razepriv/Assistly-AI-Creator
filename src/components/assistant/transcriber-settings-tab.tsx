
"use client";

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Languages, Settings, SlidersHorizontal, CheckCircle, Filter, AlertCircle } from 'lucide-react';
import type { AssistantConfig } from '@/types'; // Ensure TranscriberConfig is part of AssistantConfig
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with actual API calls or constants later
const TRANSCRIBER_PROVIDERS = [
    { id: 'deepgram', name: 'Deepgram' },
    // { id: 'openai', name: 'OpenAI Whisper' },
    // { id: 'assemblyai', name: 'AssemblyAI' },
];

const DEEPGRAM_MODELS = [
    { id: 'nova-2', name: 'Nova-2 (Latest, General)' },
    { id: 'nova-2-general', name: 'Nova-2 General' },
    { id: 'nova-2-meeting', name: 'Nova-2 Meeting Optimized' },
    { id: 'nova-2-phonecall', name: 'Nova-2 Phone Call Optimized' },
    { id: 'base', name: 'Base (Legacy)' },
];

const TRANSCRIBER_LANGUAGES = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'es', name: 'Español' },
  { id: 'fr', name: 'Français' },
  { id: 'auto', name: 'Auto-detect' },
];

const DENOISING_INTENSITIES = [
    { id: 'light', name: 'Light' },
    { id: 'medium', name: 'Medium' },
    { id: 'strong', name: 'Strong' },
];


export default function TranscriberSettingsTab() {
  const { control, watch, formState: { errors } } = useFormContext<AssistantConfig>();
  const { toast } = useToast();

  const transcriberConfig = watch('transcriber'); // Watch the whole transcriber object
  const smartFormattingEnabled = watch('transcriber.smartFormatting.enabled');
  const backgroundDenoisingEnabled = watch('transcriber.audioProcessing.backgroundDenoising');

  const handleTestTranscription = () => {
    // Placeholder for actual transcription test functionality
    toast({
      title: "Test Transcription",
      description: "Transcription testing functionality is not yet implemented.",
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* Provider & Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Mic className="mr-2 h-5 w-5 text-primary" /> Provider & Model</CardTitle>
          <CardDescription>Select your speech-to-text provider and model.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="transcriber.provider">Provider</Label>
              <Controller
                name="transcriber.provider"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="transcriber.provider" className="mt-1">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSCRIBER_PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.transcriber?.provider && <p className="text-sm text-destructive mt-1">{errors.transcriber.provider.message}</p>}
            </div>
            <div>
              <Label htmlFor="transcriber.model">Model</Label>
              <Controller
                name="transcriber.model"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="transcriber.model" className="mt-1">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* This should dynamically load based on provider */}
                      {DEEPGRAM_MODELS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.transcriber?.model && <p className="text-sm text-destructive mt-1">{errors.transcriber.model.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language & Localization Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Languages className="mr-2 h-5 w-5 text-primary" /> Language & Localization</CardTitle>
          <CardDescription>Configure language settings for transcription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <Label htmlFor="transcriber.language">Language</Label>
              <Controller
                name="transcriber.language"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="transcriber.language" className="mt-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSCRIBER_LANGUAGES.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.transcriber?.language && <p className="text-sm text-destructive mt-1">{errors.transcriber.language.message}</p>}
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Controller
                name="transcriber.autoDetectLanguage"
                control={control}
                render={({ field }) => <Switch id="transcriber.autoDetectLanguage" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="transcriber.autoDetectLanguage">Auto-detect Language</Label>
            </div>
          </div>
           <p className="text-sm text-muted-foreground">Locale-specific formatting (date, numbers) is handled by the provider based on language. Proper noun recognition is model-dependent.</p>
        </CardContent>
      </Card>

      {/* Smart Formatting Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" /> Smart Formatting</CardTitle>
          <CardDescription>Enable intelligent text processing features.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="transcriber.smartFormatting.enabled" className="text-base">Enable Smart Formatting</Label>
            <Controller
              name="transcriber.smartFormatting.enabled"
              control={control}
              render={({ field }) => <Switch id="transcriber.smartFormatting.enabled" checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>
          {smartFormattingEnabled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pl-4 border-l-2 border-muted ml-1 pt-2">
              {[
                { name: 'punctuation', label: 'Automatic Punctuation' },
                { name: 'capitalization', label: 'Smart Capitalization' },
                { name: 'speakerLabels', label: 'Speaker Labels' },
                { name: 'fillerWordRemoval', label: 'Remove Filler Words (um, uh)' },
                { name: 'profanityFilter', label: 'Profanity Filtering' },
              ].map(item => (
                <div key={item.name} className="flex items-center space-x-2">
                  <Controller
                    name={`transcriber.smartFormatting.${item.name}` as any}
                    control={control}
                    render={({ field }) => <Switch id={`transcriber.smartFormatting.${item.name}`} checked={field.value} onCheckedChange={field.onChange} />}
                  />
                  <Label htmlFor={`transcriber.smartFormatting.${item.name}`}>{item.label}</Label>
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-muted-foreground">Paragraph breaks and sentence structure are typically handled by the model.</p>
        </CardContent>
      </Card>

      {/* Audio Processing Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><SlidersHorizontal className="mr-2 h-5 w-5 text-primary" /> Audio Processing</CardTitle>
          <CardDescription>Enhance audio quality before transcription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="transcriber.audioProcessing.backgroundDenoising" className="text-base">Background Denoising</Label>
            <Controller
              name="transcriber.audioProcessing.backgroundDenoising"
              control={control}
              render={({ field }) => <Switch id="transcriber.audioProcessing.backgroundDenoising" checked={field.value} onCheckedChange={field.onChange} />}
            />
          </div>
          {backgroundDenoisingEnabled && (
            <div className="pl-4 border-l-2 border-muted ml-1 pt-2">
              <Label htmlFor="transcriber.audioProcessing.denoisingIntensity">Denoising Intensity</Label>
              <Controller
                name="transcriber.audioProcessing.denoisingIntensity"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="transcriber.audioProcessing.denoisingIntensity" className="mt-1">
                      <SelectValue placeholder="Select intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      {DENOISING_INTENSITIES.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            {[
                { name: 'volumeNormalization', label: 'Volume Normalization' },
                { name: 'echoCancellation', label: 'Echo Cancellation' },
            ].map(item => (
                 <div key={item.name} className="flex items-center space-x-2">
                    <Controller
                        name={`transcriber.audioProcessing.${item.name}` as any}
                        control={control}
                        render={({ field }) => <Switch id={`transcriber.audioProcessing.${item.name}`} checked={field.value} onCheckedChange={field.onChange} />}
                    />
                    <Label htmlFor={`transcriber.audioProcessing.${item.name}`}>{item.label}</Label>
                </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Frequency filtering and multi-channel support are advanced features (Coming Soon).</p>
          <Button type="button" variant="outline" onClick={() => toast({ title: "Audio Preview", description: "Audio processing preview not yet implemented."})}>
            Preview Processed Audio (Sample)
          </Button>
        </CardContent>
      </Card>

      {/* Quality Control Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><CheckCircle className="mr-2 h-5 w-5 text-primary" /> Quality Control</CardTitle>
          <CardDescription>Manage transcription accuracy and confidence.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="transcriber.qualityControl.confidenceThreshold">Confidence Threshold: {transcriberConfig?.qualityControl?.confidenceThreshold?.toFixed(2)}</Label>
            <Controller
              name="transcriber.qualityControl.confidenceThreshold"
              control={control}
              render={({ field }) => (
                <Slider
                  id="transcriber.qualityControl.confidenceThreshold"
                  min={0} max={1} step={0.01}
                  value={[field.value]}
                  onValueChange={(value) => field.onChange(value[0])}
                  className="mt-3"
                />
              )}
            />
            {errors.transcriber?.qualityControl?.confidenceThreshold && <p className="text-sm text-destructive mt-1">{errors.transcriber.qualityControl.confidenceThreshold.message}</p>}
          </div>
          <div>
            <Label htmlFor="transcriber.qualityControl.minWordLength">Minimum Word Length (0 for no filter)</Label>
            <Controller
              name="transcriber.qualityControl.minWordLength"
              control={control}
              render={({ field }) => (
                <Input
                  id="transcriber.qualityControl.minWordLength"
                  type="number"
                  {...field}
                  value={field.value || 0}
                  onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-32"
                />
              )}
            />
             {errors.transcriber?.qualityControl?.minWordLength && <p className="text-sm text-destructive mt-1">{errors.transcriber.qualityControl.minWordLength.message}</p>}
          </div>
          <div className="flex items-center space-x-2">
            <Controller
              name="transcriber.qualityControl.filterLowConfidence"
              control={control}
              render={({ field }) => <Switch id="transcriber.qualityControl.filterLowConfidence" checked={field.value} onCheckedChange={field.onChange} />}
            />
            <Label htmlFor="transcriber.qualityControl.filterLowConfidence">Filter/Flag Low Confidence Segments</Label>
          </div>
          <div>
             <Label>Custom Vocabulary / Domain-Specific Terms (Coming Soon)</Label>
             <p className="text-sm text-muted-foreground mt-1">Adding custom vocabulary can significantly improve accuracy for specific domains.</p>
          </div>
        </CardContent>
      </Card>
      
      <Button type="button" variant="default" onClick={handleTestTranscription} className="w-full">
        Test Transcription with Audio Sample (Placeholder)
      </Button>

       <div className="p-4 my-4 border border-dashed border-accent/50 rounded-lg bg-accent/10 text-accent-foreground flex items-center">
        <AlertCircle size={20} className="mr-3 text-accent flex-shrink-0" />
        <div>
            <h4 className="font-semibold">Developer Note:</h4>
            <p className="text-sm">
                Many advanced transcriber features (e.g., live testing, dynamic model/language loading per provider, custom vocabulary management, batch processing) require significant backend and API integration.
                This UI provides the foundational controls. Actual transcription and advanced processing are not yet implemented.
            </p>
        </div>
      </div>
    </div>
  );
}
