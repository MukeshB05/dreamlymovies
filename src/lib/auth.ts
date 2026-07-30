// TMDB Authentication utilities

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBUser {
  id: number;
  name: string;
  username: string;
  avatar: {
    gravatar: { hash: string };
    tmdb: { avatar_path: string | null };
  };
  include_adult: boolean;
  iso_639_1: string;
  iso_3166_1: string;
}

export interface AuthState {
  sessionId: string | null;
  user: TMDBUser | null;
  isAuthenticated: boolean;
}

// Create a new request token
export async function createRequestToken(): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/authentication/token/new?api_key=${TMDB_API_KEY}`
  );
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.status_message || 'Failed to create request token');
  }
  return data.request_token;
}

// Validate request token with login credentials
export async function validateWithLogin(
  username: string,
  password: string,
  requestToken: string
): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/authentication/token/validate_with_login?api_key=${TMDB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        request_token: requestToken,
      }),
    }
  );
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.status_message || 'Invalid username or password');
  }
  return data.request_token;
}

// Create a session from validated token
export async function createSession(requestToken: string): Promise<string> {
  const response = await fetch(
    `${BASE_URL}/authentication/session/new?api_key=${TMDB_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ request_token: requestToken }),
    }
  );
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.status_message || 'Failed to create session');
  }
  return data.session_id;
}

// Get account details
export async function getAccountDetails(sessionId: string): Promise<TMDBUser> {
  const response = await fetch(
    `${BASE_URL}/account?api_key=${TMDB_API_KEY}&session_id=${sessionId}`
  );
  const data = await response.json();
  if (data.status_code) {
    throw new Error(data.status_message || 'Failed to get account details');
  }
  return data;
}

// Delete session (logout)
export async function deleteSession(sessionId: string): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/authentication/session?api_key=${TMDB_API_KEY}`,
    {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    }
  );
  const data = await response.json();
  return data.success;
}

// Get avatar URL
export function getAvatarUrl(user: TMDBUser): string {
  if (user.avatar.tmdb.avatar_path) {
    return `https://image.tmdb.org/t/p/w185${user.avatar.tmdb.avatar_path}`;
  }
  if (user.avatar.gravatar.hash) {
    return `https://www.gravatar.com/avatar/${user.avatar.gravatar.hash}?s=185`;
  }
  return '/logo.png';
}

// Rate a movie
export async function rateMovie(
  movieId: number,
  rating: number,
  sessionId: string
): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/rating?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: rating }),
    }
  );
  const data = await response.json();
  return data.success;
}

// Delete movie rating
export async function deleteMovieRating(
  movieId: number,
  sessionId: string
): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/rating?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
    { method: 'DELETE' }
  );
  const data = await response.json();
  return data.success;
}

// Rate a TV show
export async function rateTVShow(
  tvId: number,
  rating: number,
  sessionId: string
): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/rating?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: rating }),
    }
  );
  const data = await response.json();
  return data.success;
}

// Rate an episode
export async function rateEpisode(
  tvId: number,
  seasonNumber: number,
  episodeNumber: number,
  rating: number,
  sessionId: string
): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/rating?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value: rating }),
    }
  );
  const data = await response.json();
  return data.success;
}

// Add to watchlist
export async function addToWatchlist(
  accountId: number,
  mediaType: 'movie' | 'tv',
  mediaId: number,
  watchlist: boolean,
  sessionId: string
): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/account/${accountId}/watchlist?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: mediaType,
        media_id: mediaId,
        watchlist,
      }),
    }
  );
  const data = await response.json();
  return data.success;
}

// Add to favorites
export async function addToFavorites(
  accountId: number,
  mediaType: 'movie' | 'tv',
  mediaId: number,
  favorite: boolean,
  sessionId: string
): Promise<boolean> {
  const response = await fetch(
    `${BASE_URL}/account/${accountId}/favorite?api_key=${TMDB_API_KEY}&session_id=${sessionId}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: mediaType,
        media_id: mediaId,
        favorite,
      }),
    }
  );
  const data = await response.json();
  return data.success;
}

// Get account states for a movie (rated, watchlist, favorite)
export async function getMovieAccountStates(
  movieId: number,
  sessionId: string
): Promise<{ rated: number | false; watchlist: boolean; favorite: boolean }> {
  const response = await fetch(
    `${BASE_URL}/movie/${movieId}/account_states?api_key=${TMDB_API_KEY}&session_id=${sessionId}`
  );
  const data = await response.json();
  return {
    rated: data.rated ? data.rated.value : false,
    watchlist: data.watchlist || false,
    favorite: data.favorite || false,
  };
}

// Get account states for a TV show
export async function getTVAccountStates(
  tvId: number,
  sessionId: string
): Promise<{ rated: number | false; watchlist: boolean; favorite: boolean }> {
  const response = await fetch(
    `${BASE_URL}/tv/${tvId}/account_states?api_key=${TMDB_API_KEY}&session_id=${sessionId}`
  );
  const data = await response.json();
  return {
    rated: data.rated ? data.rated.value : false,
    watchlist: data.watchlist || false,
    favorite: data.favorite || false,
  };
}
