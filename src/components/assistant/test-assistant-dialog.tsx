
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useActionState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bot, User, Mic, Send, Loader2, Paperclip, Download, Library, StopCircle, AlertTriangle, Speaker } from 'lucide-react';
import type { AssistantConfig, TestChatMessage, DeepgramTranscriptionState, VoiceConfig } from '@/types';
import { useConfigStore } from '@/store/config-store';
import { testAssistantChat } from '@/ai/flows/test-assistant-chat-flow';
import { synthesizeElevenLabsSpeech, type ElevenLabsSpeechState } from '@/app/actions/elevenlabs-actions';
import { transcribeDeepgramAudio } from '@/app/actions/deepgram-actions';
import { useToast } from "@/hooks/use-toast";
import { nanoid } from 'nanoid';

interface TestAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assistantId: string | null;
}

export default function TestAssistantDialog({ open, onOpenChange, assistantId }: TestAssistantDialogProps) {
  const getConfig = useConfigStore((state) => state.getConfig);
  const { toast } = useToast();

  const [assistantConfig, setAssistantConfig] = useState<AssistantConfig | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<TestChatMessage[]>([]);
  
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // States for Server Actions
  const initialElevenLabsState: ElevenLabsSpeechState = { success: false };
  const [elevenLabsState, elevenLabsFormAction, isElevenLabsPending] = useActionState(synthesizeElevenLabsSpeech, initialElevenLabsState);

  const initialDeepgramState: DeepgramTranscriptionState = { success: false };
  const [deepgramState, deepgramFormAction, isDeepgramPending] = useActionState(transcribeDeepgramAudio, initialDeepgramState);

  useEffect(() => {
    if (assistantId) {
      const config = getConfig(assistantId);
      if (config) {
        setAssistantConfig(config);
        if (open && chatHistory.length === 0 && config.firstMessage) {
          const firstMsgId = nanoid();
          setChatHistory([{ id: firstMsgId, role: 'assistant', content: config.firstMessage }]);
          // Automatically synthesize and play the first message
          if (config.voice) {
            handleElevenLabsSynthesis(config.firstMessage, config.voice, firstMsgId);
          }
        }
      } else {
        toast({ title: "Error", description: "Could not load assistant configuration.", variant: "destructive" });
        onOpenChange(false);
      }
    }
     if (!open) {
        resetDialogState();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId, open]); 

  const resetDialogState = () => {
    setChatHistory([]);
    setCurrentMessage('');
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
    }
    setHasMicPermission(null);
    setIsTranscribing(false);
    setIsSynthesizing(false);
    setIsWaitingForAI(false);
    setIsAISpeaking(false);
  };

  // Effect for Deepgram transcription result
  useEffect(() => {
    setIsTranscribing(isDeepgramPending);
    if (!isDeepgramPending && deepgramState) {
      if (deepgramState.success && deepgramState.transcribedText !== null && deepgramState.transcribedText !== undefined) {
        const transcribedContent = deepgramState.transcribedText || "(empty transcription)";
        // Update the last message (which was "Transcribing...") with the actual transcription
        setChatHistory(prev => prev.map(msg => 
            msg.isTranscribing ? { ...msg, content: `User (Voice): ${transcribedContent}`, isTranscribing: false } : msg
        ));
        handleSendMessage(`User (Voice): ${transcribedContent}`);
      } else if (deepgramState.error) {
        toast({ title: "Transcription Error", description: deepgramState.error, variant: "destructive" });
        setChatHistory(prev => prev.filter(msg => !msg.isTranscribing)); // Remove "Transcribing..." message
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepgramState, isDeepgramPending]);

  // Effect for ElevenLabs synthesis result
  useEffect(() => {
    setIsSynthesizing(isElevenLabsPending);
    if (!isElevenLabsPending && elevenLabsState) {
      if (elevenLabsState.success && elevenLabsState.audioBase64) {
        if (currentAudioRef.current) {
            currentAudioRef.current.pause();
        }
        const audio = new Audio(`data:audio/mpeg;base64,${elevenLabsState.audioBase64}`);
        currentAudioRef.current = audio;
        setIsAISpeaking(true);
        audio.play()
          .then(() => {
            toast({ title: "AI Speaking", description: "Playing assistant's voice." });
          })
          .catch(e => {
            console.error("Error playing synthesized audio:", e);
            toast({ title: "Playback Error", description: "Could not play AI's voice.", variant: "destructive" });
            setIsAISpeaking(false); // Reset if play fails
          });
        audio.onended = () => {
            setIsAISpeaking(false);
        };
      } else if (elevenLabsState.error) {
        toast({ title: "Synthesis Error", description: elevenLabsState.error, variant: "destructive" });
      }
       // Clear the synthesizing message regardless of success/failure of TTS
      setChatHistory(prev => prev.map(msg => 
        msg.isSynthesizing ? { ...msg, isSynthesizing: false } : msg
      ));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elevenLabsState, isElevenLabsPending]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const requestMicPermission = async () => {
    if (hasMicPermission === true) return true;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        toast({ variant: 'destructive', title: 'Unsupported Browser', description: 'Media devices are not supported in this browser.' });
        setHasMicPermission(false);
        return false;
    }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasMicPermission(true);
      toast({ title: "Microphone Access", description: "Microphone permission granted." });
      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setHasMicPermission(false);
      toast({
        variant: 'destructive',
        title: 'Microphone Access Denied',
        description: 'Please enable microphone permissions in your browser settings.',
      });
      return false;
    }
  };

  const startRecording = async () => {
    const permissionGranted = await requestMicPermission();
    if (!permissionGranted || !assistantConfig) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current.ondataavailable = (event) => {
          setAudioChunks((prev) => [...prev, event.data]);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          setAudioChunks([]);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const audioDataUri = reader.result as string;
            const formData = new FormData();
            formData.append('audioDataUri', audioDataUri);
            formData.append('model', assistantConfig.transcriber.model);
            formData.append('language', assistantConfig.transcriber.language);
            formData.append('punctuate', String(assistantConfig.transcriber.smartFormatting.punctuation));
            formData.append('smart_format', String(assistantConfig.transcriber.smartFormatting.enabled));
            
            setChatHistory(prev => [...prev, { id: nanoid(), role: 'user', content: "[Transcribing voice note...]", isTranscribing: true, audioDataUri: audioDataUri }]);
            deepgramFormAction(formData);
          };
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setAudioChunks([]);
        toast({ title: "Recording Started", description: "Speak now..." });
      } catch (err) {
        console.error('Error starting recording:', err);
        toast({ title: "Recording Error", description: "Could not start recording.", variant: "destructive" });
        setHasMicPermission(false);
      }
    } else {
      toast({ title: "Unsupported", description: "Your browser doesn't support audio recording.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast({ title: "Recording Stopped" });
    }
  };

  const handleVoiceInputClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleElevenLabsSynthesis = useCallback((textToSynthesize: string, voiceConf: VoiceConfig, messageIdToUpdate?: string) => {
    if (!textToSynthesize.trim()) return;
    
    const formData = new FormData();
    formData.append('text', textToSynthesize);
    formData.append('voiceId', voiceConf.voiceId);
    if (voiceConf.providerSpecific?.modelId) formData.append('modelId', voiceConf.providerSpecific.modelId);
    if (voiceConf.speakingRate) formData.append('stability', String(1 - (voiceConf.speakingRate - 1) * 0.5)); // Example mapping
    if (voiceConf.pitch) formData.append('similarityBoost', String( (voiceConf.pitch -1) * 0.5 + 0.5)); // Example mapping
    // Note: mapping speakingRate/pitch to stability/similarityBoost is an approximation.
    // You might need more direct ElevenLabs parameters for 'stability' and 'similarity_boost' in VoiceConfig.

    if (messageIdToUpdate) {
        setChatHistory(prev => prev.map(msg => 
            msg.id === messageIdToUpdate ? { ...msg, isSynthesizing: true, content: textToSynthesize } : msg
        ));
    } else {
        // This case might not be used if synthesis always updates an existing "thinking" message
        const assistantMsgId = nanoid();
        setChatHistory(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: textToSynthesize, isSynthesizing: true }]);
    }
    elevenLabsFormAction(formData);
  }, [elevenLabsFormAction]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !assistantConfig) return;

    const userMessageId = chatHistory.find(msg => msg.content === messageContent && msg.role === 'user')?.id || nanoid();

    // Add user message if not already added (e.g. by transcription)
    if (!chatHistory.some(msg => msg.id === userMessageId && msg.role === 'user')) {
         setChatHistory(prev => [...prev, { id: userMessageId, role: 'user', content: messageContent.trim() }]);
    }
    setCurrentMessage(''); // Clear text input
    
    setIsWaitingForAI(true);
    const thinkingMessageId = nanoid();
    setChatHistory(prev => [...prev, { id: thinkingMessageId, role: 'assistant', content: '...', isThinking: true }]);

    try {
      const historyForFlow = chatHistory
        .filter(msg => msg.id !== thinkingMessageId && !msg.isTranscribing && !msg.isSynthesizing)
        .map(({ isThinking, isTranscribing, isSynthesizing, audioDataUri, ...rest }) => rest); // Strip temp flags for flow

       if (!historyForFlow.find(msg => msg.id === userMessageId && msg.role === 'user')) {
           historyForFlow.push({ id: userMessageId, role: 'user', content: messageContent.trim()});
       }


      const response = await testAssistantChat({
        userInput: messageContent,
        assistantConfig: assistantConfig,
        chatHistory: historyForFlow,
      });
      
      setIsWaitingForAI(false);
      // Update the "thinking" message with the actual response text, mark for synthesis
      setChatHistory(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? { ...msg, content: response.assistantResponse, isThinking: false, isSynthesizing: true } : msg
      ));
      
      // Trigger ElevenLabs Synthesis for the AI's response
      if (assistantConfig.voice) {
        handleElevenLabsSynthesis(response.assistantResponse, assistantConfig.voice, thinkingMessageId);
      }

    } catch (error) {
      console.error("Error calling testAssistantChat flow:", error);
      toast({ title: "AI Error", description: "Failed to get a response from the assistant.", variant: "destructive" });
      setChatHistory(prev => prev.filter(msg => msg.id !== thinkingMessageId)); // Remove thinking bubble
      setChatHistory(prev => [...prev, {id: nanoid(), role: 'assistant', content: "Sorry, I encountered an error."}]);
      setIsWaitingForAI(false);
    }
  }, [assistantConfig, chatHistory, toast, handleElevenLabsSynthesis]);


  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };
  
  const isLoading = isRecording || isTranscribing || isSynthesizing || isWaitingForAI || isElevenLabsPending || isDeepgramPending;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetDialogState();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle>Test: {assistantConfig?.assistantName || 'Assistant'}</DialogTitle>
          <DialogDescription>
            Interact with your assistant. User voice notes are transcribed by Deepgram. Assistant responses are synthesized by ElevenLabs.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          {hasMicPermission === false && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Microphone Access Denied</AlertTitle>
              <AlertDescription>
                To use voice input, please enable microphone permissions in your browser settings and refresh.
              </AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <Bot className={`h-7 w-7 text-primary flex-shrink-0 ${(msg.isThinking || msg.isSynthesizing || isAISpeaking) ? 'animate-pulse': ''}`} />
                )}
                <div
                  className={`flex flex-col items-start max-w-[70%] ${
                    msg.role === 'user' ? 'items-end' : ''
                  }`}
                >
                    <div
                        className={`p-3 rounded-xl shadow-md ${
                        msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-muted text-foreground rounded-bl-none'
                        } ${(msg.isThinking || msg.isTranscribing || msg.isSynthesizing) ? 'italic text-muted-foreground' : ''}`}
                    >
                        {msg.content.split('\\n').map((line, i) => (
                            <React.Fragment key={i}>
                            {line}
                            {i < msg.content.split('\\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                    </div>
                    {msg.role === 'assistant' && isAISpeaking && msg.isSynthesizing === false && !msg.isThinking && (
                         <div className="text-xs text-primary mt-1 flex items-center"><Speaker className="h-3 w-3 mr-1 animate-pulse" /> Speaking...</div>
                    )}
                </div>
                {msg.role === 'user' && (
                  <User className="h-7 w-7 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          {chatHistory.length > 0 && chatHistory[chatHistory.length -1].role === 'assistant' && !isLoading && (
            <div className="flex gap-2 mb-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Simulated", description: "Saved to library (simulated)."})}>
                    <Library className="mr-2 h-4 w-4" /> Save to Library
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Simulated", description: "Downloaded PDF (simulated)."})}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-pink-500 hover:bg-pink-600'} text-white rounded-full h-10 w-10`}
              onClick={handleVoiceInputClick}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
              disabled={isLoading || hasMicPermission === false || isAISpeaking}
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input
              type="text"
              placeholder={isRecording ? "Recording..." : "Ask anything..."}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 h-10"
              disabled={isLoading || isRecording || isAISpeaking}
            />
            <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading || isRecording || !currentMessage.trim() || isAISpeaking}>
              {(isWaitingForAI || isTranscribing || isSynthesizing) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => toast({title: "Simulated", description: "File attachment (simulated)."}) } disabled={isLoading || isAISpeaking}>
              <Paperclip className="h-5 w-5" />
            </Button>
          </form>
        </div>
         <DialogFooter className="p-4 border-t sm:justify-end">
            <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
