import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://auth-service:8080';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    const response = NextResponse.json({ message: 'Session expired' }, { status: 401 });
    response.cookies.delete('refresh_token');
    return response;
  }

  const data = await res.json();
  const { accessToken, refreshToken: newRefreshToken, user } = data.data;

  const response = NextResponse.json({ accessToken, user });
  response.cookies.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (refreshToken) {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  }
  const response = NextResponse.json({ message: 'Logged out' });
  response.cookies.delete('refresh_token');
  return response;
}
