import React from 'react';

interface StateEmblemProps {
  size?: number;
  className?: string;
  darkBg?: boolean;
}

export const StateEmblem: React.FC<StateEmblemProps> = ({ size = 64, className = "", darkBg = false }) => {
  // If dark navy background, do not display image on dark navy as requested by user
  if (darkBg) {
    return null;
  }

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img 
        src="/state_emblem.png" 
        alt="State Emblem of India" 
        style={{ 
          height: `${size}px`, 
          width: 'auto',
          mixBlendMode: 'multiply'
        }}
        className="object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    </div>
  );
};
