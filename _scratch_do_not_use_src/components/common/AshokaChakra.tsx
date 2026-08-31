import React from 'react';

export const AshokaChakra: React.FC<{ size?: number; className?: string }> = ({ size = 36, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="50" cy="50" r="46" stroke="#000080" strokeWidth="4"/>
    <circle cx="50" cy="50" r="10" fill="#000080"/>
    {/* 24 Spokes */}
    {Array.from({ length: 24 }).map((_, i) => {
      const angle = (i * 15 * Math.PI) / 180;
      const x2 = 50 + 44 * Math.cos(angle);
      const y2 = 50 + 44 * Math.sin(angle);
      return <line key={i} x1="50" y1="50" x2={x2} y2={y2} stroke="#000080" strokeWidth="2" />;
    })}
  </svg>
);
