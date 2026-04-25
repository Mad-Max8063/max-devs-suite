import React from 'react';

interface SuitoLogoProps {
  className?: string;
  variant?: 'gold' | 'monochrome' | 'white';
  size?: number;
  showText?: boolean;
}

const SuitoLogo: React.FC<SuitoLogoProps> = ({ className, showText = true }) => {
  return (
    <img
      src={showText ? '/assets/logo.png' : '/assets/suito-symbol.png'}
      alt="Suito"
      className={className}
      draggable={false}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  );
};

export default SuitoLogo;
