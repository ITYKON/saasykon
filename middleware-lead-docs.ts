import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthUserFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Ne s'applique qu'aux routes pro/
  if (!pathname.startsWith('/pro/')) {
    return NextResponse.next();
  }

  // Exclure certaines routes
  const publicPaths = [
    '/pro/documents-verification',
    '/pro/api',
    '/pro/auth',
  ];

  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    const user = await getAuthUserFromCookies();
    if (!user) {
      return NextResponse.next();
    }

    // Vérifier si l'utilisateur est propriétaire d'une entreprise
    const business = await prisma.businesses.findFirst({
      where: {
        owner_user_id: user.id,
        converted_from_lead: true, // Uniquement les entreprises converties depuis un lead
      },
      include: {
        business_verifications: true
      }
    });

    // Si c'est un lead converti sans documents
    if (business && (!business.business_verifications || business.business_verifications.length === 0)) {
      // Rediriger vers la page de vérification des documents
      if (pathname !== '/pro/documents-verification') {
        const url = new URL('/pro/documents-verification', request.url);
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Error in lead documents middleware:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/pro/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
