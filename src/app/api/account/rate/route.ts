import { NextResponse } from 'next/server';
import { rateMovie, rateTVShow, deleteMovieRating } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { mediaType, mediaId, rating, sessionId } = await request.json();

    if (!mediaType || !mediaId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let success = false;

    if (rating === null || rating === 0) {
      // Delete rating
      if (mediaType === 'movie') {
        success = await deleteMovieRating(mediaId, sessionId);
      }
      // Note: TMDB doesn't have a delete rating endpoint for TV shows
    } else {
      if (mediaType === 'movie') {
        success = await rateMovie(mediaId, rating, sessionId);
      } else if (mediaType === 'tv') {
        success = await rateTVShow(mediaId, rating, sessionId);
      }
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Rate error:', error);
    return NextResponse.json(
      { error: 'Failed to rate' },
      { status: 500 }
    );
  }
}
