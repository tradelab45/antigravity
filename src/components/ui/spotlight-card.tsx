import React, { useEffect, useRef, useState, ReactNode } from 'react';

interface GlowCardProps {
  children?: ReactNode;
  className?: string;
  glowColor?: 'blue' | 'purple' | 'green' | 'red' | 'orange';
  size?: 'sm' | 'md' | 'lg';
  width?: string | number;
  height?: string | number;
  customSize?: boolean; // When true, ignores size prop and uses width/height or className
}

const glowColorMap = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 }
};

const sizeMap = {
  sm: 'w-48 h-64',
  md: 'w-64 h-80',
  lg: 'w-80 h-96'
};

const GlowCard: React.FC<GlowCardProps> = ({ 
  children, 
  className = '', 
  glowColor = 'blue',
  size = 'md',
  width,
  height,
  customSize = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // On touch devices / phones, skip global pointermove tracking to save CPU and ensure 60fps scrolling
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const syncPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      const { clientX: x, clientY: y } = e;
      
      if (cardRef.current) {
        cardRef.current.style.setProperty('--x', x.toFixed(2));
        cardRef.current.style.setProperty('--xp', (x / window.innerWidth).toFixed(2));
        cardRef.current.style.setProperty('--y', y.toFixed(2));
        cardRef.current.style.setProperty('--yp', (y / window.innerHeight).toFixed(2));
      }
    };

    document.addEventListener('pointermove', syncPointer, { passive: true });
    return () => document.removeEventListener('pointermove', syncPointer);
  }, []);

  const { base, spread } = glowColorMap[glowColor];

  // Determine sizing
  const getSizeClasses = () => {
    if (customSize) {
      return ''; // Let className or inline styles handle sizing
    }
    return sizeMap[size];
  };

  const getInlineStyles = () => {
    const baseStyles: React.CSSProperties & Record<string, any> = {
      '--base': base,
      '--spread': spread,
      '--radius': '14',
      '--border': '3',
      '--backdrop': 'hsl(0 0% 60% / 0.12)',
      '--backup-border': 'var(--backdrop)',
      '--size': '200',
      '--outer': '1',
      '--border-size': 'calc(var(--border, 2) * 1px)',
      '--spotlight-size': 'calc(var(--size, 150) * 1px)',
      '--hue': 'calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))',
      backgroundImage: `radial-gradient(
        var(--spotlight-size) var(--spotlight-size) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent
      )`,
      backgroundColor: 'var(--backdrop, transparent)',
      backgroundSize: 'calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))',
      backgroundPosition: '50% 50%',
      backgroundAttachment: 'fixed',
      border: 'var(--border-size) solid var(--backup-border)',
      position: 'relative' as const,
      touchAction: 'pan-y' as const,
    };

    // Add width and height if provided
    if (width !== undefined) {
      baseStyles.width = typeof width === 'number' ? `${width}px` : width;
    }
    if (height !== undefined) {
      baseStyles.height = typeof height === 'number' ? `${height}px` : height;
    }

    return baseStyles;
  };

  const beforeAfterStyles = `
    [data-glow]::before,
    [data-glow]::after {
      pointer-events: none;
      content: "";
      position: absolute;
      inset: calc(var(--border-size) * -1);
      border: var(--border-size) solid transparent;
      border-radius: calc(var(--radius) * 1px);
      background-attachment: fixed;
      background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
      background-repeat: no-repeat;
      background-position: 50% 50%;
      mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
      mask-clip: padding-box, border-box;
      mask-composite: intersect;
    }
    
    [data-glow]::before {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%
      );
      filter: brightness(2);
    }
    
    [data-glow]::after {
      background-image: radial-gradient(
        calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
        calc(var(--x, 0) * 1px)
        calc(var(--y, 0) * 1px),
        hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%
      );
    }
    
    [data-glow] [data-glow-halo] {
      position: absolute;
      inset: 0;
      will-change: filter;
      opacity: var(--outer, 1);
      border-radius: calc(var(--radius) * 1px);
      border-width: calc(var(--border-size) * 20);
      filter: blur(calc(var(--border-size) * 10));
      background: none;
      pointer-events: none;
      border: none;
    }
    
    [data-glow] [data-glow-halo]::before {
      inset: -10px;
      border-width: 10px;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: beforeAfterStyles }} />
      <div
        ref={cardRef}
        data-glow
        style={getInlineStyles()}
        className={`
          ${getSizeClasses()}
          ${!customSize ? 'aspect-[3/4]' : ''}
          rounded-2xl 
          relative 
          grid 
          grid-rows-[1fr_auto] 
          shadow-[0_1rem_2rem_-1rem_black] 
          p-4 
          gap-4 
          backdrop-blur-[5px]
          ${className}
        `}
      >
        <div ref={innerRef} data-glow data-glow-halo></div>
        {children}
      </div>
    </>
  );
};

export { GlowCard };

// ============================================================================
// Interactive Stock Spotlight Card
// Engineered specifically for Market Screener, Share Boxes & Financial Dashboards.
// Supports Light & Dark themes, 60fps local pointer tracking, glowing borders,
// and subtle 3D micro-tilt.
// ============================================================================

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  className?: string;
  glowColor?: 'green' | 'red' | 'blue' | 'purple' | 'orange' | 'emerald' | 'amber' | 'cyan';
  spotlightSize?: number;
  borderGlow?: boolean;
  tiltEffect?: boolean;
}

const SPOTLIGHT_PALETTES = {
  green: {
    radial: 'rgba(0, 245, 155, 0.15)',
    border: 'rgba(0, 245, 155, 0.85)',
  },
  emerald: {
    radial: 'rgba(16, 185, 129, 0.16)',
    border: 'rgba(16, 185, 129, 0.85)',
  },
  red: {
    radial: 'rgba(244, 63, 94, 0.15)',
    border: 'rgba(244, 63, 94, 0.85)',
  },
  blue: {
    radial: 'rgba(56, 189, 248, 0.15)',
    border: 'rgba(56, 189, 248, 0.85)',
  },
  purple: {
    radial: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.85)',
  },
  orange: {
    radial: 'rgba(249, 115, 22, 0.15)',
    border: 'rgba(249, 115, 22, 0.85)',
  },
  amber: {
    radial: 'rgba(245, 158, 11, 0.15)',
    border: 'rgba(245, 158, 11, 0.85)',
  },
  cyan: {
    radial: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.85)',
  },
};

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  glowColor = 'green',
  spotlightSize = 340,
  borderGlow = true,
  tiltEffect = true,
  style,
  onMouseMove,
  onMouseLeave,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const palette = SPOTLIGHT_PALETTES[glowColor] || SPOTLIGHT_PALETTES.green;

  const handlePointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    // Skip on touch to ensure buttery mobile scrolling
    if ((e.nativeEvent as any)?.pointerType === 'touch') return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCoords({ x, y });
    setIsHovered(true);

    if (tiltEffect) {
      const xPercent = (x / rect.width) - 0.5;
      const yPercent = (y / rect.height) - 0.5;
      setTilt({
        x: -yPercent * 3.5,
        y: xPercent * 3.5
      });
    }

    if (onMouseMove) onMouseMove(e);
  };

  const handlePointerLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
    setCoords({ x: -1000, y: -1000 });
    if (onMouseLeave) onMouseLeave(e);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
      style={{
        ...style,
        touchAction: 'pan-y' as const,
        transform: tiltEffect && isHovered 
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` 
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg)',
        transition: isHovered ? 'transform 0.12s ease-out, box-shadow 0.25s ease' : 'transform 0.35s ease-out, box-shadow 0.25s ease',
      }}
      className={`relative group rounded-3xl isolate transition-all duration-300 overflow-hidden ${className}`}
      {...props}
    >
      {/* Dynamic Radial Spotlight Beam */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 z-0"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(${spotlightSize}px circle at ${coords.x}px ${coords.y}px, ${palette.radial}, transparent 75%)`,
        }}
      />

      {/* Interactive Glowing Border Highlight Mask */}
      {borderGlow && (
        <div
          className="pointer-events-none absolute -inset-[1px] rounded-[inherit] transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 1 : 0,
            padding: '1.5px',
            background: `radial-gradient(${spotlightSize * 0.75}px circle at ${coords.x}px ${coords.y}px, ${palette.border}, transparent 70%)`,
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Internal Content (Rendered above spotlight background) */}
      <div className="relative z-[1] h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
