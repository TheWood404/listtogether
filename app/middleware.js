// middleware.js
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // Vérifie si l'utilisateur est authentifié
  const isAuth = !!session;
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
  
  // Redirige si nécessaire
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    return res;
  }
  
  // Pages protégées qui nécessitent une authentification
  const protectedRoutes = [
    '/dashboard',
    '/list',
    '/pro',
    '/settings',
  ];
  
  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );
  
  if (isProtectedRoute && !isAuth) {
    // Stocke l'URL d'origine pour rediriger après connexion
    const redirectUrl = req.nextUrl.pathname + req.nextUrl.search;
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('redirect', redirectUrl);
    
    return NextResponse.redirect(loginUrl);
  }
  
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/list/:path*',
    '/auth/:path*',
    '/pro/:path*',
    '/settings/:path*',
    '/invitation/:path*',
  ],
};