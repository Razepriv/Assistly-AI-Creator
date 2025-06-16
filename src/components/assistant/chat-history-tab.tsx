
"use client";

import React, { useState } from 'react';
import { useChatStore } from '@/store/chat-store';
import type { ChatSession, ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Bot, User, MessageSquare, CalendarDays } from 'lucide-react';
import { format, parseISO } from 'date-fns'; // For date formatting
import { nanoid } from 'nanoid';

interface ChatHistoryTabProps {
  assistantId: string;
}

export default function ChatHistoryTab({ assistantId }: ChatHistoryTabProps) {
  const { 
    getSessionsByAssistantId, 
    getSessionById,
    addMessageToSession, 
    addSession 
  } = useChatStore();

  const sessions = getSessionsByAssistantId(assistantId);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const selectedSession = selectedSessionId ? getSessionById(selectedSessionId) : null;

  const handleAddTestUserMessage = () => {
    if (selectedSessionId) {
      addMessageToSession(selectedSessionId, {
        role: 'user',
        content: `This is a test user message at ${new Date().toLocaleTimeString()}`,
      });
      // Force re-fetch of selected session to update messages
      setSelectedSessionId(null); // Deselect
      setTimeout(() => setSelectedSessionId(selectedSessionId), 0); // Reselect to trigger re-render with new message
    } else {
      alert("Please select a session first to add a message.");
    }
  };

  const handleAddTestAssistantMessage = () => {
     if (selectedSessionId) {
      addMessageToSession(selectedSessionId, {
        role: 'assistant',
        content: `This is a test assistant response at ${new Date().toLocaleTimeString()}`,
      });
      setSelectedSessionId(null); 
      setTimeout(() => setSelectedSessionId(selectedSessionId), 0); 
    } else {
      alert("Please select a session first to add a message.");
    }
  }

  const handleCreateNewSession = () => {
    const newUserId = `test_user_${nanoid(4)}`;
    const newSession = addSession(assistantId, newUserId);
    setSelectedSessionId(newSession.id);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1">
      {/* Sessions List */}
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="mr-2 h-5 w-5 text-primary" />
              Chat Sessions
            </CardTitle>
            <CardDescription>Select a session to view its history.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleCreateNewSession} className="w-full mb-4">
              Create New Test Session
            </Button>
            <ScrollArea className="h-[calc(100vh-20rem)]"> {/* Adjust height as needed */}
              {sessions.length > 0 ? (
                <ul className="space-y-2">
                  {sessions.map((session) => (
                    <li key={session.id}>
                      <Button
                        variant={selectedSessionId === session.id ? 'default' : 'outline'}
                        className="w-full justify-start text-left h-auto py-2"
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <div className="flex flex-col">
                           <span className="font-semibold truncate">User ID: {session.userId}</span>
                           <span className="text-xs text-muted-foreground">
                            {format(parseISO(session.startTime), 'MMM d, yyyy h:mm a')}
                           </span>
                           <span className="text-xs text-muted-foreground">
                             {session.messages.length} message(s)
                           </span>
                        </div>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-muted-foreground py-4">No chat sessions found for this assistant.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Messages View */}
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5 text-primary" />
              Session Details
            </CardTitle>
            {selectedSession ? (
                <CardDescription>
                    Chat with User ID: {selectedSession.userId} (Started: {format(parseISO(selectedSession.startTime), 'PPpp')})
                </CardDescription>
            ) : (
                <CardDescription>Select a session to view messages.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <>
                <div className="flex gap-2 mb-4">
                    <Button onClick={handleAddTestUserMessage} variant="secondary" size="sm">Add Test User Msg</Button>
                    <Button onClick={handleAddTestAssistantMessage} variant="secondary" size="sm">Add Test Assistant Msg</Button>
                </div>
                <ScrollArea className="h-[calc(100vh-24rem)] border rounded-md p-4 bg-muted/20"> {/* Adjust height */}
                  {selectedSession.messages.length > 0 ? (
                    <div className="space-y-4">
                      {selectedSession.messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-3 ${
                            msg.role === 'user' ? 'justify-end' : ''
                          }`}
                        >
                          {msg.role === 'assistant' && (
                            <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                          )}
                          <div
                            className={`max-w-[75%] p-3 rounded-lg shadow ${
                              msg.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-background border'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                              {format(parseISO(msg.timestamp), 'h:mm a')}
                            </p>
                          </div>
                          {msg.role === 'user' && (
                            <User className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No messages in this session yet.</p>
                  )}
                </ScrollArea>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-24rem)] text-muted-foreground p-6 border border-dashed rounded-md">
                <AlertCircle className="h-10 w-10 mb-4" />
                <p>Please select a chat session from the list on the left to view its messages.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
