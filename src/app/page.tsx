"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAssistantStore } from '@/store/assistant-store';

export default function HomePage() {
  const router = useRouter();
  const activeAssistantId = useAssistantStore((state) => state.activeAssistantId);
  const assistants = useAssistantStore((state) => state.assistants);

  useEffect(() => {
    if (activeAssistantId) {
      router.replace(`/assistant/${activeAssistantId}`);
    } else if (assistants.length > 0) {
      router.replace(`/assistant/${assistants[0].id}`);
    } else {
      // If no assistants, router.replace to a welcome/create page or handle in (app)/page.tsx
      router.replace('/welcome'); // Or stay on current page which will be handled by (app)/page.tsx
    }
  }, [activeAssistantId, assistants, router]);

  // Render a loading state or minimal content while redirecting
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <p className="text-foreground">Loading Assistly...</p>
    </div>
  );
}
