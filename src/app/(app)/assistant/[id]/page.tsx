import ConfigPanelClientWrapper from '@/components/assistant/config-panel-client-wrapper';

interface AssistantPageProps {
  params: {
    id: string;
  };
}

export default function AssistantPage({ params }: AssistantPageProps) {
  return (
    <div className="h-full flex flex-col">
      <ConfigPanelClientWrapper assistantId={params.id} />
    </div>
  );
}

export async function generateStaticParams() {
  // This function is optional if you don't want to pre-render specific assistant pages at build time.
  // If you have a known list of assistants you want to pre-render, you can return them here.
  // For a dynamic app, this might fetch from a DB or use a predefined list.
  // For now, we'll return an empty array, meaning pages will be generated on demand.
  return [];
}
