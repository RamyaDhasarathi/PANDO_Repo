import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(req) {
  // Add paths that require authentication here
  const protectedPaths = ['/favorites', '/profile'];
  const isProtectedPath = protectedPaths.some((path) =>
    req.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath) {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = '/sign-in';
      return NextResponse.redirect(url);
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      console.error('Invalid JWT in middleware:', err);
      const url = req.nextUrl.clone();
      url.pathname = '/sign-in';
      // Clear invalid cookie
      const response = NextResponse.redirect(url);
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
