"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAssistantStore } from '@/store/assistant-store';
import { useConfigStore } from '@/store/config-store';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

export function CreateAssistantDialog({ onOpenChange, open }: { onOpenChange: (open: boolean) => void; open: boolean; }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const addAssistant = useAssistantStore((state) => state.addAssistant);
  const setActiveAssistantId = useAssistantStore((state) => state.setActiveAssistantId);
  const createConfig = useConfigStore((state) => state.createConfig);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Assistant name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    const newAssistant = addAssistant({ name, description });
    createConfig(newAssistant.id, newAssistant.name);
    setActiveAssistantId(newAssistant.id);
    router.push(`/assistant/${newAssistant.id}`);
    toast({
      title: "Assistant Created",
      description: `"${newAssistant.name}" has been successfully created.`,
    });
    setName('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full">
          <PlusCircle className="mr-2 h-5 w-5" />
          Create Assistant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Create New Assistant</DialogTitle>
          <DialogDescription>
            Set up a new AI assistant. You can configure its behavior and capabilities later.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Customer Support Bot"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Briefly describe the assistant's purpose (optional)"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>Create Assistant</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
