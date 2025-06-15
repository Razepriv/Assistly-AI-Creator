"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Loader2, FileText, AlertTriangle } from 'lucide-react';
import { useFormContext } from 'react-hook-form';
import type { AssistantConfig } from '@/types';
import { suggestFileUploads, type SuggestFileUploadsInput, type SuggestFileUploadsOutput } from '@/ai/flows/suggest-file-uploads';
import { ScrollArea } from '../ui/scroll-area';

export default function SuggestedFiles() {
  const { watch } = useFormContext<AssistantConfig>();
  const assistantName = watch('assistantName');
  const systemPrompt = watch('systemPrompt');

  const [suggestions, setSuggestions] = useState<SuggestFileUploadsOutput['suggestedFiles']>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  const fetchSuggestions = async () => {
    if (!assistantName || !systemPrompt) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const input: SuggestFileUploadsInput = { assistantName, systemPrompt };
      const result = await suggestFileUploads(input);
      setSuggestions(result.suggestedFiles);
    } catch (e) {
      console.error("Failed to fetch file suggestions:", e);
      setError("Could not load suggestions. Please try again.");
      setSuggestions([]);
    } finally {
      setIsLoading(false);
      if (!initialLoadDone) setInitialLoadDone(true);
    }
  };
  
  useEffect(() => {
    // Fetch suggestions when component mounts or critical fields change,
    // but only after a short delay to avoid spamming on rapid typing.
    const handler = setTimeout(() => {
       if (assistantName && systemPrompt && (initialLoadDone || (assistantName.length > 3 && systemPrompt.length > 20))) {
        fetchSuggestions();
      }
    }, 1500); // Debounce for 1.5 seconds

    return () => {
      clearTimeout(handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantName, systemPrompt, initialLoadDone]);


  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5 text-yellow-400" />
          AI-Suggested Knowledge Files
        </CardTitle>
        <CardDescription>
          Improve your assistant's performance by uploading these relevant files. 
          Suggestions update based on assistant name and system prompt.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Loading suggestions...</span>
          </div>
        )}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center p-6 text-destructive">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>{error}</span>
            <Button onClick={fetchSuggestions} variant="link" className="mt-2">Try again</Button>
          </div>
        )}
        {!isLoading && !error && suggestions.length === 0 && initialLoadDone && (
          <p className="text-center text-muted-foreground p-6">
            No specific file suggestions at the moment. Try refining your assistant's name or system prompt for more targeted advice.
          </p>
        )}
        {!isLoading && !error && suggestions.length > 0 && (
          <ScrollArea className="h-[200px] pr-3">
            <ul className="space-y-3">
              {suggestions.map((file, index) => (
                <li key={index} className="p-3 bg-muted/50 rounded-md border">
                  <div className="font-semibold flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-primary" />
                    {file.filename}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
         {!initialLoadDone && !isLoading && !error && (
            <p className="text-center text-muted-foreground p-6">
                Enter assistant name and system prompt to get suggestions.
            </p>
        )}
        <Button 
          onClick={fetchSuggestions} 
          disabled={isLoading || !assistantName || !systemPrompt} 
          className="mt-4 w-full"
          variant="outline"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Refresh Suggestions
        </Button>
      </CardContent>
    </Card>
  );
}
