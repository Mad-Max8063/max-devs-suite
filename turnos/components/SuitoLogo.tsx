import React from 'react';

interface SuitoLogoProps {
  variant?: 'gold' | 'monochrome' | 'white';
  size?: number;
  showText?: boolean;
}

const SuitoLogo: React.FC<SuitoLogoProps> = ({ 
  variant = 'gold', 
  size = 200, 
  showText = true 
}) => {
  const colors = {
    gold: "url(#suitoGold)",
    monochrome: "#1A1A1A",
    white: "#FFFFFF"
  };

  const currentColor = variant === 'gold' ? colors.gold : colors[variant];

  return (
    <svg 
      width={showText ? size : size / 3} 
      viewBox={showText ? "0 0 400 120" : "15 15 90 90"} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {variant === 'gold' && (
        <defs>
          <linearGradient id="suitoGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D4AF37" />
            <stop offset="50%" stopColor="#F9E498" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>
      )}
      
      {/* Coin Icon */}
      <circle cx="60" cy="60" r="45" stroke={currentColor} strokeWidth="4" />
      <path 
        d="M60 28V35M60 85V92M72 45C72 38 65 35 60 35C52 35 48 40 48 45C48 55 72 55 72 65C72 75 65 85 55 85C48 85 45 80 45 75" 
        stroke={currentColor} strokeWidth="6" strokeLinecap="round" 
      />

      {showText && (
        <g fill={currentColor}>
          <path d="M110 50V75C110 82 115 85 120 85C125 85 130 82 130 75V50H136V75C136 85 128 92 120 92C112 92 104 85 104 75V50H110Z"/>
          <rect x="150" y="50" width="6" height="35"/>
          <circle cx="153" cy="40" r="4"/>
          <path d="M175 40V50H168V56H175V78C175 83 178 86 183 86H188V80H184C181 80 181 79 181 77V56H188V50H181V40H175Z"/>
          <path d="M215 71C215 82.5 206.5 92 195 92C183.5 92 175 82.5 175 71C175 59.5 183.5 50 195 50C206.5 50 215 59.5 215 71ZM181 71C181 79 187 86 195 86C203 86 209 79 209 71C209 63 203 56 195 56C187 56 181 63 181 71Z" transform="translate(30, 0)"/>
        </g>
      )}
    </svg>
  );
};

export default SuitoLogo;
