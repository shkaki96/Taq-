import { useTranslation } from 'react-i18next';
import React from 'react';

interface KurdishSun21Props {
  className?: string;
  size?: number;
  withBg?: boolean;
}

export default function KurdishSun21({ className = 'w-9 h-9', size = 100, withBg = true }: KurdishSun21Props) {
  const numRays = 21;
  const cx = 50;
  const cy = 50;
  const rCore = 14;
  const rTip = 44;
  const rBase = 15;
  const angleStep = (2 * Math.PI) / numRays;
  const halfBaseAngle = angleStep * 0.46;

  // Generate 21 ray paths
  const rays = Array.from({ length: numRays }, (_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const tipX = (cx + rTip * Math.cos(angle)).toFixed(2);
    const tipY = (cy + rTip * Math.sin(angle)).toFixed(2);
    
    const leftX = (cx + rBase * Math.cos(angle - halfBaseAngle)).toFixed(2);
    const leftY = (cy + rBase * Math.sin(angle - halfBaseAngle)).toFixed(2);
    
    const rightX = (cx + rBase * Math.cos(angle + halfBaseAngle)).toFixed(2);
    const rightY = (cy + rBase * Math.sin(angle + halfBaseAngle)).toFixed(2);

    return `M ${tipX} ${tipY} L ${rightX} ${rightY} A ${rBase} ${rBase} 0 0 0 ${leftX} ${leftY} Z`;
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kurdish Sun 21 Rays"
    >
      <defs>
        <linearGradient id="sunGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <radialGradient id="sunCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>
        <filter id="subtleShadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#D97706" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* White Background as requested */}
      {withBg && (
        <rect
          x="2"
          y="2"
          width="96"
          height="96"
          rx="22"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="2"
          className="shadow-sm"
        />
      )}

      {/* 21 Rays */}
      <g filter="url(#subtleShadow)">
        {rays.map((d, index) => (
          <path key={index} d={d} fill="url(#sunGoldGrad)" />
        ))}
      </g>

      {/* Central Sun Disc */}
      <circle
        cx={cx}
        cy={cy}
        r={rCore}
        fill="url(#sunCoreGlow)"
        stroke="#B45309"
        strokeWidth="0.8"
      />
      {/* Inner subtle core ring */}
      <circle
        cx={cx}
        cy={cy}
        r={rCore * 0.6}
        fill="none"
        stroke="#FEF08A"
        strokeWidth="0.8"
        opacity="0.6"
      />
    </svg>
  );
}
