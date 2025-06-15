"use client";
import { Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateAssistantDialog } from '@/components/assistant/create-assistant-dialog';
import { useState } from 'react';

export default function AppDashboardPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 rounded-lg border border-dashed shadow-sm p-8 text-center bg-card">
      <Bot className="h-24 w-24 text-primary" />
      <div className="flex flex-col items-center gap-2">
        <h2 className="text-3xl font-bold tracking-tight text-card-foreground font-headline">
          Welcome to Assistly
        </h2>
        <p className="text-lg text-muted-foreground max-w-md">
          Select an assistant from the sidebar to start configuring, or create a new one to unlock powerful AI capabilities.
        </p>
      </div>
      <CreateAssistantDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <Button size="lg">
          <Sparkles className="mr-2 h-5 w-5" />
          Create Your First Assistant
        </Button>
      </CreateAssistantDialog>
      <p className="text-sm text-muted-foreground mt-4">
        Powered by cutting-edge AI technology.
      </p>
    </div>
  );
}

