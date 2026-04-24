import { escapeHtml, fetchOgProfile, toAbsoluteUrl } from './src/lib/ogProfile.js';

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /assets, /public, /static, /favicon.ico
     */
    '/((?!assets|static|favicon).*)',
  ],
};

const BOT_USER_AGENT =
  /(facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|pinterest|googlebot|bingbot)/i;

function isSocialCrawler(req: Request): boolean {
  const userAgent = req.headers.get('user-agent') ?? '';
  return BOT_USER_AGENT.test(userAgent);
}

function getCardSlug(pathname: string): string | null {
  const match = pathname.match(/^\/card\/([^/?#]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function buildOgHtml(req: Request, slug: string, profile: Awaited<ReturnType<typeof fetchOgProfile>>): string {
  if (!profile) return '';

  const url = new URL(req.url);
  const canonicalUrl = new URL(`/card/${slug}`, url.origin).toString();
  const imageUrl = new URL(`/api/og/${slug}`, url.origin).toString();
  const title = `${profile.name}${profile.profession ? ` - ${profile.profession}` : ''}`;
  const description = profile.description || `Contacta a ${profile.name}`;
  const avatarUrl = profile.avatarUrl
    ? toAbsoluteUrl(profile.avatarUrl, url.origin)
    : toAbsoluteUrl('/card/assets/default-avatar.svg', url.origin);

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:type" content="profile">
  <meta property="og:site_name" content="Suito">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.profession,
    description,
    image: avatarUrl,
    url: canonicalUrl,
  }).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <main>
    <h1>${escapeHtml(profile.name)}</h1>
    <p>${escapeHtml(profile.profession)}</p>
    <p>${escapeHtml(description)}</p>
    <a href="${escapeHtml(canonicalUrl)}">Ver tarjeta Suito</a>
  </main>
</body>
</html>`;
}

export default async function middleware(req: Request) {
  const url = new URL(req.url);
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;
  const cardSlug = getCardSlug(pathname);

  if (cardSlug && isSocialCrawler(req)) {
    try {
      const profile = await fetchOgProfile(cardSlug);
      if (!profile) {
        return new Response('Card not found', { status: 404 });
      }

      return new Response(buildOgHtml(req, cardSlug, profile), {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
        },
      });
    } catch (error) {
      return new Response(error instanceof Error ? error.message : 'OG middleware failed', { status: 500 });
    }
  }

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
