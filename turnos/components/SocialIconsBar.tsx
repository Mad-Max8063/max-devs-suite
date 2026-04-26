import React from 'react';

interface SocialIconsBarProps {
  phone?: string;
  whatsappMessage?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
}

function normalizePhone(phone = ''): string {
  const raw = phone.replace(/\D/g, '');
  if (!raw) return '';
  const withCountry = raw.startsWith('54') ? raw : `54${raw}`;
  return withCountry.startsWith('549') ? withCountry : withCountry.replace(/^54/, '549');
}

const SocialIconsBar: React.FC<SocialIconsBarProps> = ({
  phone,
  whatsappMessage,
  instagram,
  facebook,
  website,
}) => {
  const normalizedPhone = normalizePhone(phone);
  const items = [
    normalizedPhone ? {
      label: 'WhatsApp',
      href: `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(whatsappMessage || 'Hola! Vi tu tarjeta y me gustaria hacer una consulta.')}`,
      icon: 'chat',
      style: 'bg-[#25D366]',
    } : null,
    instagram ? {
      label: 'Instagram',
      href: `https://instagram.com/${instagram.replace('@', '')}`,
      icon: 'photo_camera',
      style: 'bg-[#E4405F]',
    } : null,
    facebook ? {
      label: 'Facebook',
      href: facebook,
      icon: 'thumb_up',
      style: 'bg-[#1877F2]',
    } : null,
    website ? {
      label: 'Website',
      href: website.startsWith('http') ? website : `https://${website}`,
      icon: 'language',
      style: 'bg-primary',
    } : null,
  ].filter(Boolean) as Array<{ label: string; href: string; icon: string; style: string }>;

  if (!items.length) return null;

  return (
    <div className="flex justify-center gap-3 py-2">
      {items.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={item.label}
          title={item.label}
          className={`size-11 rounded-full ${item.style} text-white flex items-center justify-center shadow-lg transition-transform hover:-translate-y-1`}
        >
          <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
        </a>
      ))}
    </div>
  );
};

export default SocialIconsBar;
