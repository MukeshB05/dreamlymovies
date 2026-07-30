import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`
    );

    if (!response.ok) {
      throw new Error('TMDB API Error');
    }

    const data = await response.json();
    const filtered = data.results
      .filter((item: { media_type: string }) =>
        item.media_type === 'movie' || item.media_type === 'tv'
      )
      .slice(0, 8);

    return NextResponse.json({ results: filtered });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
