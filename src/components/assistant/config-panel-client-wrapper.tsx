
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
  const getConfig = useConfigStore((state) => state.getConfig); // For dependency array
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const assistant = getAssistantById(assistantId);
  // Get config directly from store to use as a stable dependency if possible
  const storeConfig = getConfig(assistantId);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (assistant) {
      if (!storeConfig) {
        // If config doesn't exist for this assistant in the store, load/create it.
        // loadConfig will update the store, triggering a re-render.
        // ConfigPanel will then pick up the new config from the store.
        loadConfig(assistant.id, assistant.name);
      }
      // Whether config was present or just loaded, we can stop loading.
      // ConfigPanel will handle its own internal state based on store's getConfig.
      setIsLoading(false);
    } else {
      // Assistant not found, could be an invalid ID or data not loaded yet.
      // Attempt to wait a bit for Zustand hydration.
      const timer = setTimeout(() => {
        const stillNoAssistant = !getAssistantById(assistantId);
        if (stillNoAssistant) {
          setError(`Assistant with ID "${assistantId}" not found.`);
        }
        setIsLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId, assistant, storeConfig, loadConfig, getAssistantById]);


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
  
  // At this point, assistant should be available if no error.
  // ConfigPanel will fetch its own config from the store.
  if (!assistant) {
     return (
      <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-destructive shadow-sm p-8 h-full">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h3 className="mt-4 text-lg font-semibold text-destructive">Failed to load assistant data.</h3>
        <Button onClick={() => router.push('/')} className="mt-4">Go to Dashboard</Button>
      </div>
    );
  }

  return <ConfigPanel assistantId={assistantId} />;
}
