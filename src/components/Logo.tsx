import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  variant?: 'light' | 'dark' | 'violet' | 'original';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = true,
  showSubtitle = false,
  variant = 'violet',
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const textSizes = {
    sm: 'text-lg font-extrabold',
    md: 'text-2xl font-extrabold',
    lg: 'text-3xl font-extrabold',
    xl: 'text-4xl font-black',
  };

  return (
    <div id="meetflow-brand-logo" className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official MeetFlow Logo Icon matching uploaded branding */}
      <div
        id="meetflow-logo-icon"
        className={`${iconSizes[size]} flex-shrink-0 flex items-center justify-center relative`}
      >
        <svg
          viewBox="0 0 200 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Left Ring Gradient: vibrant blue */}
            <linearGradient id="mf-left-ring-grad" x1="40" y1="50" x2="110" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0096ff" />
              <stop offset="50%" stopColor="#0077e6" />
              <stop offset="100%" stopColor="#0055cb" />
            </linearGradient>

            {/* Right Ring Gradient: cyan to turquoise to emerald green */}
            <linearGradient id="mf-right-ring-grad" x1="100" y1="50" x2="175" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00c8e2" />
              <stop offset="40%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#05c270" />
            </linearGradient>

            {/* Sweeping Arrow Gradient: blue through cyan to vivid green */}
            <linearGradient id="mf-arrow-ribbon-grad" x1="38" y1="120" x2="175" y2="40" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0072eb" />
              <stop offset="25%" stopColor="#0099ff" />
              <stop offset="55%" stopColor="#00c9c8" />
              <stop offset="80%" stopColor="#05c270" />
              <stop offset="100%" stopColor="#00d084" />
            </linearGradient>

            {/* Left Head Gradient */}
            <linearGradient id="mf-head-left-grad" x1="58" y1="20" x2="86" y2="52" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00a2ff" />
              <stop offset="100%" stopColor="#0070e0" />
            </linearGradient>

            {/* Right Head Gradient */}
            <linearGradient id="mf-head-right-grad" x1="122" y1="16" x2="150" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00d2ec" />
              <stop offset="100%" stopColor="#00a8cc" />
            </linearGradient>

            {/* Soft Depth Filter */}
            <filter id="mf-elevate" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3" floodColor="#004899" floodOpacity="0.25" />
            </filter>

            <filter id="mf-arrow-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0.8" dy="2.5" stdDeviation="3" floodColor="#002d6b" floodOpacity="0.32" />
            </filter>
          </defs>

          {/* Left Figure Head */}
          <circle cx="72" cy="38" r="14" fill="url(#mf-head-left-grad)" filter="url(#mf-elevate)" />

          {/* Right Figure Head */}
          <circle cx="136" cy="32" r="14" fill="url(#mf-head-right-grad)" filter="url(#mf-elevate)" />

          {/* Left Body Ring */}
          <circle cx="72" cy="92" r="30" stroke="url(#mf-left-ring-grad)" strokeWidth="12" fill="none" filter="url(#mf-elevate)" />

          {/* Right Body Ring */}
          <circle cx="136" cy="86" r="30" stroke="url(#mf-right-ring-grad)" strokeWidth="12" fill="none" filter="url(#mf-elevate)" />

          {/* Dynamic Sweeping Arrow Ribbon */}
          <g filter="url(#mf-arrow-shadow)">
            <path 
              d="M 42 110 C 40 124, 62 134, 84 122 C 108 108, 136 78, 158 52" 
              stroke="url(#mf-arrow-ribbon-grad)" 
              strokeWidth="11" 
              strokeLinecap="round" 
              fill="none" 
            />
            {/* Dynamic Arrowhead pointing up-right */}
            <polygon 
              points="176,34 150,42 168,64" 
              fill="#00d084" 
            />
          </g>
        </svg>
      </div>

      {/* Official meetflow lowercase wordmark matching uploaded brand image */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center tracking-tight leading-none">
            <span
              className={`${textSizes[size]} ${
                variant === 'dark' || variant === 'original'
                  ? 'text-[#101f3d]'
                  : 'text-white'
              }`}
            >
              meet
            </span>
            <span
              className={`${textSizes[size]} text-[#008be5]`}
            >
              flow
            </span>
          </div>
          {showSubtitle && (
            <span className="text-[10px] font-semibold text-sky-400/80 tracking-wide uppercase mt-1">
              Meeting Accountability & Flow
            </span>
          )}
        </div>
      )}
    </div>
  );
};
