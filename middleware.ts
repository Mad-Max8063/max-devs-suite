import { next } from '@vercel/edge';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /assets, /public, /static
     * 2. Files with extensions (.js, .css, .png, etc.)
     */
    '/((?!assets|static|.*\\..*).*)',
  ],
};

export default function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';

  // 1. Evitar bucles: Si la URL ya contiene /turnos/ o /card/, no hacemos nada
  if (url.pathname.startsWith('/turnos') || url.pathname.startsWith('/card')) {
    return next();
  }

  // 2. Identificar dominios raíz
  const rootDomains = ['suito.pro', 'www.suito.pro', 'max-devs-suite.vercel.app'];
  const isRootDomain = rootDomains.some(d => hostname === d || hostname.endsWith('.vercel.app'));

  if (isRootDomain) {
    return next();
  }

  // 3. Lógica de Subdominios
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'www') return next();

  if (subdomain === 'admin') {
    url.pathname = `/admin/dashboard-v2029.html`;
    return Response.rewrite(url);
  }

  // Por defecto, cualquier subdominio (ej: barberia) va al gestor de turnos
  // Reescribimos internamente a /turnos/index.html
  url.pathname = `/turnos/index.html`;
  return Response.rewrite(url);
}
