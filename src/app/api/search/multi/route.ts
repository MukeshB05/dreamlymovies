import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const page = searchParams.get('page') || '1';

  if (!query) {
    return NextResponse.json({ results: [], total_pages: 0 });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );

    if (!response.ok) {
      throw new Error('TMDB API Error');
    }

    const data = await response.json();
    const filtered = data.results.filter(
      (item: { media_type: string }) =>
        item.media_type === 'movie' || item.media_type === 'tv'
    );

    return NextResponse.json({
      results: filtered,
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page,
    });
  } catch {
    return NextResponse.json({ results: [], total_pages: 0 }, { status: 500 });
  }
}
