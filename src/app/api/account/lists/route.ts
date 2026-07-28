import { NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const sessionId = searchParams.get('sessionId');
    const listType = searchParams.get('listType'); // 'watchlist', 'favorites', 'rated'
    const mediaType = searchParams.get('mediaType'); // 'movies', 'tv'
    const page = searchParams.get('page') || '1';

    if (!accountId || !sessionId || !listType || !mediaType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let endpoint = '';
    if (listType === 'watchlist') {
      endpoint = `${BASE_URL}/account/${accountId}/watchlist/${mediaType}`;
    } else if (listType === 'favorites') {
      endpoint = `${BASE_URL}/account/${accountId}/favorite/${mediaType}`;
    } else if (listType === 'rated') {
      endpoint = `${BASE_URL}/account/${accountId}/rated/${mediaType}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid list type' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${endpoint}?api_key=${TMDB_API_KEY}&session_id=${sessionId}&sort_by=created_at.desc&page=${page}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch list');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('List fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch list' },
      { status: 500 }
    );
  }
}
