import React from 'react';

export default function Logo({ size = "md", showTagline = false, className = "" }) {
  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20"
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-5xl"
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official ApexLift Icon */}
      <div className={`${iconSizes[size]} relative flex-shrink-0 bg-ember rounded-[12px] flex items-center justify-center shadow-lg shadow-ember/20 overflow-hidden`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full p-1.5"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Barbell Horizontal Bar */}
          <line x1="8" y1="52" x2="92" y2="52" stroke="white" strokeWidth="7" strokeLinecap="round" />
          
          {/* Barbell Left Plates */}
          <rect x="12" y="38" width="5" height="28" rx="2" fill="white" />
          <rect x="19" y="43" width="4" height="18" rx="1.5" fill="white" />
          
          {/* Barbell Right Plates */}
          <rect x="77" y="43" width="4" height="18" rx="1.5" fill="white" />
          <rect x="83" y="38" width="5" height="28" rx="2" fill="white" />

          {/* White 'A' Peak (Chevron summit) */}
          <path 
            d="M25 74 L50 22 L75 74" 
            stroke="white" 
            strokeWidth="9" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className={`font-headline ${textSizes[size]} font-extrabold tracking-wider leading-none select-none flex items-center`}>
          <span className="text-white">APEX</span>
          <span className="text-ember-hot ml-1">LIFT</span>
        </div>
        {showTagline && (
          <span className="text-xs text-muted font-sans font-medium tracking-wide mt-1">
            Show up. Level up.
          </span>
        )}
      </div>
    </div>
  );
}
