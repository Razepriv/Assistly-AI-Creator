
"use client";

import React, { useState, useCallback } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, X, AlertCircle, Zap, Loader2 } from 'lucide-react';
import SuggestedFiles from '@/components/assistant/suggested-files';
import type { AssistantConfig, FileMetadata } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useConfigStore } from '@/store/config-store'; // Import useConfigStore

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function AdvancedSettingsTab() {
  const { control, watch, setValue, formState: { errors } } = useFormContext<AssistantConfig>();
  const { toast } = useToast();

  const assistantId = watch('id'); // Get current assistant's ID
  const runtimeLatencies = useConfigStore((state) => state.runtimeLatencies);
  const latestLatency = assistantId ? runtimeLatencies[assistantId] : null;

  const files = watch('files', []);
  const temperature = watch('temperature', 0.7);

  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files);
      const currentFiles = files || [];
      let newFilesToAdd: FileMetadata[] = [];
      let skippedFilesCount = 0;
      let oversizedFilesCount = 0;
      let totalFilesAfterAdd = currentFiles.length;

      const fileReadPromises = selectedFiles.map(file => {
        return new Promise<FileMetadata | null>((resolve) => {
          if (currentFiles.some(f => f.name === file.name)) {
            skippedFilesCount++;
            resolve(null); 
            return;
          }
          if (file.size > MAX_FILE_SIZE_BYTES) {
            oversizedFilesCount++;
            resolve(null); 
            return;
          }
          if (totalFilesAfterAdd >= MAX_FILES) {
            resolve(null); 
            return;
          }
          
          totalFilesAfterAdd++;
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              dataUri: e.target?.result as string,
            });
          };
          reader.onerror = () => {
            resolve(null); 
          };
          reader.readAsDataURL(file);
        });
      });

      const results = await Promise.all(fileReadPromises);
      newFilesToAdd = results.filter(Boolean) as FileMetadata[];

      if (newFilesToAdd.length > 0) {
        setValue('files', [...currentFiles, ...newFilesToAdd], { shouldValidate: true, shouldDirty: true });
        toast({
          title: "Files Processed",
          description: `${newFilesToAdd.length} file(s) added. ${skippedFilesCount > 0 ? `${skippedFilesCount} duplicates skipped. ` : ''}${oversizedFilesCount > 0 ? `${oversizedFilesCount} oversized files skipped. ` : ''}${totalFilesAfterAdd > MAX_FILES ? `File limit of ${MAX_FILES} reached, some files not added.` : ''} Note: Files are not yet uploaded.`,
          variant: "default"
        });
      } else if (skippedFilesCount > 0 || oversizedFilesCount > 0 || (selectedFiles.length > 0 && totalFilesAfterAdd > MAX_FILES && currentFiles.length < MAX_FILES) ) {
         toast({
          title: "Files Skipped",
          description: `${skippedFilesCount > 0 ? `${skippedFilesCount} duplicates skipped. ` : ''}${oversizedFilesCount > 0 ? `${oversizedFilesCount} oversized files skipped. ` : ''}${selectedFiles.length > 0 && totalFilesAfterAdd >= MAX_FILES && newFilesToAdd.length === 0 ? `File limit of ${MAX_FILES} reached.` : ''}`,
          variant: "default"
        });
      }
      
      setFileInputKey(Date.now()); 
    }
  }, [files, setValue, toast]);

  const removeFile = useCallback((index: number) => {
    const newFiles = [...files];
    const removedFile = newFiles.splice(index, 1);
    setValue('files', newFiles, { shouldValidate: true, shouldDirty: true });
    if (removedFile.length > 0) {
      toast({
          title: "File Removed",
          description: `"${removedFile[0].name}" removed from the list.`,
      });
    }
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
                value={field.value || ''} 
                onChange={e => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                }}
                onBlur={field.onBlur}
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
          <Label htmlFor="temperature">Temperature: {Number(temperature).toFixed(1)}</Label>
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
          {errors.temperature && <p className="text-sm text-destructive mt-1">{errors.temperature.message}</p>}
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
            key={fileInputKey}
            type="file"
            multiple
            className="sr-only"
            onChange={handleFileChange}
            accept=".txt,.pdf,.md,.json,.csv,.html,.docx,.pptx" 
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Supported: TXT, PDF, MD, JSON, CSV, HTML, DOCX, PPTX. Max {MAX_FILES} files, {MAX_FILE_SIZE_MB}MB each.
          </p>
           {errors.files && <p className="text-sm text-destructive mt-1">{errors.files.message || (errors.files as any)?.root?.message}</p>}
           <p className="mt-1 text-xs text-accent flex items-center justify-center">
            <AlertCircle size={14} className="mr-1" /> File content is read for use, actual upload to a server is not implemented.
          </p>
        </div>

        {files && files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="font-medium">Added Files ({files.length}/{MAX_FILES}):</h4>
            <ul className="max-h-60 overflow-y-auto rounded-md border bg-muted/30 p-2 space-y-1">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between p-2 rounded bg-background shadow-sm text-sm">
                  <div className="flex items-center truncate">
                    <FileText className="h-4 w-4 mr-2 text-primary flex-shrink-0" />
                    <span className="truncate" title={file.name}>{file.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index)} className="h-6 w-6">
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
        <h3 className="text-lg font-medium text-foreground flex items-center">
          <Zap className="mr-2 h-5 w-5 text-primary" />
          Performance Metrics
        </h3>
        <div className="mt-2 p-4 border rounded-lg bg-card/50">
          {latestLatency !== null && latestLatency !== undefined ? (
            <p className="text-sm text-foreground">
              Latest AI Response Latency: <span className="font-semibold text-primary">{latestLatency}ms</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No latency data yet. Run a test in the "Test Assistant" dialog.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            This value updates in real-time as you interact with the assistant in the "Test Assistant" dialog.
          </p>
        </div>
      </div>
    </div>
  );
}
