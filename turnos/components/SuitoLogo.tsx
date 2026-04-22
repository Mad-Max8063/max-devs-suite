import React from 'react';

interface SuitoLogoProps {
  className?: string;
  variant?: 'gold' | 'monochrome' | 'white'; // Kept for backwards compatibility but ignored in new design
  size?: number; // Kept for backwards compatibility but ignored as we use width/height 100%
  showText?: boolean; // Kept for backwards compatibility but ignored
}

const SuitoLogo: React.FC<SuitoLogoProps> = ({ className }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 450" width="100%" height="100%" className={className}>
      <defs>
        <radialGradient id="bg-grad" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
          <stop offset="0%" stopColor="#2a251a"/>
          <stop offset="100%" stopColor="#050505"/>
        </radialGradient>

        <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#222222" strokeWidth="1" opacity="0.5"/>
        </pattern>

        <linearGradient id="gold-base" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE073"/>
          <stop offset="25%" stopColor="#AA7C11"/>
          <stop offset="50%" stopColor="#FFF1AA"/>
          <stop offset="75%" stopColor="#5C4000"/>
          <stop offset="100%" stopColor="#D4AF37"/>
        </linearGradient>

        <linearGradient id="gold-border" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5C4000"/>
          <stop offset="30%" stopColor="#D4AF37"/>
          <stop offset="50%" stopColor="#FFF1AA"/>
          <stop offset="70%" stopColor="#AA7C11"/>
          <stop offset="100%" stopColor="#3A2800"/>
        </linearGradient>

        <linearGradient id="gold-dark" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8A5A19"/>
          <stop offset="100%" stopColor="#2a1d00"/>
        </linearGradient>

        <linearGradient id="coin-surface" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#5a4315"/>
          <stop offset="50%" stopColor="#261b05"/>
          <stop offset="100%" stopColor="#4d370b"/>
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="10" dy="15" stdDeviation="12" floodColor="#000000" floodOpacity="0.85"/>
        </filter>

        <filter id="text-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="6" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.9"/>
        </filter>
      </defs>

      <rect width="1000" height="450" fill="url(#bg-grad)"/>
      <rect width="1000" height="450" fill="url(#grid-pattern)"/>

      <g id="emblem" filter="url(#shadow)">
        <circle cx="300" cy="225" r="160" fill="url(#gold-dark)"/>
        <circle cx="300" cy="225" r="158" fill="url(#gold-base)"/>
        <circle cx="300" cy="225" r="148" fill="url(#coin-surface)" stroke="url(#gold-border)" strokeWidth="4"/>
      </g>

      <g id="dollar-strokes" filter="url(#shadow)">
        <rect x="296" y="340" width="8" height="55" fill="#3A2800" transform="translate(2, 2)"/>
        <rect x="296" y="340" width="8" height="55" fill="url(#gold-base)"/>
        
        <rect x="296" y="55" width="8" height="55" fill="#3A2800" transform="translate(2, 2)"/>
        <rect x="296" y="55" width="8" height="55" fill="url(#gold-base)"/>
      </g>

      <g id="logotype" filter="url(#text-shadow)">
        <text x="300" y="315" fontFamily="Georgia, serif" fontSize="260" textAnchor="middle" fill="#2a1d00" transform="translate(4, 4)">S</text>
        <text x="300" y="315" fontFamily="Georgia, serif" fontSize="260" textAnchor="middle" fill="url(#gold-dark)" transform="translate(2, 2)">S</text>
        <text x="300" y="315" fontFamily="Georgia, serif" fontSize="260" textAnchor="middle" fill="url(#gold-base)" stroke="url(#gold-border)" strokeWidth="2">S</text>

        <text x="385" y="315" fontFamily="Georgia, serif" fontStyle="italic" fontSize="200" fill="#2a1d00" transform="translate(4, 4)">uito</text>
        <text x="385" y="315" fontFamily="Georgia, serif" fontStyle="italic" fontSize="200" fill="url(#gold-dark)" transform="translate(2, 2)">uito</text>
        <text x="385" y="315" fontFamily="Georgia, serif" fontStyle="italic" fontSize="200" fill="url(#gold-base)" stroke="url(#gold-border)" strokeWidth="2">uito</text>
      </g>

    </svg>
  );
};

export default SuitoLogo;
