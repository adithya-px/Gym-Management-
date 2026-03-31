import React from 'react';
import './OrbitalLoader.css';

/**
 * OrbitalLoader – three concentric counter-rotating rings.
 *
 * Props:
 *   message          – optional text shown next to/below the spinner
 *   messagePlacement – "bottom" | "top" | "left" | "right"  (default: "bottom")
 *   size             – CSS size string for the outer ring  (default: "4rem")
 *   color            – border-top colour of each ring  (default: inherits --text-primary)
 *   className        – extra class names on the root wrapper
 */
const OrbitalLoader = ({
  message,
  messagePlacement = 'bottom',
  size = '4rem',
  color,
  className = '',
  style = {},
}) => {
  const ringColor = color || 'var(--text-primary, #E6EDF3)';

  const sizeNum = parseFloat(size);   // e.g. 4  (rem)
  const unit    = size.replace(/[\d.]/g, '') || 'rem';
  const offset1 = 0;
  const offset2 = `${sizeNum * 0.125}${unit}`;   // 8px when size = 4rem
  const offset3 = `${sizeNum * 0.25}${unit}`;    // 16px when size = 4rem

  return (
    <div
      className={`orbital-loader-wrap placement-${messagePlacement} ${className}`}
      style={style}
    >
      <div className="orbital-loader" style={{ width: size, height: size }}>
        <div
          className="orbital-ring orbital-ring-1"
          style={{ inset: offset1, borderTopColor: ringColor }}
        />
        <div
          className="orbital-ring orbital-ring-2"
          style={{ inset: offset2, borderTopColor: ringColor }}
        />
        <div
          className="orbital-ring orbital-ring-3"
          style={{ inset: offset3, borderTopColor: ringColor }}
        />
      </div>

      {message && (
        <span className="orbital-loader-message">{message}</span>
      )}
    </div>
  );
};

export default OrbitalLoader;
