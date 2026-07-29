import { NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaType = searchParams.get('mediaType');
  const id = searchParams.get('id');

  if (!mediaType || !id) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `${BASE_URL}/${mediaType}/${id}/videos?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch videos');
    }

    const data = await response.json();

    // Find the best trailer (prefer official trailers, then teasers)
    const videos = data.results || [];

    // Priority: Official Trailer > Trailer > Teaser > Any video
    const trailer =
      videos.find((v: { type: string; site: string; official: boolean }) =>
        v.type === 'Trailer' && v.site === 'YouTube' && v.official
      ) ||
      videos.find((v: { type: string; site: string }) =>
        v.type === 'Trailer' && v.site === 'YouTube'
      ) ||
      videos.find((v: { type: string; site: string }) =>
        v.type === 'Teaser' && v.site === 'YouTube'
      ) ||
      videos.find((v: { site: string }) => v.site === 'YouTube');

    if (!trailer) {
      return NextResponse.json({ error: 'No trailer found' }, { status: 404 });
    }

    return NextResponse.json({
      key: trailer.key,
      name: trailer.name,
      type: trailer.type,
    });
  } catch (error) {
    console.error('Trailer fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch trailer' }, { status: 500 });
  }
}
