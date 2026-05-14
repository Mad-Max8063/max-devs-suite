export interface VCardData {
  name?: string;
  profession?: string;
  description?: string;
  phone?: string;
  email?: string;
  location?: string;
  website?: string;
  instagram?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  threads?: string;
  photo?: string;
}

function escapeVCardValue(value = ''): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function normalizeSocialProfile(value = '', platform: 'tiktok' | 'youtube' | 'threads'): string {
  const raw = value.trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^(www\.|tiktok\.com\/|youtube\.com\/|youtu\.be\/|threads\.net\/|threads\.com\/)/i.test(raw)) {
    return `https://${raw}`;
  }

  const handle = raw.replace(/^@/, '').replace(/^\/+/, '').trim();
  if (!handle) return '';

  if (platform === 'tiktok') return `https://www.tiktok.com/@${handle}`;
  if (platform === 'youtube') return `https://www.youtube.com/@${handle}`;
  return `https://www.threads.net/@${handle}`;
}

export function generateVCard(data: VCardData): string {
  const name = data.name || 'Contacto';
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardValue(name)}`,
    `N:${escapeVCardValue(name.split(' ').reverse().join(';'))};;;`,
  ];

  if (data.profession) {
    lines.push(`ORG:${escapeVCardValue(data.profession)}`);
    lines.push(`TITLE:${escapeVCardValue(data.profession)}`);
  }

  if (data.phone) lines.push(`TEL;TYPE=CELL:${escapeVCardValue(data.phone)}`);
  if (data.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(data.email)}`);
  if (data.location) lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(data.location)};;;;`);
  if (data.website) lines.push(`URL:${escapeVCardValue(data.website)}`);

  if (data.instagram) {
    lines.push(`X-SOCIALPROFILE;TYPE=instagram:https://instagram.com/${data.instagram.replace('@', '')}`);
  }

  if (data.linkedin) lines.push(`X-SOCIALPROFILE;TYPE=linkedin:${escapeVCardValue(data.linkedin)}`);
  if (data.tiktok) lines.push(`X-SOCIALPROFILE;TYPE=tiktok:${escapeVCardValue(normalizeSocialProfile(data.tiktok, 'tiktok'))}`);
  if (data.youtube) lines.push(`X-SOCIALPROFILE;TYPE=youtube:${escapeVCardValue(normalizeSocialProfile(data.youtube, 'youtube'))}`);
  if (data.threads) lines.push(`X-SOCIALPROFILE;TYPE=threads:${escapeVCardValue(normalizeSocialProfile(data.threads, 'threads'))}`);
  if (data.description) lines.push(`NOTE:${escapeVCardValue(data.description)}`);

  if (data.photo?.startsWith('data:image')) {
    const base64 = data.photo.split(',')[1];
    if (base64 && base64.length < 50000) {
      lines.push(`PHOTO;ENCODING=b;TYPE=JPEG:${base64}`);
    }
  } else if (data.photo?.startsWith('https://')) {
    lines.push(`PHOTO;VALUE=uri:${data.photo}`);
  }

  lines.push('END:VCARD');
  return lines.join('\r\n');
}

export function downloadVCard(data: VCardData): void {
  const vcardContent = generateVCard(data);
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = `${(data.name || 'contacto').replace(/\s+/g, '_')}.vcf`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
