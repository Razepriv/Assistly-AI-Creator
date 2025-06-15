
"use client";

import React, { useEffect, useState } from 'react';
import ConfigPanel from './config-panel';
import { useAssistantStore } from '@/store/assistant-store';
import { useConfigStore } from '@/store/config-store';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

interface ConfigPanelClientWrapperProps {
  assistantId: string;
}

export default function ConfigPanelClientWrapper({ assistantId }: ConfigPanelClientWrapperProps) {
  const router = useRouter();
  const getAssistantById = useAssistantStore((state) => state.getAssistantById);
  const loadConfig = useConfigStore((state) => state.loadConfig);
  const getConfig = useConfigStore((state) => state.getConfig); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const currentAssistant = getAssistantById(assistantId);

    if (currentAssistant) {
      const currentConfigInStore = getConfig(assistantId);
      if (!currentConfigInStore) {
        // Config is not in the store, load it (which also creates/updates it in store)
        loadConfig(currentAssistant.id, currentAssistant.name);
      }
      // Config is now guaranteed to be in the store or being loaded by the call above
      setIsLoading(false);
    } else {
      // Assistant not found, could be an invalid ID or data not loaded yet (e.g. after a delete/redirect).
      // Attempt to wait a bit for Zustand hydration or navigation to complete.
      const timer = setTimeout(() => {
        const stillNoAssistant = !getAssistantById(assistantId); // Re-check
        if (stillNoAssistant) {
          setError(`Assistant with ID "${assistantId}" not found.`);
        }
        setIsLoading(false);
      }, 500); // Increased timeout slightly for robustness
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId, getAssistantById, loadConfig, getConfig]);


  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm p-8 h-full">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Loading assistant configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-destructive shadow-sm p-8 h-full">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold text-destructive">{error}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Please check the ID or try selecting an assistant from the sidebar.
        </p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }
  
  // At this point, an assistant record should exist if no error,
  // and its config should be in the store (or was just loaded).
  // ConfigPanel will fetch its own config from the store using getConfig.
  const assistant = getAssistantById(assistantId); // Re-fetch for conditional rendering
   if (!assistant) { // This check is important if initial load had an issue but didn't set error yet
     return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-destructive shadow-sm p-8 h-full">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold text-destructive">Failed to load assistant data.</h3>
        <p className="mt-2 text-sm text-muted-foreground">The assistant might have been deleted or an error occurred.</p>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return <ConfigPanel assistantId={assistantId} />;
}
