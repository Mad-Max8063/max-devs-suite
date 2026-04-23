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

export default function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';

  // 1. Evitar bucles infinitos
  if (url.pathname.startsWith('/turnos') || url.pathname.startsWith('/card')) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // 2. Identificar dominios principales
  const rootDomains = ['suito.pro', 'www.suito.pro', 'max-devs-suite.vercel.app'];
  const isRootDomain = rootDomains.some(d => hostname === d || hostname.endsWith('.vercel.app'));

  if (isRootDomain) {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // 3. Resolución de subdominios
  const subdomain = hostname.split('.')[0];
  
  if (subdomain === 'www') {
    return new Response(null, { headers: { 'x-middleware-next': '1' } });
  }

  // REESCRITURA MANUAL (Raw headers)
  let targetPath = '/turnos/index.html';
  
  if (subdomain === 'admin') {
    targetPath = '/admin/dashboard-v2029.html';
  }

  const rewriteUrl = new URL(targetPath, req.url);

  return new Response(null, {
    headers: {
      'x-middleware-rewrite': rewriteUrl.toString(),
    },
  });
}
