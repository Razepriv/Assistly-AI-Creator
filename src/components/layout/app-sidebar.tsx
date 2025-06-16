
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAssistantStore } from '@/store/assistant-store';
import { useConfigStore } from '@/store/config-store';
import { Bot, Search, ChevronDown, ChevronRight, Trash2, PlusCircle, Server } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Assistant } from '@/types';

interface AssistantNavItemProps {
  assistant: Assistant;
  isActive: boolean;
  onClick: (id: string) => void;
  onDelete: (assistant: Assistant) => void;
}

const AssistantNavItem = React.memo(function AssistantNavItem({ assistant, isActive, onClick, onDelete }: AssistantNavItemProps) {
  const handleClick = useCallback(() => {
    onClick(assistant.id);
  }, [onClick, assistant.id]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(assistant);
  }, [onDelete, assistant]);

  return (
    <div className={`group relative flex items-center rounded-lg transition-colors hover:bg-sidebar-accent ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'}`}>
      <button
        onClick={handleClick}
        className={`flex-grow items-center px-3 py-2 text-left ${isActive ? 'font-semibold' : ''}`}
        style={{ all: 'unset', display: 'flex', alignItems: 'center', cursor: 'pointer', width: 'calc(100% - 2.5rem)' }}
      >
        <Bot className="mr-2 h-4 w-4 flex-shrink-0" />
        <span className="truncate max-w-[150px]">{assistant.name}</span>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 focus:opacity-100 text-destructive hover:bg-destructive/10"
        onClick={handleDelete}
        aria-label={`Delete ${assistant.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
});

interface CategoryHeaderButtonProps {
  name: string;
  isExpanded: boolean;
  onToggle: (name: string) => void;
}

const CategoryHeaderButton = React.memo(function CategoryHeaderButton({ name, isExpanded, onToggle }: CategoryHeaderButtonProps) {
  const handleToggle = useCallback(() => {
    onToggle(name);
  }, [name, onToggle]);

  return (
    <Button
      variant="ghost"
      className="w-full justify-between text-sidebar-foreground/70 hover:text-sidebar-foreground"
      onClick={handleToggle}
    >
      {name}
      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </Button>
  );
});


export default function AppSidebar() {
  const allAssistantsFromStore = useAssistantStore((state) => state.assistants);
  const searchQuery = useAssistantStore((state) => state.searchQuery);
  const activeAssistantId = useAssistantStore((state) => state.activeAssistantId);

  const setActiveAssistantId = useAssistantStore((state) => state.setActiveAssistantId);
  const setSearchQuery = useAssistantStore((state) => state.setSearchQuery);
  const deleteAssistant = useAssistantStore((state) => state.deleteAssistant);
  const deleteConfig = useConfigStore((state) => state.deleteConfig);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(null);

  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const pathParts = pathname.split('/assistant/');
    const currentIdFromPath = pathParts[1]?.split('/')[0]; // More robust split

    if (currentIdFromPath && currentIdFromPath !== activeAssistantId && !pathname.startsWith('/server-features-demo')) {
      setActiveAssistantId(currentIdFromPath);
    }
  }, [pathname, activeAssistantId, setActiveAssistantId]);

  const handleAssistantClick = useCallback((id: string) => {
    setActiveAssistantId(id);
    router.push(`/assistant/${id}`);
  }, [setActiveAssistantId, router]);

  const requestDeleteAssistant = useCallback((assistant: Assistant) => {
    setAssistantToDelete(assistant);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (assistantToDelete) {
      const assistantName = assistantToDelete.name;
      const deletedAssistantId = assistantToDelete.id;
      
      // Important: Get the current active ID *before* updating the store
      const currentActiveId = activeAssistantId;
      
      deleteAssistant(deletedAssistantId);
      deleteConfig(deletedAssistantId);
      
      toast({
        title: "Assistant Deleted",
        description: `"${assistantName}" has been deleted.`,
      });

      if (currentActiveId === deletedAssistantId) {
        // Fetch assistants *after* deletion to determine next active
        // This needs to read from the store *after* the delete operation has been processed
        // One way to handle this is to rely on the store's updated state in the next render cycle.
        // Or, derive remaining assistants from the current list before deleting.
        const remainingAssistants = allAssistantsFromStore.filter(a => a.id !== deletedAssistantId);
        if (remainingAssistants.length > 0) {
          const newActive = remainingAssistants[0];
          setActiveAssistantId(newActive.id);
          router.push(`/assistant/${newActive.id}`);
        } else {
          setActiveAssistantId(null);
          router.push('/');
        }
      }
      setAssistantToDelete(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantToDelete, deleteAssistant, deleteConfig, toast, activeAssistantId, router, setActiveAssistantId, allAssistantsFromStore]);


  const assistants = useMemo(() => {
    if (!searchQuery) {
      return allAssistantsFromStore;
    }
    return allAssistantsFromStore.filter(
      (assistant) =>
        assistant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assistant.description && assistant.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allAssistantsFromStore, searchQuery]);

  const categories = useMemo(() => {
    return Array.from(new Set(assistants.map(a => a.category).filter(Boolean as (value: string | undefined) => value is string)));
  }, [assistants]);

  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExpandedCategories(prevExpanded => {
      const newExpanded = { ...prevExpanded };
      let changed = false;
      for (const cat of categories) {
        if (!(cat in newExpanded)) {
          newExpanded[cat] = true; 
          changed = true;
        }
      }
      for (const existingCat in newExpanded) {
        if (!categories.includes(existingCat)) {
          delete newExpanded[existingCat];
          changed = true;
        }
      }
      return changed ? newExpanded : prevExpanded;
    });
  }, [categories]);


  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }));
  }, [setExpandedCategories]);

  const categorizedAssistants = useMemo(() => {
    return categories.map(categoryName => ({
      name: categoryName,
      assistants: assistants.filter(a => a.category === categoryName)
    }));
  }, [categories, assistants]);

  const uncategorizedAssistants = useMemo(() => {
    return assistants.filter(a => !a.category);
  }, [assistants]);


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
          <Link
            href="/server-features-demo"
            className={`group flex items-center rounded-lg px-3 py-2 mb-2 transition-colors hover:bg-sidebar-accent ${
              pathname === '/server-features-demo'
                ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold'
                : 'text-sidebar-foreground hover:text-sidebar-accent-foreground'
            }`}
          >
            <Server className="mr-2 h-4 w-4 flex-shrink-0" />
            Server Features
          </Link>

          {categorizedAssistants.map(categoryGroup => (
            <div key={categoryGroup.name} className="py-1">
              <CategoryHeaderButton
                name={categoryGroup.name}
                isExpanded={!!expandedCategories[categoryGroup.name]}
                onToggle={toggleCategory}
              />
              {expandedCategories[categoryGroup.name] && categoryGroup.assistants.map((assistant) => (
                <AssistantNavItem
                  key={assistant.id}
                  assistant={assistant}
                  isActive={activeAssistantId === assistant.id && pathname.startsWith('/assistant/')}
                  onClick={handleAssistantClick}
                  onDelete={requestDeleteAssistant}
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
                  onClick={handleAssistantClick}
                  onDelete={requestDeleteAssistant}
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
