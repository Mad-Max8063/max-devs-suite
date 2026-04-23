import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /assets, /public, /static, /favicon.ico
     * 2. Files with extensions (.js, .css, .png, etc.)
     */
    '/((?!assets|static|favicon|.*\\..*).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  // 1. Evitar bucles infinitos
  if (url.pathname.startsWith('/turnos') || url.pathname.startsWith('/card')) {
    return NextResponse.next();
  }

  // 2. Identificar dominios principales
  const rootDomains = ['suito.pro', 'www.suito.pro', 'max-devs-suite.vercel.app'];
  const isRootDomain = rootDomains.some(d => hostname === d || hostname.endsWith('.vercel.app'));

  // Si es el dominio principal, no hacemos nada, dejamos que vercel.json maneje la landing
  if (isRootDomain) {
    return NextResponse.next();
  }

  // 3. Resolución de subdominios
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'www') return NextResponse.next();

  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL('/admin/dashboard-v2029.html', req.url));
  }

  // Por defecto: subdominios de negocios (tenants) van al Gestor de Turnos
  // Importante: No cambiamos la URL en el navegador, solo el archivo servido
  return NextResponse.rewrite(new URL('/turnos/index.html', req.url));
}
