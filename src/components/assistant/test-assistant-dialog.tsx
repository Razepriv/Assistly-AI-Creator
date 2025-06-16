
"use client";

import React, { useState, useEffect, useRef, useCallback, startTransition } from 'react';
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
  const [isWaitingForAI, setIsWaitingForAI] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

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
          // Set initial message with isSynthesizing true to trigger synthesis
          setChatHistory([{ id: firstMsgId, role: 'assistant', content: config.firstMessage, isSynthesizing: true }]);
          if (config.voice && config.firstMessage) {
             startTransition(() => {
                handleElevenLabsSynthesis(config.firstMessage, config.voice, firstMsgId);
             });
          } else {
             // If no voice or no first message, ensure isSynthesizing is false
             setChatHistory([{ id: firstMsgId, role: 'assistant', content: config.firstMessage || "Welcome!", isSynthesizing: false }]);
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

  const resetDialogState = useCallback(() => {
    setChatHistory([]);
    setCurrentMessage('');
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.src = ''; 
        currentAudioRef.current = null;
    }
    setHasMicPermission(null);
    setIsWaitingForAI(false);
    setIsAISpeaking(false);
  }, []);

  useEffect(() => {
    if (!isDeepgramPending && deepgramState) {
      if (deepgramState.success && deepgramState.transcribedText !== null && deepgramState.transcribedText !== undefined) {
        const transcribedContent = deepgramState.transcribedText || "";
        const userMessageContent = transcribedContent.trim() ? `User (Voice): ${transcribedContent}` : "[User sent empty voice note]";
        
        setChatHistory(prev => prev.map(msg => 
            msg.isTranscribing ? { ...msg, content: userMessageContent, isTranscribing: false, audioDataUri: undefined } : msg // Clear audioDataUri after processing
        ));
        if (transcribedContent.trim()) {
          handleSendMessage(userMessageContent);
        } else {
          // If transcription is empty, no need to send to AI, just update UI.
           toast({ title: "Empty Transcription", description: "No speech detected or transcription was empty.", variant: "default" });
        }
      } else if (deepgramState.error) {
        toast({ title: "Transcription Error", description: deepgramState.error, variant: "destructive" });
        setChatHistory(prev => prev.filter(msg => !msg.isTranscribing));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepgramState, isDeepgramPending]);

  useEffect(() => {
    if (!isElevenLabsPending && elevenLabsState) {
      // Clear synthesizing state for all messages (only one should be true at a time)
      setChatHistory(prev => prev.map(msg => ({ ...msg, isSynthesizing: false })));

      if (elevenLabsState.success && elevenLabsState.audioBase64) {
        if (currentAudioRef.current && !currentAudioRef.current.paused) {
            currentAudioRef.current.pause(); // Stop any currently playing audio
        }
        const audio = new Audio(`data:audio/mpeg;base64,${elevenLabsState.audioBase64}`);
        currentAudioRef.current = audio;
        setIsAISpeaking(true);
        audio.play()
          .catch(e => {
            console.error("Error playing synthesized audio:", e);
            toast({ title: "Playback Error", description: "Could not play AI's voice.", variant: "destructive" });
            setIsAISpeaking(false); 
          });
        audio.onended = () => {
            setIsAISpeaking(false);
            currentAudioRef.current = null; // Release audio object
        };
      } else if (elevenLabsState.error) {
        toast({ title: "Synthesis Error", description: elevenLabsState.error, variant: "destructive" });
        setIsAISpeaking(false); // Ensure speaking state is false on error
      }
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

    if (currentAudioRef.current && !currentAudioRef.current.paused) {
        currentAudioRef.current.pause();
        setIsAISpeaking(false);
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream); 
        mediaRecorderRef.current.ondataavailable = (event) => {
          setAudioChunks((prev) => [...prev, event.data]);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
          setAudioChunks([]);
          
          const reader = new FileReader();
          reader.onloadend = () => {
            const audioDataUri = reader.result as string;
            const formData = new FormData();
            formData.append('audioDataUri', audioDataUri);
            if(assistantConfig.transcriber) { // Ensure transcriber config exists
                formData.append('model', assistantConfig.transcriber.model);
                formData.append('language', assistantConfig.transcriber.language);
                formData.append('punctuate', String(assistantConfig.transcriber.smartFormatting.punctuation));
                formData.append('smart_format', String(assistantConfig.transcriber.smartFormatting.enabled));
            } else {
                // Fallback defaults if transcriber config is missing
                formData.append('model', 'nova-2');
                formData.append('language', 'en-US');
                formData.append('punctuate', 'true');
                formData.append('smart_format', 'true');
                toast({ title: "Warning", description: "Transcriber configuration missing, using defaults.", variant: "default"});
            }
            
            setChatHistory(prev => [...prev, { id: nanoid(), role: 'user', content: "[Transcribing voice note...]", isTranscribing: true, audioDataUri: audioDataUri }]);
            
            startTransition(() => {
              deepgramFormAction(formData);
            });
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
        toast({ title: "Recording Error", description: "Could not start recording. Check console.", variant: "destructive" });
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
    if (!textToSynthesize.trim()) {
        setChatHistory(prev => prev.map(msg => 
            msg.id === messageIdToUpdate ? { ...msg, isSynthesizing: false } : msg
        ));
        setIsAISpeaking(false);
        return;
    }
    
    const formData = new FormData();
    formData.append('text', textToSynthesize);
    formData.append('voiceId', voiceConf.voiceId);
    if (voiceConf.providerSpecific?.elevenlabs?.model_id) formData.append('model_id', voiceConf.providerSpecific.elevenlabs.model_id);
    else formData.append('model_id', 'eleven_multilingual_v2'); // Default if not specified
    
    if (voiceConf.providerSpecific?.elevenlabs?.stability !== undefined) formData.append('stability', String(voiceConf.providerSpecific.elevenlabs.stability));
    if (voiceConf.providerSpecific?.elevenlabs?.similarity_boost !== undefined) formData.append('similarity_boost', String(voiceConf.providerSpecific.elevenlabs.similarity_boost));
    if (voiceConf.providerSpecific?.elevenlabs?.style !== undefined) formData.append('style', String(voiceConf.providerSpecific.elevenlabs.style));
    if (voiceConf.providerSpecific?.elevenlabs?.use_speaker_boost !== undefined) formData.append('use_speaker_boost', String(voiceConf.providerSpecific.elevenlabs.use_speaker_boost));

    const targetMsgId = messageIdToUpdate || nanoid();
    
    setChatHistory(prev => {
        const msgExists = prev.some(msg => msg.id === targetMsgId);
        if (msgExists) {
            return prev.map(msg => msg.id === targetMsgId ? { ...msg, content: textToSynthesize, isSynthesizing: true, isThinking: false } : msg);
        } else {
            return [...prev, { id: targetMsgId, role: 'assistant', content: textToSynthesize, isSynthesizing: true }];
        }
    });

    startTransition(() => {
      elevenLabsFormAction(formData);
    });
  }, [elevenLabsFormAction]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !assistantConfig) return;

    const userMessageId = chatHistory.find(msg => msg.content === messageContent && msg.role === 'user' && !msg.isTranscribing)?.id || nanoid();

    if (!chatHistory.some(msg => msg.id === userMessageId && msg.role === 'user')) {
         setChatHistory(prev => [...prev, { id: userMessageId, role: 'user', content: messageContent.trim() }]);
    }
    setCurrentMessage(''); 
    
    setIsWaitingForAI(true);
    const thinkingMessageId = nanoid();
    setChatHistory(prev => [...prev, { id: thinkingMessageId, role: 'assistant', content: '...', isThinking: true }]);

    try {
      const historyForFlow = chatHistory
        .filter(msg => msg.id !== thinkingMessageId && !msg.isTranscribing && !msg.isSynthesizing && !msg.isThinking) 
        .map(({ isThinking, isTranscribing, isSynthesizing, audioDataUri, ...rest }) => rest);

       if (!historyForFlow.find(msg => msg.id === userMessageId && msg.role === 'user')) {
           historyForFlow.push({ id: userMessageId, role: 'user', content: messageContent.trim().replace(/^User \(Voice\): /, '')});
       } else {
          historyForFlow.forEach(msg => {
            if (msg.id === userMessageId && msg.role === 'user') {
                msg.content = msg.content.replace(/^User \(Voice\): /, '');
            }
          });
       }


      const response = await testAssistantChat({
        userInput: messageContent.replace(/^User \(Voice\): /, ''), 
        assistantConfig: assistantConfig,
        chatHistory: historyForFlow,
      });
      
      setIsWaitingForAI(false);
      // Update thinking message with actual response and mark for synthesis
      setChatHistory(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? { ...msg, content: response.assistantResponse, isThinking: false, isSynthesizing: true } : msg
      ));
      
      if (assistantConfig.voice && response.assistantResponse) {
        handleElevenLabsSynthesis(response.assistantResponse, assistantConfig.voice, thinkingMessageId);
      } else {
        // If no voice or empty response, just clear synthesizing state
        setChatHistory(prev => prev.map(msg => 
            msg.id === thinkingMessageId ? { ...msg, isSynthesizing: false } : msg
        ));
        setIsAISpeaking(false);
      }

    } catch (error) {
      console.error("Error calling testAssistantChat flow:", error);
      toast({ title: "AI Error", description: `Failed to get a response from the assistant. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
      setChatHistory(prev => prev.filter(msg => msg.id !== thinkingMessageId)); 
      setChatHistory(prev => [...prev, {id: nanoid(), role: 'assistant', content: "Sorry, I encountered an error."}]);
      setIsWaitingForAI(false);
      setIsAISpeaking(false);
    }
  }, [assistantConfig, chatHistory, toast, handleElevenLabsSynthesis]);


  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };
  
  const isBusy = isRecording || isDeepgramPending || isElevenLabsPending || isWaitingForAI || isAISpeaking;

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
                  <Bot className={`h-7 w-7 text-primary flex-shrink-0 ${(msg.isThinking || msg.isSynthesizing || (isAISpeaking && chatHistory.find(m => m.id === msg.id && (m.isSynthesizing || m.content === msg.content)) ) ) ? 'animate-pulse': ''}`} />
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
                        } ${(msg.isThinking || msg.isTranscribing || msg.isSynthesizing) ? 'italic text-muted-foreground/80' : ''}`}
                    >
                        {typeof msg.content === 'string' && msg.content.split('\\n').map((line, i) => (
                            <React.Fragment key={i}>
                            {line}
                            {i < msg.content.split('\\n').length - 1 && <br />}
                            </React.Fragment>
                        ))}
                         {msg.isThinking && <span className="ml-1 animate-pulse">...</span>}
                         {msg.isTranscribing && <span className="ml-1 animate-pulse">🎤...</span>}
                         {msg.isSynthesizing && <span className="ml-1 animate-pulse">🔊...</span>}
                    </div>
                    {msg.role === 'assistant' && isAISpeaking && chatHistory.some(m => m.id === msg.id && m.content === msg.content && !m.isThinking && !m.isSynthesizing) && currentAudioRef.current && !currentAudioRef.current.paused && (
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
          {/* Placeholder buttons */}
          {/* 
          {chatHistory.length > 0 && chatHistory[chatHistory.length -1].role === 'assistant' && !isBusy && !isAISpeaking && (
            <div className="flex gap-2 mb-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Simulated", description: "Saved to library (simulated)."})}>
                    <Library className="mr-2 h-4 w-4" /> Save to Library
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => toast({title: "Simulated", description: "Downloaded PDF (simulated)."})}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>
          )}
          */}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-pink-500 hover:bg-pink-600'} text-white rounded-full h-10 w-10`}
              onClick={handleVoiceInputClick}
              aria-label={isRecording ? "Stop recording" : "Start voice input"}
              disabled={isBusy || hasMicPermission === false}
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input
              type="text"
              placeholder={isRecording ? "Recording..." : "Ask anything..."}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 h-10"
              disabled={isBusy || isRecording}
            />
            <Button type="submit" size="icon" className="h-10 w-10" disabled={isBusy || isRecording || !currentMessage.trim()}>
              {(isWaitingForAI || isDeepgramPending || isElevenLabsPending) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => toast({title: "Simulated", description: "File attachment (simulated)."}) } disabled={isBusy}>
              <Paperclip className="h-5 w-5" />
            </Button>
          </form>
        </div>
         <DialogFooter className="p-4 border-t sm:justify-end">
            <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { onOpenChange(false); resetDialogState();}}>Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

