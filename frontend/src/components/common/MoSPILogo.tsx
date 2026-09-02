import React from 'react';

interface MoSPILogoProps {
  size?: number;
  className?: string;
}

export const MoSPILogo: React.FC<MoSPILogoProps> = ({ size = 36, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Outer Orange Gear Segment */}
        <path
          d="M50 8C26.8 8 8 26.8 8 50C8 61.6 12.7 72.1 20.3 79.7L32.2 67.8C27.1 63.3 24 57 24 50C24 35.6 35.6 24 50 24C64.4 24 76 35.6 76 50C76 57 72.9 63.3 67.8 67.8L79.7 79.7C87.3 72.1 92 61.6 92 50C92 26.8 73.2 8 50 8Z"
          fill="#E65100"
        />
        {/* Outer Green Base Segment */}
        <path
          d="M20.3 79.7C27.9 87.3 38.4 92 50 92C61.6 92 72.1 87.3 79.7 79.7L67.8 67.8C63.3 72.9 57 76 50 76C43 76 36.7 72.9 32.2 67.8L20.3 79.7Z"
          fill="#138808"
        />
        {/* Central Blue Chakra Circle */}
        <circle cx="50" cy="50" r="14" fill="#000080" />
        <circle cx="50" cy="50" r="10" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="4" fill="#000080" />
        {/* Spokes */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="50"
            y1="50"
            x2={50 + 9 * Math.cos((deg * Math.PI) / 180)}
            y2={50 + 9 * Math.sin((deg * Math.PI) / 180)}
            stroke="#000080"
            strokeWidth="1.2"
          />
        ))}
        {/* Gear Teeth accents */}
        <circle cx="50" cy="5" r="3" fill="#E65100" />
        <circle cx="95" cy="50" r="3" fill="#E65100" />
        <circle cx="5" cy="50" r="3" fill="#E65100" />
        <circle cx="50" cy="95" r="3" fill="#138808" />
      </svg>
    </div>
  );
};
