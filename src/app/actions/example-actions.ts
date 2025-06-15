
'use server';

import { z } from 'zod';

const FormDataSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  message: z.string().min(5, { message: 'Message must be at least 5 characters' }),
});

export interface FormState {
  message: string;
  errors?: {
    name?: string[];
    message?: string[];
    _form?: string[];
  };
  success: boolean;
}

export async function submitExampleForm(prevState: FormState, formData: FormData): Promise<FormState> {
  const validatedFields = FormDataSchema.safeParse({
    name: formData.get('name'),
    message: formData.get('message'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check the fields.',
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  const { name, message } = validatedFields.data;

  console.log('Server Action received:');
  console.log('Name:', name);
  console.log('Message:', message);

  // Simulate some server-side processing (e.g., saving to a database)
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Example: if (name === 'error') throw new Error("Simulated server error");
  } catch (e) {
    return {
      message: 'An error occurred on the server.',
      errors: { _form: ['Failed to process the form due to a server issue.'] },
      success: false,
    }
  }

  return {
    message: `Form submitted successfully by ${name}! Your message: "${message}" was received by the Server Action.`,
    success: true,
  };
}
