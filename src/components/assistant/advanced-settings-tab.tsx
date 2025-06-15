"use client";

import React, { useState, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import SuggestedFiles from '@/components/assistant/suggested-files';
import type { AssistantConfig } from '@/types';
import { useToast } from "@/hooks/use-toast";

export default function AdvancedSettingsTab() {
  const { control, watch, setValue, formState: { errors } } = useFormContext<AssistantConfig>();
  const { toast } = useToast();

  const files = watch('files', []);
  const temperature = watch('temperature', 0.7);

  // For controlled file input
  const [fileInputKey, setFileInputKey] = useState(Date.now());


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map(file => ({
        name: file.name,
        type: file.type,
        size: file.size,
      }));
      // Check for duplicates before adding
      const currentFileNames = files.map(f => f.name);
      const uniqueNewFiles = newFiles.filter(nf => !currentFileNames.includes(nf.name));
      
      setValue('files', [...files, ...uniqueNewFiles], { shouldValidate: true });
      
      if (uniqueNewFiles.length < newFiles.length) {
        toast({
          title: "Duplicate Files Skipped",
          description: "Some selected files were already in the list and were skipped.",
          variant: "default"
        });
      } else if (uniqueNewFiles.length > 0) {
         toast({
          title: "Files Added",
          description: `${uniqueNewFiles.length} file(s) added to the list. Note: Files are not yet uploaded.`,
          variant: "default"
        });
      }
      // Reset file input to allow selecting the same file again after removal
      setFileInputKey(Date.now());
    }
  }, [files, setValue, toast]);

  const removeFile = useCallback((index: number) => {
    const newFiles = [...files];
    const removedFile = newFiles.splice(index, 1);
    setValue('files', newFiles, { shouldValidate: true });
    toast({
        title: "File Removed",
        description: `"${removedFile[0].name}" removed from the list.`,
    });
  }, [files, setValue, toast]);

  return (
    <div className="space-y-8 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div>
          <Label htmlFor="maxTokens">Max Tokens</Label>
          <Controller
            name="maxTokens"
            control={control}
            rules={{ 
              required: "Max tokens is required",
              min: { value: 1, message: "Min tokens is 1" },
              max: { value: 16384, message: "Max tokens is 16384" },
              valueAsNumber: true,
            }}
            render={({ field }) => (
              <Input
                id="maxTokens"
                type="number"
                {...field}
                onChange={e => field.onChange(parseInt(e.target.value, 10))}
                className="mt-1"
              />
            )}
          />
          {errors.maxTokens && <p className="text-sm text-destructive mt-1">{errors.maxTokens.message}</p>}
          <p className="text-sm text-muted-foreground mt-1">
            Maximum number of tokens to generate. (e.g., 2048)
          </p>
        </div>

        <div>
          <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
          <Controller
            name="temperature"
            control={control}
            render={({ field }) => (
              <Slider
                id="temperature"
                min={0}
                max={1}
                step={0.1}
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
                className="mt-3"
              />
            )}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Controls randomness: Lower values make responses more deterministic (0.0 - 1.0).
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Knowledge Files</h3>
        <div className="p-6 border border-dashed rounded-lg bg-card/50 text-center">
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
          <label
            htmlFor="file-upload"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring cursor-pointer"
          >
            Select Files to Add
          </label>
          <Input
            id="file-upload"
            key={fileInputKey} // To reset the input
            type="file"
            multiple
            className="sr-only"
            onChange={handleFileChange}
            accept=".txt,.pdf,.md,.json,.csv,.html,.docx,.pptx" 
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Supported: TXT, PDF, MD, JSON, CSV, HTML, DOCX, PPTX. Max 10 files, 5MB each.
          </p>
           <p className="mt-1 text-xs text-accent flex items-center justify-center">
            <AlertCircle size={14} className="mr-1" /> File upload functionality is for UI demonstration only.
          </p>
        </div>

        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Added Files:</h4>
            <ul className="max-h-60 overflow-y-auto rounded-md border bg-muted/30 p-2 space-y-1">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2 rounded bg-background shadow-sm text-sm">
                  <div className="flex items-center truncate">
                    <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-6 w-6">
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <SuggestedFiles />

      <div>
        <h3 className="text-lg font-medium text-foreground">Performance Metrics</h3>
        <div className="mt-2 p-4 border rounded-lg bg-card/50">
          <p className="text-sm text-muted-foreground">
            Real-time Latency Display: <span className="font-semibold text-foreground">~75ms (placeholder)</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            This is a placeholder for real-time performance metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
