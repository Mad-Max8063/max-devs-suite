import React from 'react';
import { ImageResponse } from '@vercel/og';
import { fetchOgProfile, toAbsoluteUrl } from '../../src/lib/ogProfile.js';

export const config = {
  runtime: 'edge',
};

const WIDTH = 1200;
const HEIGHT = 630;
const FONT_URL =
  'https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff';

type Style = React.CSSProperties;

const el = React.createElement;

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trim()}...`;
}

function div(style: Style, children?: React.ReactNode, key?: string): React.ReactElement {
  return el('div', { style, key }, children);
}

function normalizeHexColor(value: string): string {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value) ? value : '#D4AF37';
}

export default async function handler(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const slug = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? '');
    const profile = await fetchOgProfile(slug);

    if (!profile) {
      return new Response('Card not found', { status: 404 });
    }

    const origin = url.origin;
    const primaryColor = normalizeHexColor(profile.primaryColor);
    const socialColor = normalizeHexColor(profile.socialColor);
    const avatarUrl = profile.avatarUrl
      ? toAbsoluteUrl(profile.avatarUrl, origin)
      : toAbsoluteUrl('/card/assets/default-avatar.svg', origin);
    const coverUrl = profile.coverUrl ? toAbsoluteUrl(profile.coverUrl, origin) : '';
    const socialNodes = profile.socialNodes.slice(0, 6);
    
    const fontData = await fetch(new URL(FONT_URL, import.meta.url))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load font');
        return res.arrayBuffer();
      });

    const image = div(
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0B0B12',
      color: '#FFFFFF',
      fontFamily: 'Inter',
      padding: 44,
    },
    div(
      {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 32,
        backgroundColor: profile.cardTheme === 'luminous' ? '#F8FAFC' : '#15151D',
        color: profile.cardTheme === 'luminous' ? '#10121A' : '#FFFFFF',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 34px 120px rgba(0,0,0,0.5)',
      },
      [
        div(
          {
            height: 210,
            display: 'flex',
            position: 'relative',
            backgroundImage: coverUrl
              ? `url(${coverUrl})`
              : `linear-gradient(135deg, ${primaryColor}, #18D2FF 48%, #7C3AED)`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          },
          [
            div(
              {
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundImage:
                  'linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(0deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
                backgroundSize: '48px 48px',
                opacity: coverUrl ? 0.14 : 0.24,
              },
              undefined,
              'grid',
            ),
            div(
              {
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.54))',
              },
              undefined,
              'shade',
            ),
            div(
              {
                position: 'absolute',
                left: 56,
                top: 44,
                display: 'flex',
                fontSize: 28,
                fontWeight: 800, // Replaced 800 with 800 but explicitly noted we only load 400
                letterSpacing: 0,
                color: '#FFFFFF',
              },
              'Suito',
              'brand',
            ),
          ],
          'header',
        ),
        div(
          {
            display: 'flex',
            flex: 1,
            position: 'relative',
            padding: '78px 64px 52px 64px',
          },
          [
            el('img', {
              key: 'avatar',
              src: avatarUrl,
              width: 156,
              height: 156,
              style: {
                position: 'absolute',
                top: -78,
                left: 64,
                borderRadius: 999,
                border: profile.cardTheme === 'luminous' ? '9px solid #F8FAFC' : '9px solid #15151D',
                objectFit: 'cover',
                backgroundColor: '#252535',
              } satisfies Style,
            }),
            div(
              {
                display: 'flex',
                flexDirection: 'column',
                width: 760,
              },
              [
                div(
                  {
                    display: 'flex',
                    fontSize: 66,
                    lineHeight: 1,
                    fontWeight: 800,
                    letterSpacing: 0,
                    marginBottom: 18,
                  },
                  truncate(profile.name, 36),
                  'name',
                ),
                div(
                  {
                    display: 'flex',
                    color: primaryColor,
                    fontSize: 30,
                    fontWeight: 700,
                    marginBottom: 22,
                  },
                  truncate(profile.profession, 54),
                  'profession',
                ),
                div(
                  {
                    display: 'flex',
                    color: profile.cardTheme === 'luminous' ? 'rgba(16,18,26,0.72)' : 'rgba(255,255,255,0.78)',
                    fontSize: 28,
                    lineHeight: 1.35,
                    maxWidth: 850,
                  },
                  truncate(profile.description || `Conecta con ${profile.name}`, 130),
                  'description',
                ),
              ],
              'copy',
            ),
            div(
              {
                position: 'absolute',
                right: 64,
                bottom: 52,
                display: 'flex',
                gap: 14,
              },
              socialNodes.map((node) =>
                div(
                  {
                    width: 62,
                    height: 62,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 18,
                    backgroundColor: socialColor,
                    border: '1px solid rgba(255,255,255,0.18)',
                  },
                  el(
                    'svg',
                    { width: 32, height: 32, viewBox: '0 0 24 24', fill: '#FFFFFF' },
                    el('path', { d: node.svgPath }),
                  ),
                  node.field,
                ),
              ),
              'social',
            ),
          ],
          'body',
        ),
      ],
    ),
  );

  return new ImageResponse(image, {
    width: WIDTH,
    height: HEIGHT,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
    fonts: [
      {
        name: 'Inter',
        data: fontData,
        style: 'normal',
        weight: 400,
      },
    ],
  });
  } catch (e: any) {
    console.error(`OG_ERROR: ${e.message}`);
    const { origin } = new URL(request.url);
    // Redirección de emergencia para evitar preview roto en WhatsApp
    return Response.redirect(`${origin}/card/assets/default-avatar.svg`);
  }
}
