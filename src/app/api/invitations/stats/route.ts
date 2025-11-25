import { NextRequest, NextResponse } from 'next/server';
import { API_ENDPOINTS } from '@/lib/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Call the cloud function
    const response = await fetch(API_ENDPOINTS.getInvitationStats, {
      method: 'GET',
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
    console.error('Error in invitation stats API route:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

