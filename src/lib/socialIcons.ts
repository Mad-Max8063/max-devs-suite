export type SocialField =
  | 'telefono'
  | 'email'
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'website'
  | 'booking_url';

export interface SocialIconDefinition {
  field: SocialField;
  label: string;
  svgPath: string;
}

export interface SocialNode extends SocialIconDefinition {
  value: string;
  href: string;
}

export type SocialPayload = Partial<Record<SocialField, string | null | undefined>>;

export const SOCIAL_ICON_MAP: Record<SocialField, SocialIconDefinition> = {
  telefono: {
    field: 'telefono',
    label: 'WhatsApp',
    svgPath:
      'M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.52 0 .18 5.34.18 11.9c0 2.1.55 4.14 1.6 5.94L0 24l6.32-1.66a11.86 11.86 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.91-11.9 0-3.18-1.24-6.17-3.48-8.43Zm-8.43 18.32h-.01a9.86 9.86 0 0 1-5.02-1.38l-.36-.21-3.75.98 1-3.65-.24-.38a9.88 9.88 0 1 1 8.38 4.64Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.1 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.88.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z',
  },
  email: {
    field: 'email',
    label: 'Email',
    svgPath:
      'M2 4h20v16H2V4Zm2 3.2V18h16V7.2l-8 5.34L4 7.2Zm1.2-1.2L12 10.54 18.8 6H5.2Z',
  },
  instagram: {
    field: 'instagram',
    label: 'Instagram',
    svgPath:
      'M7.8 2h8.4A5.8 5.8 0 0 1 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8A5.8 5.8 0 0 1 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2Zm0 2A3.8 3.8 0 0 0 4 7.8v8.4A3.8 3.8 0 0 0 7.8 20h8.4a3.8 3.8 0 0 0 3.8-3.8V7.8A3.8 3.8 0 0 0 16.2 4H7.8Zm4.2 3.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm5-2.65a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z',
  },
  facebook: {
    field: 'facebook',
    label: 'Facebook',
    svgPath:
      'M14 8h3V4h-3c-3.31 0-5 2.01-5 5v3H6v4h3v8h4v-8h3.25L17 12h-4V9c0-.75.25-1 1-1Z',
  },
  linkedin: {
    field: 'linkedin',
    label: 'LinkedIn',
    svgPath:
      'M4.98 3.5A2.5 2.5 0 1 1 0 3.5a2.5 2.5 0 0 1 4.98 0ZM.5 8h4v14h-4V8Zm7 0h3.84v1.92h.05c.54-1.02 1.86-2.1 3.83-2.1 4.1 0 4.86 2.7 4.86 6.21V22h-4v-7.07c0-1.69-.03-3.86-2.35-3.86-2.35 0-2.71 1.84-2.71 3.74V22h-4V8Z',
  },
  website: {
    field: 'website',
    label: 'Web',
    svgPath:
      'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.93 9h-3.02a15.4 15.4 0 0 0-1.08-5.02A8.03 8.03 0 0 1 18.93 11ZM12 4.04c.83 1.2 1.66 3.4 1.9 6.96h-3.8c.24-3.56 1.07-5.76 1.9-6.96ZM4.26 13h3.83c.12 1.92.45 3.65.94 5.02A8.03 8.03 0 0 1 4.26 13Zm3.83-2H4.26a8.03 8.03 0 0 1 4.77-5.02A15.4 15.4 0 0 0 8.09 11ZM12 19.96c-.83-1.2-1.66-3.4-1.9-6.96h3.8c-.24 3.56-1.07 5.76-1.9 6.96Zm2.97-1.94c.49-1.37.82-3.1.94-5.02h3.02a8.03 8.03 0 0 1-3.96 5.02Z',
  },
  booking_url: {
    field: 'booking_url',
    label: 'Turnos',
    svgPath:
      'M7 2h2v2h6V2h2v2h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3V2Zm13 8H4v10h16V10ZM4 8h16V6H4v2Zm4 4h3v3H8v-3Z',
  },
};

function normalizeHref(field: SocialField, value: string): string {
  if (field === 'telefono') {
    const phone = value.replace(/[^\d]/g, '');
    return `https://wa.me/${phone}`;
  }

  if (field === 'email') return `mailto:${value}`;

  if (field === 'instagram') {
    const handle = value.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '');
    return `https://instagram.com/${handle}`;
  }

  if (field === 'website' || field === 'facebook' || field === 'linkedin' || field === 'booking_url') {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  }

  return value;
}

export function getSocialNodes(payload: SocialPayload): SocialNode[] {
  return (Object.keys(SOCIAL_ICON_MAP) as SocialField[])
    .map((field) => {
      const value = payload[field]?.trim();
      if (!value) return null;
      const definition = SOCIAL_ICON_MAP[field];
      return {
        ...definition,
        value,
        href: normalizeHref(field, value),
      };
    })
    .filter((node): node is SocialNode => node !== null);
}
