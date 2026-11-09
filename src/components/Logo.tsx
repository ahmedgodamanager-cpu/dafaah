import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'full' | 'iconOnly';
  className?: string;
  darkBackground?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
}) => {
  // Doubled height sizing for the official logo image to make it prominent and large
  const heightClass = {
    sm: 'h-16 sm:h-20',
    md: 'h-24 sm:h-28',
    lg: 'h-36 sm:h-44',
    xl: 'h-52 sm:h-64',
  }[size];

  return (
    <div className={`inline-flex items-center justify-center select-none ${className}`}>
      {/* Light Mode Logo */}
      <img
        src="/logo-light.png"
        alt="دفة - DEFFA CRM"
        className={`block dark:hidden ${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-[1.02] filter drop-shadow-md`}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.dataset.triedFallback !== '1') {
            target.dataset.triedFallback = '1';
            target.src = 'https://i.ibb.co/Kpk6wtn2/logo-light.jpg';
          }
        }}
      />
      {/* Dark Mode Logo */}
      <img
        src="/logo-dark.png"
        alt="دفة - DEFFA CRM"
        className={`hidden dark:block ${heightClass} w-auto object-contain transition-transform duration-200 hover:scale-[1.02] filter drop-shadow-md`}
        onError={(e) => {
          const target = e.currentTarget;
          if (target.dataset.triedFallback !== '1') {
            target.dataset.triedFallback = '1';
            target.src = 'https://i.ibb.co/fzL9yFQd/logo-dark.jpg';
          }
        }}
      />
    </div>
  );
};
