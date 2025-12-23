import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api';

// Use Node.js runtime for external API calls
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const { uid } = params;

    if (!uid) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Call the cloud function
    const response = await fetch(`${API_ENDPOINTS.resendInvitation}/${uid}`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
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
    console.error('Error in resend invitation API route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

