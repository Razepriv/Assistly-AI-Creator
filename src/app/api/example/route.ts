
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({ message: 'Hello from the API route!', timestamp: new Date().toISOString() });
}
