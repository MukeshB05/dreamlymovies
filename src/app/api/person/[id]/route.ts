import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const personId = params.id;

  try {
    const response = await fetch(
      `${BASE_URL}/person/${personId}?api_key=${API_KEY}&append_to_response=combined_credits,images`
    );

    if (!response.ok) {
      throw new Error('TMDB API Error');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch person' }, { status: 500 });
  }
}
