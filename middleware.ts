import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (inside /public)
     * 4. all root files inside /public (e.g. /favicon.ico)
     * 5. files with extensions (assets, images, etc.)
     */
    '/((?!api|_next|static|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // Definir dominios principales (Landing)
  const rootDomains = ['suito.pro', 'www.suito.pro', 'localhost:5173', 'max-devs-suite.vercel.app'];
  const isRootDomain = rootDomains.some(domain => hostname === domain || hostname.endsWith('.vercel.app'));

  // Si es el dominio principal, permitimos que vercel.json maneje las rutas normales
  if (isRootDomain) {
    return NextResponse.next();
  }

  // Extraer subdominio
  const subdomain = hostname.split('.')[0];

  // Caso 1: Panel de administración
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL('/admin/dashboard-v2029.html', req.url));
  }

  // Caso 2: App de Turnos (subdominio técnico o tenant dinámico)
  // Cualquier otro subdominio (ej: barberia, spa, turnos) va al gestor de turnos
  return NextResponse.rewrite(new URL('/turnos/index.html', req.url));
}
