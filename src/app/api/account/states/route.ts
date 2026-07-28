import { NextResponse } from 'next/server';
import { getMovieAccountStates, getTVAccountStates } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType');
    const mediaId = searchParams.get('mediaId');
    const sessionId = searchParams.get('sessionId');

    if (!mediaType || !mediaId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let states;
    if (mediaType === 'movie') {
      states = await getMovieAccountStates(parseInt(mediaId), sessionId);
    } else if (mediaType === 'tv') {
      states = await getTVAccountStates(parseInt(mediaId), sessionId);
    } else {
      return NextResponse.json(
        { error: 'Invalid media type' },
        { status: 400 }
      );
    }

    return NextResponse.json(states);
  } catch (error) {
    console.error('Account states error:', error);
    return NextResponse.json(
      { error: 'Failed to get account states' },
      { status: 500 }
    );
  }
}
