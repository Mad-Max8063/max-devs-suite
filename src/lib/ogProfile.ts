import { getSocialNodes, type SocialNode } from './socialIcons';

export interface BusinessRow {
  id: string;
  slug: string;
  nombre_negocio: string;
  profession: string | null;
  description: string | null;
  telefono: string | null;
  email: string | null;
  location: string | null;
  foto_url: string | null;
  cover_url: string | null;
  color_primario: string | null;
  instagram: string | null;
  facebook: string | null;
  linkedin: string | null;
  website: string | null;
  booking_url: string | null;
  active_modules: string[] | null;
}

export interface OgProfile {
  id: string;
  slug: string;
  name: string;
  profession: string;
  description: string;
  phone: string;
  email: string;
  location: string;
  avatarUrl: string;
  coverUrl: string;
  primaryColor: string;
  socialNodes: SocialNode[];
}

const BUSINESS_SELECT = [
  'id',
  'slug',
  'nombre_negocio',
  'profession',
  'description',
  'telefono',
  'email',
  'location',
  'foto_url',
  'cover_url',
  'color_primario',
  'instagram',
  'facebook',
  'linkedin',
  'website',
  'booking_url',
  'active_modules',
].join(',');

function readEnv(name: string): string | undefined {
  const env = (globalThis as unknown as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name];
}

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = readEnv('SUPABASE_URL') ?? readEnv('VITE_SUPABASE_URL');
  const anonKey = readEnv('SUPABASE_ANON_KEY') ?? readEnv('VITE_SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    throw new Error('Missing SUPABASE_URL/SUPABASE_ANON_KEY environment variables');
  }

  return { url, anonKey };
}

export function isValidCardSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/i.test(slug);
}

export function toAbsoluteUrl(value: string, origin: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value, origin).toString();
}

export async function fetchOgProfile(slug: string): Promise<OgProfile | null> {
  if (!isValidCardSlug(slug)) return null;

  const { url, anonKey } = getSupabaseEnv();
  const endpoint = new URL('/rest/v1/businesses', url);
  endpoint.searchParams.set('slug', `eq.${slug}`);
  endpoint.searchParams.set('select', BUSINESS_SELECT);
  endpoint.searchParams.set('limit', '1');

  const response = await fetch(endpoint.toString(), {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Supabase profile lookup failed with ${response.status}`);
  }

  const rows = (await response.json()) as BusinessRow[];
  const business = rows[0];
  if (!business) return null;

  const hasAppointments = business.active_modules?.includes('appointments') ?? false;
  const bookingUrl = hasAppointments
    ? business.booking_url || `https://turnos.suito.pro/#/${business.slug}/booking`
    : business.booking_url;

  return {
    id: business.id,
    slug: business.slug,
    name: business.nombre_negocio,
    profession: business.profession ?? '',
    description: business.description ?? '',
    phone: business.telefono ?? '',
    email: business.email ?? '',
    location: business.location ?? '',
    avatarUrl: business.foto_url ?? '',
    coverUrl: business.cover_url ?? '',
    primaryColor: business.color_primario ?? '#D4AF37',
    socialNodes: getSocialNodes({
      telefono: business.telefono,
      email: business.email,
      instagram: business.instagram,
      facebook: business.facebook,
      linkedin: business.linkedin,
      website: business.website,
      booking_url: bookingUrl,
    }),
  };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
