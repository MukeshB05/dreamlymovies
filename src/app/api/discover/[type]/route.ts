import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const page = searchParams.get('page') || '1';
  const genre = searchParams.get('genre');
  const company = searchParams.get('company');
  const network = searchParams.get('network');
  const sort = searchParams.get('sort') || 'popularity.desc';

  const mediaType = params.type === 'tv' ? 'tv' : 'movie';

  const queryParams = new URLSearchParams({
    api_key: API_KEY!,
    page,
    sort_by: sort,
  });

  if (genre) {
    queryParams.set('with_genres', genre);
  }

  if (mediaType === 'movie' && company) {
    queryParams.set('with_companies', company);
  }

  if (mediaType === 'tv' && network) {
    queryParams.set('with_networks', network);
  }

  try {
    const response = await fetch(
      `${BASE_URL}/discover/${mediaType}?${queryParams.toString()}`
    );

    if (!response.ok) {
      throw new Error('TMDB API Error');
    }

    const data = await response.json();

    const results = data.results.map((item: Record<string, unknown>) => ({
      ...item,
      media_type: mediaType,
    }));

    return NextResponse.json({
      results,
      total_pages: data.total_pages,
      total_results: data.total_results,
      page: data.page,
    });
  } catch {
    return NextResponse.json({ results: [], total_pages: 0 }, { status: 500 });
  }
}
