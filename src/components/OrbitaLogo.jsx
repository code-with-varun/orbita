import React from 'react';

/**
 * Official Orbita Vector Logo Components
 * Powered by the official brand assets from /orbita_svg_assets/
 */

export function OrbitaIcon({ size = 36, className = "", style = {} }) {
  return (
    <img
      src="/orbita_svg_assets/orbita_icon.svg"
      alt="Orbita Icon"
      width={size}
      height={size}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        width: `${size}px`,
        height: `${size}px`,
        objectFit: 'contain',
        ...style
      }}
    />
  );
}

export function OrbitaHorizontalLockup({ height = 42, showBadge = false, badgeText = "by Runit Infotech", className = "" }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.85rem' }} className={className}>
      <img
        src="/orbita_svg_assets/orbita_horizontal.svg"
        alt="Orbita - Plan. Focus. Deliver."
        style={{
          height: `${height}px`,
          width: 'auto',
          display: 'block',
          objectFit: 'contain'
        }}
      />
      {showBadge && (
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: '700',
            padding: '0.2rem 0.55rem',
            borderRadius: '6px',
            background: 'rgba(124, 58, 237, 0.1)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            color: 'var(--accent-purple)',
            whiteSpace: 'nowrap'
          }}
        >
          {badgeText}
        </span>
      )}
    </div>
  );
}

export default function OrbitaLogo({
  size = 40,
  showTagline = false,
  showBadge = false,
  taglineText = "Plan. Focus. Deliver.",
  badgeText = "by Runit Infotech",
  variant = "horizontal", // 'horizontal' | 'icon' | 'lockup'
  className = ""
}) {
  if (variant === 'lockup') {
    return <OrbitaHorizontalLockup height={size} showBadge={showBadge} badgeText={badgeText} className={className} />;
  }

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
            Orbita
          </span>

          {showBadge && (
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: '700',
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
