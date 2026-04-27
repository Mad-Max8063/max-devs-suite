import React from 'react';

interface SuitoLogoProps {
  className?: string;
  variant?: 'gold' | 'monochrome' | 'white';
  size?: number;
  showText?: boolean;
}

const SuitoLogo: React.FC<SuitoLogoProps> = ({ className, showText = true }) => {
  return (
    <span className={`suito-gold-shine suito-logo-shine ${className || ''}`}>
      <img
        src={showText ? '/assets/logo-transparent.svg' : '/assets/suito-symbol.png'}
        alt="Suito"
        draggable={false}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </span>
  );
};

export default SuitoLogo;
