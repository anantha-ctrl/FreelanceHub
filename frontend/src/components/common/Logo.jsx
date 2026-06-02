import React from 'react';

/**
 * FreelanceHub brand mark — a gradient "hub" glyph:
 * a central node connected to three satellite nodes (the freelancer network).
 * Scales cleanly at any size. Pass `size` (px) and optional `rounded` radius.
 */
let idSeq = 0;

export default function Logo({ size = 36, rounded = 11, className = '', style = {} }) {
  // Unique gradient id so multiple logos on one page don't clash.
  const gid = React.useMemo(() => `fh-logo-grad-${idSeq++}`, []);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      role="img"
      aria-label="FreelanceHub"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Badge */}
      <rect width="40" height="40" rx={rounded} fill={`url(#${gid})`} />

      {/* Connecting lines (center → satellites) */}
      <g stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.85">
        <line x1="20" y1="20" x2="20" y2="10" />
        <line x1="20" y1="20" x2="11.5" y2="28" />
        <line x1="20" y1="20" x2="28.5" y2="28" />
      </g>

      {/* Satellite nodes */}
      <g fill="#ffffff">
        <circle cx="20" cy="10" r="3" />
        <circle cx="11.5" cy="28" r="3" />
        <circle cx="28.5" cy="28" r="3" />
      </g>

      {/* Central hub node */}
      <circle cx="20" cy="20" r="4" fill="#ffffff" />
      <circle cx="20" cy="20" r="1.8" fill={`url(#${gid})`} />
    </svg>
  );
}
