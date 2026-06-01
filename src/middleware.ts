import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const publicRoutes = ['/auth/sign-in', '/auth/sign-up'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const token = request.cookies.get('token')?.value;

  // Redirect unauthenticated users
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url));
  }

  // Redirect authenticated users away from auth pages
  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|icons/|card-templates/|api/proxy-image).*)',
  ],
};