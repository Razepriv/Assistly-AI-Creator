"use client";

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { OPENAI_MODELS } from '@/lib/constants';
import type { AssistantConfig } from '@/types';

interface ModelConfigTabProps {
  // Props if any, like disabled states or specific options
}

export default function ModelConfigTab({ }: ModelConfigTabProps) {
  const { control, watch } = useFormContext<AssistantConfig>();
  const systemPromptEnforcementEnabled = watch('systemPromptEnforcement.enabled');

  return (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="provider">Provider</Label>
          <Controller
            name="provider"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange} disabled>
                <SelectTrigger id="provider" className="mt-1">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  {/* Add other providers here when supported */}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <div>
          <Label htmlFor="model">Model</Label>
          <Controller
            name="model"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="model" className="mt-1">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {OPENAI_MODELS.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="firstMessage">First Message</Label>
        <Controller
          name="firstMessage"
          control={control}
          render={({ field }) => (
            <Input
              id="firstMessage"
              {...field}
              className="mt-1"
              placeholder="e.g., Hello! How can I help you today?"
            />
          )}
        />
        <p className="text-sm text-muted-foreground mt-1">
          The initial message the assistant sends to start the conversation.
        </p>
      </div>

      <div>
        <Label htmlFor="systemPrompt">System Prompt</Label>
        <Controller
          name="systemPrompt"
          control={control}
          render={({ field }) => (
            <Textarea
              id="systemPrompt"
              {...field}
              className="mt-1 min-h-[150px] lg:min-h-[200px]"
              placeholder="e.g., You are a helpful AI assistant specialized in..."
            />
          )}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Detailed instructions for the assistant's behavior, personality, and constraints.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="systemPromptEnforcementEnabled" className="text-base">System Prompt Enforcement</Label>
            <p className="text-sm text-muted-foreground">
              Ensure the assistant adheres more strictly to the system prompt.
            </p>
          </div>
          <Controller
            name="systemPromptEnforcement.enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="systemPromptEnforcementEnabled"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        {systemPromptEnforcementEnabled && (
          <div>
            <Label htmlFor="systemPromptEnforcementLevel">Enforcement Level</Label>
            <Controller
                name="systemPromptEnforcement.level"
                control={control}
                defaultValue="moderate" // Default value
                render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="systemPromptEnforcementLevel" className="mt-1">
                    <SelectValue placeholder="Select enforcement level" />
                    </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                    </SelectContent>
                </Select>
                )}
            />
            <p className="text-sm text-muted-foreground mt-1">
              'Strict' may limit creativity but improve adherence. 'Experimental' might have varied results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
