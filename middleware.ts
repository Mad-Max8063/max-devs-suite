export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /assets, /public, /static, /favicon.ico
     */
    '/((?!assets|static|favicon).*)',
  ],
};

export default function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Evitar bucles infinitos y servir assets directos
  if (pathname.startsWith('/turnos') || pathname.startsWith('/card') || pathname.startsWith('/admin')) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // 2. Identificar dominios principales
  const rootDomains = ['suito.pro', 'www.suito.pro', 'max-devs-suite.vercel.app'];
  const isRootDomain = rootDomains.some(d => hostname === d || hostname.endsWith('.vercel.app'));

  if (isRootDomain) {
    // Si tiene extensión y es dominio raíz, dejar pasar (Vercel servirá desde la raíz)
    if (pathname.includes('.')) {
        return new Response(null, { headers: { 'x-middleware-next': '1' } });
    }
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // 3. Resolución de subdominios
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'www') {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // REESCRITURA PARA SUBDOMINIOS
  let targetPath = pathname;
  
  if (subdomain === 'admin') {
    // Si es la raíz del subdominio, ir al dashboard
    if (pathname === '/') {
        targetPath = '/admin/dashboard-v2029.html';
    } else {
        // Si pide /sw-admin.js -> /admin/sw-admin.js
        targetPath = `/admin${pathname}`;
    }
  } else {
    // Otros subdominios (tenants) van a /turnos/
    if (pathname === '/') {
        targetPath = '/turnos/index.html';
    } else {
        targetPath = `/turnos${pathname}`;
    }
  }

  const rewriteUrl = new URL(targetPath, req.url);

  return new Response(null, {
    headers: {
      'x-middleware-rewrite': rewriteUrl.toString(),
    },
  });
}
