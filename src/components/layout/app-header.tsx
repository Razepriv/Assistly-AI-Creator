
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Search, TestTube2, MessageSquare, RadioTower, Settings, UserCircle, Menu, Bot } from 'lucide-react';
import { useAssistantStore } from '@/store/assistant-store';
import EditableAssistantName from '@/components/assistant/editable-assistant-name';
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import TestAssistantDialog from '@/components/assistant/test-assistant-dialog'; // New Import

export default function AppHeader() {
  const activeAssistantId = useAssistantStore((state) => state.activeAssistantId);
  const { isMobile } = useSidebar();
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger className="md:hidden -ml-2" />}
          {!isMobile && <Bot className="h-6 w-6 text-primary" />}
          <h1 className="text-xl font-semibold hidden md:block">Assistly</h1>
        </div>
        
        <div className="flex-1 flex justify-center items-center">
          {activeAssistantId && <EditableAssistantName />}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Global Search..."
              className="pl-8 sm:w-[200px] md:w-[250px] lg:w-[300px] bg-muted"
            />
          </div>
          
          {activeAssistantId && (
              <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="hidden sm:flex"
                    onClick={() => setIsTestDialogOpen(true)}
                  >
                    <TestTube2 className="mr-2 h-4 w-4" /> Test
                  </Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex"><MessageSquare className="mr-2 h-4 w-4" /> Chat</Button>
                  <Button variant="outline" size="sm" className="hidden sm:flex"><RadioTower className="mr-2 h-4 w-4" /> Talk</Button>
                  <Button variant="default" size="sm" className="hidden sm:flex">Publish</Button>
              </>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <UserCircle className="h-6 w-6" />
                <span className="sr-only">User Menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Account</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {activeAssistantId && (
        <TestAssistantDialog
          open={isTestDialogOpen}
          onOpenChange={setIsTestDialogOpen}
          assistantId={activeAssistantId}
        />
      )}
    </>
  );
}
