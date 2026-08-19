import React from 'react';

/**
 * Official Orbita Vector Logo Component
 * Extracted from the exact Brand Design Spec:
 * Gradients: #7C3AED (Purple) -> #EC4899 (Pink) -> #F59E0B (Orange)
 * Tagline: Plan. Focus. Deliver.
 */
export function OrbitaIcon({ size = 36, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        {/* Main Planet & Ring Gradient */}
        <linearGradient id="orbitaGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>

        {/* Arrow Gradient */}
        <linearGradient id="orbitaArrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Top Right Satellite Dot */}
      <circle cx="68" cy="22" r="4.5" fill="#F59E0B" />

      {/* Main Orbital 'O' Planet Ring Body */}
      <path
        d="M 50 14 C 28.5 14 14 30.5 14 52 C 14 73.5 30 88 51 88 C 69 88 84 75 86 57 C 82 66 70 73 53 73 C 36 73 26 62 26 50 C 26 36 37 27 52 27 C 62 27 70 31 75 38 C 77 34 81 29 84 25 C 76 18 64 14 50 14 Z"
        fill="url(#orbitaGrad)"
      />

      {/* Dynamic Swoosh Ring Cutting Across */}
      <path
        d="M 12 62 C 18 70 29 72 43 66 C 58 59 71 47 81 33 C 78 37 72 45 61 51 C 48 58 35 60 22 55 C 17 53 14 49 12 45 C 11 50 11 57 12 62 Z"
        fill="#7C3AED"
      />
      <path
        d="M 23 68 C 36 72 53 66 69 52 C 78 44 84 34 88 24 L 79 31 C 71 42 60 50 48 55 C 37 59 28 59 23 57 C 22 61 22 65 23 68 Z"
        fill="url(#orbitaGrad)"
      />

      {/* Upward Growth Arrow */}
      <path
        d="M 72 38 L 88 18 M 88 18 L 74 19 M 88 18 L 87 32"
        stroke="url(#orbitaArrowGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="89,17 73,20 81,28" fill="url(#orbitaArrowGrad)" />

      {/* Sparkles */}
      {/* Left Purple Sparkle */}
      <path
        d="M 12 36 Q 14 38 16 38 Q 14 38 12 40 Q 14 38 12 36 Q 10 38 12 38 Q 10 38 12 36"
        fill="#7C3AED"
      />
      {/* Right Orange Sparkle */}
      <circle cx="86" cy="48" r="2" fill="#F59E0B" />
    </svg>
  );
}

export default function OrbitaLogo({
  size = 40,
  showTagline = false,
  showBadge = false,
  taglineText = "Plan. Focus. Deliver.",
  badgeText = "by Runit Infotech",
  className = ""
}) {
  return (
    <div className={`orbita-brand-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
      <OrbitaIcon size={size} />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            className="orbita-brand-text"
            style={{
              fontFamily: 'var(--font-display, "Outfit", sans-serif)',
              fontWeight: '800',
              fontSize: `${size * 0.58}px`,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              color: 'var(--text-main)'
            }}
          >
            Orb<span style={{ position: 'relative' }}>
              i
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: `${size * 0.1}px`,
                  height: `${size * 0.1}px`,
                  borderRadius: '50%',
                  backgroundColor: '#F59E0B'
                }}
              />
            </span>ta
          </span>

          {showBadge && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: '600',
                padding: '0.15rem 0.45rem',
                borderRadius: '6px',
                background: 'rgba(124, 58, 237, 0.1)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: 'var(--accent-purple)'
              }}
            >
              {badgeText}
            </span>
          )}
        </div>

        {showTagline && (
          <div
            style={{
              fontSize: `${Math.max(10, size * 0.22)}px`,
              fontWeight: '700',
              marginTop: '0.2rem',
              letterSpacing: '0.04em',
              background: 'linear-gradient(90deg, #7C3AED, #EC4899, #F59E0B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {taglineText}
          </div>
        )}
      </div>
    </div>
  );
}
