import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const page = searchParams.get('page') || '1';
  const source = searchParams.get('source') || 'recommendations';

  if (!id || !type) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }

  if (!['movie', 'tv'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  if (!['recommendations', 'similar'].includes(source)) {
    return NextResponse.json({ error: 'Invalid source' }, { status: 400 });
  }

  try {
    const endpoint = `${BASE_URL}/${type}/${id}/${source}?api_key=${API_KEY}&page=${page}`;
    const response = await fetch(endpoint, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      results: data.results || [],
      page: data.page || 1,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || 0,
    });
  } catch (error) {
    console.error('More like this API error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
