
"use client";

import React, { useState, useEffect, useRef, useCallback, useActionState, startTransition } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mic, Languages, Settings, SlidersHorizontal, CheckCircle, Filter, AlertCircle, UploadCloud, FileText, X, Play, StopCircle, Loader2, ListChecks, PackageOpen } from 'lucide-react';
import type { AssistantConfig, TranscriberConfig, DeepgramTranscriptionState } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { TRANSCRIBER_PROVIDERS, DEEPGRAM_MODELS, MOCK_OPENAI_WHISPER_MODELS, ALL_TRANSCRIBER_LANGUAGES } from '@/lib/constants';
import { transcribeDeepgramAudio } from '@/app/actions/deepgram-actions';
import { Textarea } from '../ui/textarea';

const DENOISING_INTENSITIES = [
    { id: 'light', name: 'Light' },
    { id: 'medium', name: 'Medium' },
    { id: 'strong', name: 'Strong' },
];

export default function TranscriberSettingsTab() {
  const { control, watch, setValue, formState: { errors } } = useFormContext<AssistantConfig>();
  const { toast } = useToast();

  const transcriberProvider = watch('transcriber.provider');
  const smartFormattingEnabled = watch('transcriber.smartFormatting.enabled');
  const backgroundDenoisingEnabled = watch('transcriber.audioProcessing.backgroundDenoising');
  const customVocabulary = watch('transcriber.qualityControl.customVocabulary', []);

  const [customVocabInput, setCustomVocabInput] = useState('');
  const [availableModels, setAvailableModels] = useState<{id: string, name: string}[]>(DEEPGRAM_MODELS);
  const [availableLanguages, setAvailableLanguages] = useState<{id: string, name: string, providers: string[]}[]>(ALL_TRANSCRIBER_LANGUAGES.filter(lang => lang.providers.includes('deepgram')));

  const [isRecordingLiveTest, setIsRecordingLiveTest] = useState(false);
  const liveTestRecordingChunksRef = useRef<Blob[]>([]); // Changed from useState
  const liveTestMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [liveTestTranscriptionResult, setLiveTestTranscriptionResult] = useState<string | null>(null);
  const [liveTestError, setLiveTestError] = useState<string | null>(null);
  
  const initialDeepgramState: DeepgramTranscriptionState = { success: false };
  const [deepgramState, deepgramFormAction, isDeepgramPending] = useActionState(transcribeDeepgramAudio, initialDeepgramState);

  const [batchFiles, setBatchFiles] = useState<File[]>([]);


  useEffect(() => {
    if (transcriberProvider === 'deepgram') {
      setAvailableModels(DEEPGRAM_MODELS);
      setAvailableLanguages(ALL_TRANSCRIBER_LANGUAGES.filter(lang => lang.providers.includes('deepgram')));
    } else if (transcriberProvider === 'mock-openai') {
      setAvailableModels(MOCK_OPENAI_WHISPER_MODELS);
      setAvailableLanguages(ALL_TRANSCRIBER_LANGUAGES.filter(lang => lang.providers.includes('mock-openai')));
    } else {
      setAvailableModels([]);
      setAvailableLanguages([]);
    }
    // Optionally reset model and language if current selection is not in new list
    // This part can be tricky and depends on desired UX. For now, let user manually re-select.
  }, [transcriberProvider]);

  const handleAddCustomVocab = () => {
    if (customVocabInput.trim() && !customVocabulary.includes(customVocabInput.trim())) {
      setValue('transcriber.qualityControl.customVocabulary', [...customVocabulary, customVocabInput.trim()], { shouldValidate: true, shouldDirty: true });
      setCustomVocabInput('');
    }
  };

  const handleRemoveCustomVocab = (termToRemove: string) => {
    setValue('transcriber.qualityControl.customVocabulary', customVocabulary.filter(term => term !== termToRemove), { shouldValidate: true, shouldDirty: true });
  };

  // Live Test Recording Logic
  const requestMicPermissionForLiveTest = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (error) {
      console.error('Error accessing microphone for live test:', error);
      setLiveTestError('Microphone access denied. Please enable permissions.');
      return false;
    }
  };

  const startLiveTestRecording = async () => {
    const permissionGranted = await requestMicPermissionForLiveTest();
    if (!permissionGranted) return;

    setLiveTestError(null);
    setLiveTestTranscriptionResult(null);
    setIsRecordingLiveTest(true);
    liveTestRecordingChunksRef.current = []; // Reset for new recording

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: MediaRecorder.isTypeSupported('audio/wav') ? 'audio/wav' : 'audio/webm' };
      liveTestMediaRecorderRef.current = new MediaRecorder(stream, options);

      liveTestMediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          liveTestRecordingChunksRef.current.push(event.data);
        }
      };

      liveTestMediaRecorderRef.current.onstop = () => {
        const recordedMimeType = liveTestMediaRecorderRef.current?.mimeType || 'audio/webm';
        const audioBlob = new Blob(liveTestRecordingChunksRef.current, { type: recordedMimeType });
        liveTestRecordingChunksRef.current = []; // Clear after use
        stream.getTracks().forEach(track => track.stop());

        if (audioBlob.size === 0) {
          setLiveTestError("No audio recorded for live test.");
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const audioDataUri = reader.result as string;
          const formData = new FormData();
          formData.append('audioDataUri', audioDataUri);
          const currentTranscriberConfig = watch('transcriber');
          formData.append('model', currentTranscriberConfig.model);
          formData.append('language', currentTranscriberConfig.language);
          formData.append('punctuate', String(currentTranscriberConfig.smartFormatting.punctuation));
          formData.append('smart_format', String(currentTranscriberConfig.smartFormatting.enabled));
          if (currentTranscriberConfig.provider === 'deepgram' && currentTranscriberConfig.qualityControl.customVocabulary.length > 0) {
            formData.append('keywords', currentTranscriberConfig.qualityControl.customVocabulary.join(':'));
          }
          
          setLiveTestTranscriptionResult("Transcribing...");
          startTransition(() => {
            deepgramFormAction(formData);
          });
        };
        reader.readAsDataURL(audioBlob);
      };
      liveTestMediaRecorderRef.current.start();
      toast({ title: "Live Test Recording Started" });
    } catch (err) {
      console.error('Error starting live test recording:', err);
      setLiveTestError("Could not start recording.");
      setIsRecordingLiveTest(false);
    }
  };

  const stopLiveTestRecording = () => {
    if (liveTestMediaRecorderRef.current && liveTestMediaRecorderRef.current.state === "recording") {
      liveTestMediaRecorderRef.current.stop();
      setIsRecordingLiveTest(false);
      toast({ title: "Live Test Recording Stopped", description: "Processing..."});
    }
  };

  useEffect(() => {
    if (!isDeepgramPending && deepgramState) {
      if (deepgramState.success && deepgramState.transcribedText !== undefined) {
        setLiveTestTranscriptionResult(deepgramState.transcribedText || "[Empty Transcription]");
        setLiveTestError(null);
      } else if (deepgramState.error) {
        setLiveTestTranscriptionResult(null);
        setLiveTestError(`Transcription Error: ${deepgramState.error}`);
      }
    }
  }, [deepgramState, isDeepgramPending]);


  const handleBatchFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setBatchFiles(Array.from(event.target.files));
    }
  };

  const handleStartBatchTranscription = () => {
    if (batchFiles.length === 0) {
      toast({ title: "No Files Selected", description: "Please select audio files for batch transcription.", variant: "destructive" });
      return;
    }
    toast({
      title: "Batch Transcription",
      description: `Simulating batch transcription for ${batchFiles.length} file(s). This feature is not fully implemented.`,
    });
    // Placeholder for actual batch processing logic
  };

  return (
    <div className="space-y-8 p-1">
      {/* Provider & Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><Mic className="mr-2 h-5 w-5 text-primary" /> Provider & Model</CardTitle>
          <CardDescription>Select your speech-to-text provider and model. Model and language options will update based on provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="transcriber.provider">Provider</Label>
              <Controller
                name="transcriber.provider"
                control={control}
                render={({ field }) => (
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset model and language or set to first available for new provider
                      if (value === 'deepgram') {
                        setValue('transcriber.model', DEEPGRAM_MODELS[0].id, {shouldValidate: true});
                        setValue('transcriber.language', ALL_TRANSCRIBER_LANGUAGES.find(l=>l.providers.includes('deepgram'))?.id || 'en-US', {shouldValidate: true} );
                      } else if (value === 'mock-openai') {
                         setValue('transcriber.model', MOCK_OPENAI_WHISPER_MODELS[0].id, {shouldValidate: true});
                         setValue('transcriber.language', ALL_TRANSCRIBER_LANGUAGES.find(l=>l.providers.includes('mock-openai'))?.id || 'en-US', {shouldValidate: true});
                      }
                    }} 
                    value={field.value}
                  >
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
                      {availableModels.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                      {availableModels.length === 0 && <SelectItem value="" disabled>No models available for this provider</SelectItem>}
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
                      {availableLanguages.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                      {availableLanguages.length === 0 && <SelectItem value="" disabled>No languages available for this provider</SelectItem>}
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
            <Label htmlFor="transcriber.qualityControl.confidenceThreshold">Confidence Threshold: {watch('transcriber.qualityControl.confidenceThreshold', 0.85).toFixed(2)}</Label>
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
             <Label htmlFor="customVocabInput">Custom Vocabulary / Domain-Specific Terms</Label>
             <div className="flex items-center gap-2 mt-1">
                <Input
                    id="customVocabInput"
                    type="text"
                    value={customVocabInput}
                    onChange={(e) => setCustomVocabInput(e.target.value)}
                    placeholder="Add a term (e.g., Assistly, Genkit)"
                    className="flex-grow"
                />
                <Button type="button" onClick={handleAddCustomVocab}>Add Term</Button>
             </div>
             {customVocabulary.length > 0 && (
                <ScrollArea className="mt-2 h-24 rounded-md border p-2">
                    <ul className="space-y-1">
                        {customVocabulary.map(term => (
                            <li key={term} className="flex items-center justify-between p-1.5 bg-muted/50 rounded text-sm">
                                <span>{term}</span>
                                <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveCustomVocab(term)} className="h-6 w-6">
                                    <X className="h-3 w-3 text-destructive" />
                                </Button>
                            </li>
                        ))}
                    </ul>
                </ScrollArea>
             )}
             {errors.transcriber?.qualityControl?.customVocabulary && <p className="text-sm text-destructive mt-1">{typeof errors.transcriber.qualityControl.customVocabulary.message === 'string' ? errors.transcriber.qualityControl.customVocabulary.message : "Invalid custom vocabulary"}</p>}
             <p className="text-xs text-muted-foreground mt-1">Adding custom vocabulary can significantly improve accuracy for specific domains. For Deepgram, these are sent as 'keywords'.</p>
          </div>
        </CardContent>
      </Card>

      {/* Live Transcription Test */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><Play className="mr-2 h-5 w-5 text-primary" /> Live Transcription Test</CardTitle>
            <CardDescription>Test your current transcriber configuration with a live audio recording.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Button 
                type="button" 
                onClick={isRecordingLiveTest ? stopLiveTestRecording : startLiveTestRecording}
                variant={isRecordingLiveTest ? "destructive" : "outline"}
                className="w-full"
                disabled={(isDeepgramPending && !isRecordingLiveTest) || (transcriberProvider === 'mock-openai' && !isRecordingLiveTest)} 
            >
                {isDeepgramPending && !isRecordingLiveTest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isRecordingLiveTest ? <StopCircle className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isRecordingLiveTest ? "Stop Recording" : (transcriberProvider === 'mock-openai' ? "Live Test (Simulated for Mock Provider)" : "Record Audio for Live Test")}
            </Button>
            {liveTestTranscriptionResult && (
                <div>
                    <Label className="font-semibold">Transcription Result:</Label>
                    <Textarea 
                        readOnly 
                        value={liveTestTranscriptionResult} 
                        className="mt-1 h-24 bg-muted/50" 
                        placeholder="Transcription will appear here..."
                    />
                </div>
            )}
            {liveTestError && (
                <p className="text-sm text-destructive flex items-center"><AlertCircle className="h-4 w-4 mr-1"/> {liveTestError}</p>
            )}
            <p className="text-xs text-muted-foreground">Uses current settings for provider ({watch('transcriber.provider')}), model, and language.</p>
        </CardContent>
      </Card>

      {/* Batch Processing */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center"><ListChecks className="mr-2 h-5 w-5 text-primary" /> Batch Transcription (Placeholder)</CardTitle>
            <CardDescription>Upload multiple audio files for transcription.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border border-dashed rounded-lg bg-card/50 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-muted-foreground" />
                <Label
                    htmlFor="batch-file-upload"
                    className="mt-3 inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring cursor-pointer"
                >
                    Select Audio Files
                </Label>
                <Input
                    id="batch-file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleBatchFileChange}
                    accept="audio/*" 
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    Select one or more audio files (WAV, MP3, etc.).
                </p>
            </div>
            {batchFiles.length > 0 && (
                <div className="mt-3">
                    <p className="text-sm font-medium">{batchFiles.length} file(s) selected:</p>
                    <ScrollArea className="h-20 mt-1 rounded-md border p-1.5">
                        <ul className="text-xs">
                        {batchFiles.map(file => <li key={file.name} className="truncate">{file.name}</li>)}
                        </ul>
                    </ScrollArea>
                </div>
            )}
            <Button type="button" onClick={handleStartBatchTranscription} className="w-full mt-3" disabled={batchFiles.length === 0}>
                <PackageOpen className="mr-2 h-4 w-4" />
                Start Batch Transcription Job
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-1">Note: Batch processing is a placeholder and not yet functional.</p>
        </CardContent>
      </Card>
      
       <div className="p-4 my-4 border border-dashed border-accent/50 rounded-lg bg-accent/10 text-accent-foreground flex items-center">
        <AlertCircle size={20} className="mr-3 text-accent flex-shrink-0" />
        <div>
            <h4 className="font-semibold">Developer Note:</h4>
            <p className="text-sm">
                Dynamic model/language loading is simulated based on provider selection. Custom vocabulary is stored and passed to Deepgram as 'keywords'.
                Live testing uses the Deepgram action. Batch processing is a UI placeholder.
                Full implementation of all features across multiple providers would require extensive API integrations.
            </p>
        </div>
      </div>
    </div>
  );
}

