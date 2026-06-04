import React from 'react';
import logoImg from '../assets/Freelance_Logo.png';

/**
 * FreelanceHub brand mark logo.
 * Renders the custom Freelance_Logo.png image.
 */
export default function Logo({ size = 36, rounded = 11, className = '', style = {} }) {
  return (
    <img
      src={logoImg}
      alt="FreelanceHub"
      width={size}
      height={size}
      className={className}
      style={{
        borderRadius: rounded,
        objectFit: 'contain',
        ...style
      }}
    />
  );
}
