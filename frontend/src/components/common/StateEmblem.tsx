import React from 'react';

interface StateEmblemProps {
  size?: number;
  className?: string;
  darkBg?: boolean;
}

export const StateEmblem: React.FC<StateEmblemProps> = ({ size = 48, className = "", darkBg = false }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/state_emblem.png" 
        alt="State Emblem of India" 
        style={{ 
          height: `${size}px`, 
          width: 'auto',
          filter: darkBg 
            ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(255,255,255,0.2))' 
            : 'none',
          mixBlendMode: darkBg ? 'screen' : 'multiply'
        }}
        className="object-contain transition-all duration-300"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
