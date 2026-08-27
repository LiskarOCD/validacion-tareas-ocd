import React from 'react';

interface OcdLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'pill' | 'icon-only' | 'dark-header';
  showText?: boolean;
}

export const OcdSymbol: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id="ocdSpiralGrad" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#2B98BA" />
          <stop offset="50%" stopColor="#1E7D9E" />
          <stop offset="100%" stopColor="#0B2F64" />
        </linearGradient>
        <linearGradient id="ocdStemGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0D3E78" />
          <stop offset="100%" stopColor="#08254A" />
        </linearGradient>
      </defs>

      {/* Stem of the lowercase 'd' / logo icon */}
      <path 
        d="M 68,14 L 79,14 L 79,48 C 76,46 72,45 68,45 Z" 
        fill="url(#ocdStemGrad)" 
      />

      {/* Outer spiral ring */}
      <path 
        d="M 50,14 C 70,14 86,30 86,50 C 86,70 70,86 50,86 C 30,86 14,70 14,50 C 14,33 26,19 42,15 L 43,26 C 32,29 24,39 24,50 C 24,64 36,76 50,76 C 64,76 76,64 76,50 C 76,40 70,31 61,27 L 61,16 C 73,20 83,31 85,45 C 85,46 85,48 85,50 C 85,69 69,85 50,85 C 31,85 15,69 15,50 C 15,31 31,14 50,14 Z" 
        fill="url(#ocdSpiralGrad)" 
      />

      {/* Inner swoop ring */}
      <path 
        d="M 50,28 C 62,28 72,38 72,50 C 72,62 62,72 50,72 C 38,72 28,62 28,50 C 28,42 32,35 39,31 L 43,40 C 39,42 37,46 37,50 C 37,57 43,63 50,63 C 57,63 63,57 63,50 C 63,43 57,37 50,37 L 50,28 Z" 
        fill="url(#ocdSpiralGrad)"
        opacity="0.9"
      />
    </svg>
  );
};

export const OcdLogo: React.FC<OcdLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'pill',
  showText = true,
}) => {
  const iconSizes = {
    sm: 28,
    md: 38,
    lg: 48,
    xl: 60,
  };

  const currentIconSize = iconSizes[size];

  if (variant === 'icon-only' || !showText) {
    return <OcdSymbol size={currentIconSize} className={className} />;
  }

  if (variant === 'pill') {
    return (
      <div 
        className={`inline-flex items-center gap-2.5 bg-white border border-[#D5E5ED] rounded-full px-3.5 py-1.5 shadow-xs select-none transition-all hover:border-[#2B98BA]/60 ${className}`}
      >
        <OcdSymbol size={currentIconSize} />
        <div className="flex flex-col justify-center leading-none text-left">
          <span 
            className="font-black tracking-tight text-[#2B98BA] uppercase"
            style={{ 
              fontSize: size === 'sm' ? '11px' : size === 'lg' ? '16px' : size === 'xl' ? '20px' : '13.5px',
              letterSpacing: '-0.02em',
              fontWeight: 900
            }}
          >
            OESTE CENTRO
          </span>
          <span 
            className="font-black tracking-wider text-[#181B1E] uppercase mt-0.5"
            style={{ 
              fontSize: size === 'sm' ? '12px' : size === 'lg' ? '18px' : size === 'xl' ? '22px' : '15px',
              letterSpacing: '0.04em',
              fontWeight: 900
            }}
          >
            DE DISTRIBUCIÓN
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'dark-header') {
    return (
      <div className={`inline-flex items-center gap-3 select-none ${className}`}>
        <div className="bg-white p-1 rounded-full border border-[#2B98BA]/40 shadow-xs">
          <OcdSymbol size={currentIconSize} />
        </div>
        <div className="flex flex-col justify-center leading-none text-left">
          <span 
            className="font-black tracking-tight text-[#4AC3E7] uppercase"
            style={{ 
              fontSize: size === 'sm' ? '11px' : size === 'lg' ? '16px' : '13px',
              letterSpacing: '-0.01em',
              fontWeight: 900
            }}
          >
            OESTE CENTRO
          </span>
          <span 
            className="font-black tracking-wider text-white uppercase mt-0.5"
            style={{ 
              fontSize: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '14.5px',
              letterSpacing: '0.04em',
              fontWeight: 900
            }}
          >
            DE DISTRIBUCIÓN
          </span>
        </div>
      </div>
    );
  }

  // Full variant (transparent background)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <OcdSymbol size={currentIconSize} />
      <div className="flex flex-col justify-center leading-none text-left">
        <span 
          className="font-black tracking-tight text-[#2B98BA] uppercase"
          style={{ 
            fontSize: size === 'sm' ? '11px' : size === 'lg' ? '16px' : '13.5px',
            letterSpacing: '-0.02em',
            fontWeight: 900
          }}
        >
          OESTE CENTRO
        </span>
        <span 
          className="font-black tracking-wider text-[#181B1E] uppercase mt-0.5"
          style={{ 
            fontSize: size === 'sm' ? '12px' : size === 'lg' ? '18px' : '15px',
            letterSpacing: '0.04em',
            fontWeight: 900
          }}
        >
          DE DISTRIBUCIÓN
        </span>
      </div>
    </div>
  );
};
