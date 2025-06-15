
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantStore, selectFilteredAssistants } from '@/store/assistant-store';
import { useConfigStore } from '@/store/config-store';
import { Bot, Search, ChevronDown, ChevronRight, Trash2, PlusCircle, Server } from 'lucide-react'; // Added Server icon
import { CreateAssistantDialog } from '@/components/assistant/create-assistant-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger, // No longer directly used by AssistantNavItem here
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Assistant } from '@/types';

export default function AppSidebar() {
  const assistants = useAssistantStore(selectFilteredAssistants);
  const activeAssistantId = useAssistantStore((state) => state.activeAssistantId);
  const setActiveAssistantId = useAssistantStore((state) => state.setActiveAssistantId);
  const searchQuery = useAssistantStore((state) => state.searchQuery);
  const setSearchQuery = useAssistantStore((state) => state.setSearchQuery);
  const deleteAssistant = useAssistantStore((state) => state.deleteAssistant);
  const deleteConfig = useConfigStore((state) => state.deleteConfig);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const currentIdFromPath = pathname.split('/assistant/')[1];
    if (currentIdFromPath && currentIdFromPath !== activeAssistantId && !pathname.startsWith('/server-features-demo')) {
      setActiveAssistantId(currentIdFromPath);
    }
  }, [pathname, activeAssistantId, setActiveAssistantId]);


  const handleAssistantClick = (id: string) => {
    setActiveAssistantId(id);
    router.push(`/assistant/${id}`);
  };

  const handleDeleteConfirm = () => {
    if (assistantToDelete) {
      const assistantName = assistantToDelete.name;
      deleteAssistant(assistantToDelete.id);
      deleteConfig(assistantToDelete.id);
      toast({
        title: "Assistant Deleted",
        description: `"${assistantName}" has been deleted.`,
      });
      if (activeAssistantId === assistantToDelete.id) {
        // Determine next assistant to activate or redirect to dashboard
        const remainingAssistants = assistants.filter(a => a.id !== assistantToDelete.id);
        if (remainingAssistants.length > 0) {
            const newActive = remainingAssistants[0];
            setActiveAssistantId(newActive.id);
            router.push(`/assistant/${newActive.id}`);
        } else {
            setActiveAssistantId(null);
            router.push('/'); // Navigate to a general page or dashboard
        }
      }
      setAssistantToDelete(null);
    }
  };

  const categories = Array.from(new Set(assistants.map(a => a.category).filter(Boolean)));
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    categories.reduce((acc, cat) => ({ ...acc, [cat!]: true }), {})
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const categorizedAssistants = categories.map(category => ({
    name: category!,
    assistants: assistants.filter(a => a.category === category)
  }));
  const uncategorizedAssistants = assistants.filter(a => !a.category);

  return (
    <div className="flex h-full flex-col border-r bg-sidebar text-sidebar-foreground">
      <div className="p-4 space-y-4">
        <CreateAssistantDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-sidebar-foreground/50" />
          <Input
            type="search"
            placeholder="Search assistants..."
            className="w-full bg-sidebar-accent pl-8 text-sidebar-foreground placeholder:text-sidebar-foreground/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start px-4 text-sm font-medium">
          {/* Link to Server Features Demo Page */}
          <Link
            href="/server-features-demo"
            onClick={() => {
              // Optionally clear active assistant, or set a general app state
              // For now, let's not change activeAssistantId unless explicitly needed
              // setActiveAssistantId(null); 
            }}
            className={`group flex items-center rounded-lg px-3 py-2 mb-2 transition-colors hover:bg-sidebar-accent ${
              pathname === '/server-features-demo'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold' // Use primary for active demo link
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
            }`}
          >
            <Server className="mr-2 h-4 w-4 flex-shrink-0" />
            Server Features
          </Link>

          {categorizedAssistants.map(category => (
            <div key={category.name} className="py-1">
              <Button
                variant="ghost"
                className="w-full justify-between text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={() => toggleCategory(category.name)}
              >
                {category.name}
                {expandedCategories[category.name] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              {expandedCategories[category.name] && category.assistants.map((assistant) => (
                <AssistantNavItem
                  key={assistant.id}
                  assistant={assistant}
                  isActive={activeAssistantId === assistant.id && pathname.startsWith('/assistant/')}
                  onClick={() => handleAssistantClick(assistant.id)}
                  onDelete={() => setAssistantToDelete(assistant)}
                />
              ))}
            </div>
          ))}
          {uncategorizedAssistants.length > 0 && (
            <div className="py-1">
              {categorizedAssistants.length > 0 && <div className="px-2 py-1 text-xs text-sidebar-foreground/50">Other Assistants</div>}
              {uncategorizedAssistants.map((assistant) => (
                <AssistantNavItem
                  key={assistant.id}
                  assistant={assistant}
                  isActive={activeAssistantId === assistant.id && pathname.startsWith('/assistant/')}
                  onClick={() => handleAssistantClick(assistant.id)}
                  onDelete={() => setAssistantToDelete(assistant)}
                />
              ))}
            </div>
          )}
          {assistants.length === 0 && !searchQuery && (
            <div className="p-4 text-center text-sidebar-foreground/70">
              No assistants created yet.
            </div>
          )}
          {assistants.length === 0 && searchQuery && (
             <div className="p-4 text-center text-sidebar-foreground/70">
              No assistants found for "{searchQuery}".
            </div>
          )}
        </nav>
      </ScrollArea>
      <AlertDialog open={!!assistantToDelete} onOpenChange={(open) => !open && setAssistantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete "{assistantToDelete?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the assistant and its configuration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAssistantToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface AssistantNavItemProps {
  assistant: Assistant;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function AssistantNavItem({ assistant, isActive, onClick, onDelete }: AssistantNavItemProps) {
  return (
    <div className={`group relative flex items-center rounded-lg transition-colors hover:bg-sidebar-accent ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'}`}>
      {/* Wrapper Link/Button for the main navigation part */}
      <button
        onClick={onClick}
        className={`flex-grow items-center px-3 py-2 text-left ${isActive ? 'font-semibold' : ''}`}
        style={{ all: 'unset', display: 'flex', alignItems: 'center', cursor: 'pointer', width: 'calc(100% - 2.5rem)' }} // Ensure it takes space for click
      >
        <Bot className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate max-w-[150px]">{assistant.name}</span>
      </button>
      
      {/* Delete Button */}
      <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:bg-destructive/10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          aria-label={`Delete ${assistant.name}`}
        >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
