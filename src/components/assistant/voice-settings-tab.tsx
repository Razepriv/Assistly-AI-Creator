
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
import { Volume2, Settings, SlidersHorizontal, ListFilter, Palette, Sparkles, AlertCircle } from 'lucide-react';
import type { AssistantConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";

// Mock data - replace with actual API calls later
const VOICE_PROVIDERS = [{ id: 'elevenlabs', name: 'ElevenLabs' }];
const ELEVENLABS_VOICES = [
  { id: 'bella', name: 'Bella (F, American)' },
  { id: 'adam', name: 'Adam (M, American)' },
  { id: 'antoni', name: 'Antoni (M, American, Polish accent)' },
  { id: 'rachel', name: 'Rachel (F, American, Calm)' },
];
const LANGUAGES = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'es-ES', name: 'Español (España)' },
  { id: 'fr-FR', name: 'Français (France)' },
];
const BACKGROUND_SOUNDS = [
  { id: 'default', name: 'Default (No Background)' },
  { id: 'office', name: 'Ambient Office' },
  { id: 'cafe', name: 'Ambient Cafe' },
  { id: 'nature', name: 'Ambient Nature' },
  { id: 'white_noise_brown', name: 'White Noise (Brown)' },
  { id: 'white_noise_pink', name: 'White Noise (Pink)' },
  { id: 'custom', name: 'Custom URL' },
];

export default function VoiceSettingsTab() {
  const { control, watch, formState: { errors } } = useFormContext<AssistantConfig>();
  const { toast } = useToast();

  const voiceConfig = watch('voice');
  const backgroundSoundType = watch('voice.backgroundSound');

  const handlePreviewVoice = () => {
    // Placeholder for actual voice preview functionality
    toast({
      title: "Voice Preview",
      description: "Voice preview functionality is not yet implemented.",
    });
  };

  return (
    <div className="space-y-8 p-1">
      {/* Voice Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Volume2 className="mr-2 h-5 w-5 text-primary" /> Voice Configuration</CardTitle>
          <CardDescription>Select voice synthesis provider, voice, and language.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="voice.provider">Provider</Label>
              <Controller
                name="voice.provider"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="voice.provider" className="mt-1">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {VOICE_PROVIDERS.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.voice?.provider && <p className="text-sm text-destructive mt-1">{errors.voice.provider.message}</p>}
            </div>
            <div>
              <Label htmlFor="voice.voiceId">Voice</Label>
              <Controller
                name="voice.voiceId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="voice.voiceId" className="mt-1">
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {ELEVENLABS_VOICES.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.voice?.voiceId && <p className="text-sm text-destructive mt-1">{errors.voice.voiceId.message}</p>}
            </div>
            <div>
              <Label htmlFor="voice.language">Language</Label>
              <Controller
                name="voice.language"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="voice.language" className="mt-1">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.voice?.language && <p className="text-sm text-destructive mt-1">{errors.voice.language.message}</p>}
            </div>
          </div>
          <Button type="button" variant="outline" onClick={handlePreviewVoice}>Preview Voice (Sample Text)</Button>
        </CardContent>
      </Card>

      {/* Additional Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Settings className="mr-2 h-5 w-5 text-primary" /> Additional Configuration</CardTitle>
          <CardDescription>Customize background audio and speech parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <h4 className="text-md font-medium">Background Sound Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <Label htmlFor="voice.backgroundSound">Sound Selection</Label>
              <Controller
                name="voice.backgroundSound"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="voice.backgroundSound" className="mt-1">
                      <SelectValue placeholder="Select background sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKGROUND_SOUNDS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
               {errors.voice?.backgroundSound && <p className="text-sm text-destructive mt-1">{errors.voice.backgroundSound.message}</p>}
            </div>
            {backgroundSoundType === 'custom' && (
              <div>
                <Label htmlFor="voice.backgroundSoundUrl">Custom Background Sound URL</Label>
                <Controller
                  name="voice.backgroundSoundUrl"
                  control={control}
                  render={({ field }) => <Input id="voice.backgroundSoundUrl" {...field} value={field.value || ''} className="mt-1" placeholder="https://example.com/audio.mp3" />}
                />
                {errors.voice?.backgroundSoundUrl && <p className="text-sm text-destructive mt-1">{errors.voice.backgroundSoundUrl.message}</p>}
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
             <div>
                <Label htmlFor="voice.backgroundVolume">Background Volume: {voiceConfig?.backgroundVolume !== undefined ? Math.round(voiceConfig.backgroundVolume * 100) : 'N/A'}%</Label>
                <Controller
                  name="voice.backgroundVolume"
                  control={control}
                  render={({ field }) => (
                    <Slider
                      id="voice.backgroundVolume"
                      min={0} max={1} step={0.01}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="mt-3"
                    />
                  )}
                />
                {errors.voice?.backgroundVolume && <p className="text-sm text-destructive mt-1">{errors.voice.backgroundVolume.message}</p>}
              </div>
            <div className="flex items-center space-x-2 pt-6">
              <Controller
                name="voice.loopBackgroundSound"
                control={control}
                render={({ field }) => <Switch id="voice.loopBackgroundSound" checked={field.value} onCheckedChange={field.onChange} />}
              />
              <Label htmlFor="voice.loopBackgroundSound">Loop Background Sound</Label>
            </div>
          </div>

          <h4 className="text-md font-medium mt-4">Speech Parameters</h4>
           <div>
              <Label htmlFor="voice.inputMinCharacters">Input Min Characters for Speech</Label>
              <Controller
                name="voice.inputMinCharacters"
                control={control}
                render={({ field }) => (
                   <Input id="voice.inputMinCharacters" type="number" {...field} 
                    value={field.value || 0}
                    onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 w-32" 
                  />
                )}
              />
              {errors.voice?.inputMinCharacters && <p className="text-sm text-destructive mt-1">{errors.voice.inputMinCharacters.message}</p>}
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="voice.speakingRate">Speaking Rate: {voiceConfig?.speakingRate?.toFixed(1)}x</Label>
              <Controller
                name="voice.speakingRate"
                control={control}
                render={({ field }) => (
                  <Slider id="voice.speakingRate" min={0.5} max={2} step={0.1} value={[field.value]} onValueChange={(value) => field.onChange(value[0])} className="mt-3" />
                )}
              />
              {errors.voice?.speakingRate && <p className="text-sm text-destructive mt-1">{errors.voice.speakingRate.message}</p>}
            </div>
            <div>
              <Label htmlFor="voice.pitch">Pitch: {voiceConfig?.pitch?.toFixed(1)}x</Label>
              <Controller
                name="voice.pitch"
                control={control}
                render={({ field }) => (
                  <Slider id="voice.pitch" min={0.5} max={2} step={0.1} value={[field.value]} onValueChange={(value) => field.onChange(value[0])} className="mt-3" />
                )}
              />
              {errors.voice?.pitch && <p className="text-sm text-destructive mt-1">{errors.voice.pitch.message}</p>}
            </div>
            <div>
              <Label htmlFor="voice.masterVolume">Master Volume: {voiceConfig?.masterVolume !== undefined ? Math.round(voiceConfig.masterVolume * 100) : 'N/A'}%</Label>
              <Controller
                name="voice.masterVolume"
                control={control}
                render={({ field }) => (
                  <Slider id="voice.masterVolume" min={0} max={1} step={0.01} value={[field.value]} onValueChange={(value) => field.onChange(value[0])} className="mt-3" />
                )}
              />
              {errors.voice?.masterVolume && <p className="text-sm text-destructive mt-1">{errors.voice.masterVolume.message}</p>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Punctuation Boundaries Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><ListFilter className="mr-2 h-5 w-5 text-primary" /> Punctuation Boundaries</CardTitle>
          <CardDescription>Configure speech chunking and pauses. (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center p-4">Detailed punctuation and smart chunking settings will be available here.</p>
        </CardContent>
      </Card>

      {/* Advanced Voice Features Section (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Palette className="mr-2 h-5 w-5 text-primary" /> Emotion & Tone Settings</CardTitle>
          <CardDescription>Adjust voice emotion and tone. (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center p-4">Controls for emotion, tone, and emphasis will be available here.</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Sparkles className="mr-2 h-5 w-5 text-primary" /> Real-time Voice Processing</CardTitle>
          <CardDescription>Apply voice effects and enhancements. (Coming Soon)</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center p-4">Options for voice effects, noise reduction, and audio quality settings will be available here.</p>
        </CardContent>
      </Card>
      <div className="p-4 my-4 border border-dashed border-accent/50 rounded-lg bg-accent/10 text-accent-foreground flex items-center">
        <AlertCircle size={20} className="mr-3 text-accent flex-shrink-0" />
        <div>
            <h4 className="font-semibold">Developer Note:</h4>
            <p className="text-sm">
                Many advanced voice features (e.g., live preview, dynamic voice loading, custom punctuation effects, emotion/tone synthesis, real-time processing) require significant backend and API integration.
                This UI provides the foundational controls. Actual synthesis and advanced effects are not yet implemented.
            </p>
        </div>
      </div>
    </div>
  );
}
