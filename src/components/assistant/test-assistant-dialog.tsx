
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { Bot, User, Mic, Send, Loader2, Paperclip, Download, Library, StopCircle, AlertTriangle } from 'lucide-react';
import type { AssistantConfig, TestChatMessage } from '@/types';
import { useConfigStore } from '@/store/config-store';
import { testAssistantChat } from '@/ai/flows/test-assistant-chat-flow';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null); // null = not yet determined

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantId) {
      const config = getConfig(assistantId);
      if (config) {
        setAssistantConfig(config);
        if (open && chatHistory.length === 0) {
          setChatHistory([{ id: nanoid(), role: 'assistant', content: config.firstMessage }]);
        }
      } else {
        toast({ title: "Error", description: "Could not load assistant configuration.", variant: "destructive" });
        onOpenChange(false);
      }
    }
    if (!open || (assistantConfig && assistantId !== assistantConfig.id)) {
      setChatHistory([]);
      setCurrentMessage('');
      setIsRecording(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setHasMicPermission(null); // Reset permission status on dialog close/change
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId, open, getConfig, onOpenChange]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const requestMicPermission = async () => {
    if (hasMicPermission === true) return true;
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
    if (!permissionGranted) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
          setAudioChunks((prev) => [...prev, event.data]);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          // For now, simulate transcription and sending
          setAudioChunks([]); // Clear chunks for next recording
          
          // Simulate transcription process
          setIsLoading(true);
          const thinkingMsgId = nanoid();
          setChatHistory(prev => [...prev, {id: thinkingMsgId, role: 'assistant', content: 'Transcribing your voice note...', isThinking: true}]);
          
          // Simulate delay for transcription
          await new Promise(resolve => setTimeout(resolve, 1500));

          // Remove "Transcribing..." message
          setChatHistory(prev => prev.filter(msg => msg.id !== thinkingMsgId));
          
          // Send simulated transcription to the chat flow
          // In a real app, you'd send audioBlob for transcription and then send the text
          handleSendMessage("Simulated transcription of your voice note.", true); 
          setIsLoading(false);

          // Stop all tracks on the stream to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setAudioChunks([]);
        toast({ title: "Recording Started", description: "Speak now..." });
      } catch (err) {
        console.error('Error starting recording:', err);
        toast({ title: "Recording Error", description: "Could not start recording.", variant: "destructive" });
        setHasMicPermission(false); // Re-evaluate permission if getUserMedia fails
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
      // The onstop handler will process the audio
    }
  };

  const handleVoiceInputClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSendMessage = useCallback(async (messageContent: string, isVoiceNoteSimulated = false) => {
    if (!messageContent.trim() || !assistantConfig) return;

    const userMessage: TestChatMessage = { id: nanoid(), role: 'user', content: messageContent.trim() };
    setChatHistory(prev => [...prev, userMessage]);
    if (!isVoiceNoteSimulated) {
        setCurrentMessage('');
    }
    setIsLoading(true);

    const thinkingMessageId = nanoid();
    setChatHistory(prev => [...prev, { id: thinkingMessageId, role: 'assistant', content: '...', isThinking: true }]);

    try {
      const response = await testAssistantChat({
        userInput: userMessage.content,
        assistantConfig: assistantConfig,
        chatHistory: chatHistory.filter(msg => !msg.isThinking), // Send history without "thinking" bubbles
      });
      
      setChatHistory(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? { ...msg, content: response.assistantResponse, isThinking: false } : msg
      ));

    } catch (error) {
      console.error("Error calling testAssistantChat flow:", error);
      toast({ title: "AI Error", description: "Failed to get a response from the assistant.", variant: "destructive" });
      setChatHistory(prev => prev.filter(msg => msg.id !== thinkingMessageId));
      setChatHistory(prev => [...prev, {id: nanoid(), role: 'assistant', content: "Sorry, I encountered an error."}]);
    } finally {
      setIsLoading(false);
    }
  }, [assistantConfig, chatHistory, toast]);


  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle>Test: {assistantConfig?.assistantName || 'Assistant'}</DialogTitle>
          <DialogDescription>
            Interact with your assistant. Responses are generated by the AI.
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
                  <Bot className={`h-7 w-7 text-primary flex-shrink-0 ${msg.isThinking ? 'animate-pulse': ''}`} />
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-xl shadow-md ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted text-foreground rounded-bl-none'
                  } ${msg.isThinking ? 'italic text-muted-foreground' : ''}`}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {msg.role === 'user' && (
                  <User className="h-7 w-7 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            ))}
            {/* The thinking message is now part of chatHistory directly */}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          {chatHistory.length > 0 && chatHistory[chatHistory.length -1].role === 'assistant' && !chatHistory[chatHistory.length -1].isThinking && (
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
              disabled={isLoading || hasMicPermission === false} // Disable if loading or no mic permission
            >
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </Button>
            <Input
              type="text"
              placeholder="Ask anything..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 h-10"
              disabled={isLoading || isRecording} // Disable if loading or recording
            />
            <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading || isRecording || !currentMessage.trim()}>
              {isLoading && !isRecording && !chatHistory.some(msg => msg.isThinking) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
             <Button type="button" variant="outline" size="icon" className="h-10 w-10" onClick={() => toast({title: "Simulated", description: "File attachment (simulated)."})}>
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

