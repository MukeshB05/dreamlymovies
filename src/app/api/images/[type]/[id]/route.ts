import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params;

  try {
    const response = await fetch(
      `${BASE_URL}/${type}/${id}/images?api_key=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error('TMDB API Error');
    }

    const data = await response.json();

    const englishLogo = data.logos?.find(
      (logo: { iso_639_1: string }) => logo.iso_639_1 === 'en'
    );
    const anyLogo = data.logos?.[0];
    const logo = englishLogo?.file_path || anyLogo?.file_path || null;

    return NextResponse.json({ logo });
  } catch {
    return NextResponse.json({ logo: null }, { status: 500 });
  }
}
