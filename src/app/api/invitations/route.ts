import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api';

// Use Node.js runtime for external API calls
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, name, role } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { message: 'Email, name, and role are required' },
        { status: 400 }
      );
    }

    // Call the cloud function
    const response = await fetch(API_ENDPOINTS.inviteUser, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, role }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return NextResponse.json(
        { message: errorData.message || `HTTP error! status: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in invitation API route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

