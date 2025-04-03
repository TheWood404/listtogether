import { NextResponse } from 'next/server';

export function middleware(request) {
  // Si quelqu'un accède à /list/, rediriger vers /lists/
  if (request.nextUrl.pathname.startsWith('/list/')) {
    return NextResponse.redirect(
      new URL(request.nextUrl.pathname.replace('/list/', '/lists/'), request.url)
    );
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/list/:path*'],
};