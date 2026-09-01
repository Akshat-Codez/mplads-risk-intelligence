import React from 'react';

interface StateEmblemProps {
  size?: number;
  className?: string;
  darkBg?: boolean;
}

export const StateEmblem: React.FC<StateEmblemProps> = ({ size = 48, className = "", darkBg = false }) => {
  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <img 
        src="/state_emblem.png" 
        alt="State Emblem of India" 
        style={{ 
          height: `${size}px`, 
          width: 'auto',
          filter: darkBg ? 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'none',
          mixBlendMode: darkBg ? 'normal' : 'multiply'
        }}
        className="object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
