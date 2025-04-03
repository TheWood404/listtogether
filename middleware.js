import { NextResponse } from 'next/server';

// Ce middleware s'exécute sur toutes les requêtes
export function middleware(request) {
  // Log l'URL demandée
  console.log('URL requested:', request.nextUrl.pathname);
  
  // Si c'est une route de liste, on vérifie que le paramètre listId est présent
  if (request.nextUrl.pathname.startsWith('/list/')) {
    const listId = request.nextUrl.pathname.split('/')[2];
    console.log('Detected listId in middleware:', listId);
    
    if (!listId || listId === '[listId]') {
      // Si pas de listId valide, rediriger vers le dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  // Continuer normalement pour toutes les autres routes
  return NextResponse.next();
}

// Optionnellement, définir sur quelles routes le middleware doit s'exécuter
export const config = {
  matcher: ['/list/:path*'],
};