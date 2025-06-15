
'use client';

import React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { submitExampleForm, type FormState } from '@/app/actions/example-actions';
import ServerDataDisplay from '@/components/server-example/server-data-display';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Code, Send, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full md:w-auto">
      {pending ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Submitting...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" /> Submit Server Action
        </>
      )}
    </Button>
  );
}

export default function ServerFeaturesDemoPage() {
  const initialState: FormState = { message: '', success: false, errors: {} };
  const [state, formAction] = useFormState(submitExampleForm, initialState);
  const [apiUrl, setApiUrl] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiUrl(window.location.origin + '/api/example');
    }
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground">Next.js Server Features</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Explore API Routes, Server Actions, and Server Components.
        </p>
      </header>

      <ServerDataDisplay />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Send className="mr-2 h-6 w-6 text-primary" />
            Server Action Form
          </CardTitle>
          <CardDescription>
            This form submits data to a Server Action. The server-side logic runs without needing a separate API endpoint for this mutation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base">Your Name</Label>
              <Input id="name" name="name" type="text" placeholder="e.g., Jane Doe" className="mt-1" aria-describedby="name-error"/>
              {state.errors?.name && (
                <p id="name-error" className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{state.errors.name.join(', ')}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-base">Your Message</Label>
              <Textarea id="message" name="message" placeholder="Type your message here..." className="mt-1 min-h-[100px]" aria-describedby="message-error"/>
              {state.errors?.message && (
                <p id="message-error" className="text-sm text-destructive mt-1 flex items-center"><AlertCircle className="h-4 w-4 mr-1"/>{state.errors.message.join(', ')}</p>
              )}
            </div>
            <SubmitButton />
          </form>
          {state.message && (
            <Alert className={`mt-6 ${state.success ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-300 dark:border-green-500/30' : 'bg-destructive/10 border-destructive/50 text-destructive'}`} variant={state.success ? "default" : "destructive"}>
              {state.success ? <CheckCircle2 className={`h-5 w-5 mr-2 ${state.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`} /> : <AlertCircle className="h-5 w-5 mr-2 text-destructive" />}
              <div className="flex-grow">
                <AlertTitle className="font-semibold">{state.success ? 'Success!' : (state.errors?._form ? 'Server Error' : 'Info')}</AlertTitle>
                <AlertDescription className="text-sm">
                  {state.message}
                </AlertDescription>
              </div>
            </Alert>
          )}
           {state.errors?._form && !state.message && ( // Show general form error if no specific success/fail message
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-5 w-5 mr-2" />
              <div className="flex-grow">
                <AlertTitle className="font-semibold">Form Error</AlertTitle>
                <AlertDescription className="text-sm">
                  {state.errors._form.join(', ')}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Code className="mr-2 h-6 w-6 text-primary" />
            API Route
          </CardTitle>
          <CardDescription>
            An example of a traditional API route. You can test this by opening the link below or using a tool like cURL.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {apiUrl ? (
            <a href={apiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary hover:underline">
              Test API: {apiUrl} <ExternalLink className="ml-2 h-4 w-4"/>
            </a>
          ) : (
            <p className="text-muted-foreground text-sm">Loading API URL...</p>
          )}
          <p className="text-sm text-muted-foreground">
            Example cURL command: <code className="bg-muted p-1 rounded text-xs text-foreground">curl {apiUrl || 'your-app-url/api/example'}</code>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
