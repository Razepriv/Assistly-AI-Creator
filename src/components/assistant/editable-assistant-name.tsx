"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAssistantStore } from '@/store/assistant-store';
import { useConfigStore } from '@/store/config-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit3, Check, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function EditableAssistantName() {
  const activeAssistantId = useAssistantStore((state) => state.activeAssistantId);
  const getAssistantById = useAssistantStore((state) => state.getAssistantById);
  const updateAssistant = useAssistantStore((state) => state.updateAssistant);
  
  const getConfig = useConfigStore((state) => state.getConfig);
  const updateConfig = useConfigStore((state) => state.updateConfig);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const assistant = activeAssistantId ? getAssistantById(activeAssistantId) : null;
  const config = activeAssistantId ? getConfig(activeAssistantId) : null;

  useEffect(() => {
    if (assistant) {
      setName(assistant.name);
    } else if (config) {
      setName(config.assistantName);
    }
  }, [assistant, config]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (!activeAssistantId || !name.trim()) {
      toast({
        title: "Error",
        description: "Assistant name cannot be empty.",
        variant: "destructive",
      });
      if (assistant) setName(assistant.name); // Revert to original name
      setIsEditing(false);
      return;
    }
    updateAssistant(activeAssistantId, { name });
    updateConfig(activeAssistantId, { assistantName: name });
    setIsEditing(false);
    toast({
      title: "Name Updated",
      description: `Assistant name changed to "${name}".`,
    });
  };

  const handleCancel = () => {
    if (assistant) {
      setName(assistant.name);
    }
    setIsEditing(false);
  };

  if (!activeAssistantId) {
    return <div className="text-lg font-medium text-muted-foreground">No Assistant Selected</div>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          className="h-9 text-lg"
        />
        <Button variant="ghost" size="icon" onClick={handleSave} className="h-9 w-9">
          <Check className="h-5 w-5 text-green-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleCancel} className="h-9 w-9">
          <X className="h-5 w-5 text-red-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
      <h2 className="text-xl font-semibold text-foreground truncate max-w-xs md:max-w-md" title={name}>
        {name || 'Unnamed Assistant'}
      </h2>
      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
        <Edit3 className="h-4 w-4 text-muted-foreground" />
      </Button>
    </div>
  );
}
