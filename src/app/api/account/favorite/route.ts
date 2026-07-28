import { NextResponse } from 'next/server';
import { addToFavorites } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { accountId, mediaType, mediaId, favorite, sessionId } = await request.json();

    if (!accountId || !mediaType || !mediaId || favorite === undefined || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await addToFavorites(accountId, mediaType, mediaId, favorite, sessionId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Favorite error:', error);
    return NextResponse.json(
      { error: 'Failed to update favorites' },
      { status: 500 }
    );
  }
}
