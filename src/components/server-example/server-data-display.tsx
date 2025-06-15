
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks } from 'lucide-react';

async function fetchData(): Promise<string[]> {
  // Simulate an asynchronous data fetch on the server
  await new Promise(resolve => setTimeout(resolve, 300));
  return [
    `Server-Fetched Item 1: Generated at ${new Date().toLocaleTimeString()}`,
    `Server-Fetched Item 2: Random Number from server ${Math.floor(Math.random() * 1000)}`,
    'Server-Fetched Item 3: This content is pre-rendered on the server.',
  ];
}

export default async function ServerDataDisplay() {
  const data = await fetchData();

  return (
    <Card className="w-full shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ListChecks className="mr-2 h-6 w-6 text-primary" />
          Server Component Data
        </CardTitle>
        <CardDescription>
          This data is fetched and rendered on the server before being sent to the client. Notice the dynamic values change on refresh if caching is disabled for the route.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ul className="space-y-2">
            {data.map((item, index) => (
              <li key={index} className="p-3 bg-muted/50 rounded-md text-sm border border-border">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">No data available.</p>
        )}
      </CardContent>
    </Card>
  );
}
