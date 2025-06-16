
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
import { Bot, User, Mic, Send, Loader2, Paperclip, Download, Library } from 'lucide-react';
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

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (assistantId) {
      const config = getConfig(assistantId);
      if (config) {
        setAssistantConfig(config);
        // Start with the assistant's first message if the dialog is opened and history is empty
        if (open && chatHistory.length === 0) {
          setChatHistory([{ id: nanoid(), role: 'assistant', content: config.firstMessage }]);
        }
      } else {
        toast({ title: "Error", description: "Could not load assistant configuration.", variant: "destructive" });
        onOpenChange(false);
      }
    }
    // Reset history if dialog is closed or assistant changes
    if (!open || (assistantConfig && assistantId !== assistantConfig.id)) {
        setChatHistory([]);
        setCurrentMessage('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId, open, getConfig, onOpenChange]); // chatHistory removed to avoid loop with first message

  useEffect(() => {
    // Auto-scroll to bottom when chat history changes
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleSendMessage = useCallback(async (messageContent: string) => {
    if (!messageContent.trim() || !assistantConfig) return;

    const userMessage: TestChatMessage = { id: nanoid(), role: 'user', content: messageContent.trim() };
    setChatHistory(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    // Add a thinking indicator for the assistant
    const thinkingMessageId = nanoid();
    setChatHistory(prev => [...prev, { id: thinkingMessageId, role: 'assistant', content: '...', isThinking: true }]);

    try {
      const response = await testAssistantChat({
        userInput: userMessage.content,
        assistantConfig: assistantConfig,
        chatHistory: [...chatHistory, userMessage], // Send history up to the user's message
      });
      
      setChatHistory(prev => prev.map(msg => 
        msg.id === thinkingMessageId ? { ...msg, content: response.assistantResponse, isThinking: false } : msg
      ));

    } catch (error) {
      console.error("Error calling testAssistantChat flow:", error);
      toast({ title: "AI Error", description: "Failed to get a response from the assistant.", variant: "destructive" });
      setChatHistory(prev => prev.filter(msg => msg.id !== thinkingMessageId)); // Remove thinking bubble
      setChatHistory(prev => [...prev, {id: nanoid(), role: 'assistant', content: "Sorry, I encountered an error."}]);
    } finally {
      setIsLoading(false);
    }
  }, [assistantConfig, chatHistory, toast]);


  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage(currentMessage);
  };

  const handleVoiceInputClick = () => {
    // Placeholder for voice input
    // For now, let's simulate it by sending the current text input (if any) or a canned phrase
    if (currentMessage.trim()) {
        handleSendMessage(currentMessage);
    } else {
        toast({ title: "Voice Input (Simulated)", description: "Voice input is not fully implemented. Type your message." });
        // Or, you could send a canned phrase:
        // handleSendMessage("Tell me a joke."); 
    }
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
            {isLoading && chatHistory.some(msg => msg.isThinking) && ( // Redundant check, thinking message handles this
              <div className="flex items-end gap-2 justify-start">
                <Bot className="h-7 w-7 text-primary animate-pulse flex-shrink-0" />
                <div className="max-w-[70%] p-3 rounded-xl shadow-md bg-muted text-muted-foreground italic rounded-bl-none">
                  Assistant is typing...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          {/* Placeholder for message actions like download/save */}
          {chatHistory.length > 0 && chatHistory[chatHistory.length -1].role === 'assistant' && !chatHistory[chatHistory.length -1].isThinking && (
            <div className="flex gap-2 mb-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => toast({title: "Simulated", description: "Saved to library (simulated)."})}>
                    <Library className="mr-2 h-4 w-4" /> Save to Library
                </Button>
                <Button variant="outline" size="sm" onClick={() => toast({title: "Simulated", description: "Downloaded PDF (simulated)."})}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                </Button>
            </div>
          )}
          <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" className="bg-pink-500 hover:bg-pink-600 text-white rounded-full h-10 w-10" onClick={handleVoiceInputClick} aria-label="Voice input">
              <Mic className="h-5 w-5" />
            </Button>
            <Input
              type="text"
              placeholder="Ask anything..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              className="flex-1 h-10"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-10 w-10" disabled={isLoading || !currentMessage.trim()}>
              {isLoading && !chatHistory.some(msg => msg.isThinking) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
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
