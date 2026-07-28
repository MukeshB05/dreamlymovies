import { NextResponse } from 'next/server';
import { addToWatchlist } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { accountId, mediaType, mediaId, watchlist, sessionId } = await request.json();

    if (!accountId || !mediaType || !mediaId || watchlist === undefined || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await addToWatchlist(accountId, mediaType, mediaId, watchlist, sessionId);

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Watchlist error:', error);
    return NextResponse.json(
      { error: 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}
