import { NextResponse } from 'next/server';
import {
  createRequestToken,
  validateWithLogin,
  createSession,
  getAccountDetails,
} from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Step 1: Create request token
    const requestToken = await createRequestToken();

    // Step 2: Validate with login credentials
    const validatedToken = await validateWithLogin(username, password, requestToken);

    // Step 3: Create session
    const sessionId = await createSession(validatedToken);

    // Step 4: Get account details
    const user = await getAccountDetails(sessionId);

    return NextResponse.json({
      success: true,
      sessionId,
      user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Login failed' },
      { status: 401 }
    );
  }
}
