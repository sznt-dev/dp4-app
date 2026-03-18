'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap-config';

interface ScaleSegmentedProps {
  min?: number;
  max?: number;
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export default function ScaleSegmented({
  min = 0,
  max = 10,
  value,
  onChange,
  disabled,
}: ScaleSegmentedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasAnimated = useRef(false);

  const count = max - min + 1;
  const values = Array.from({ length: count }, (_, i) => min + i);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    gsap.fromTo(
      buttonRefs.current.filter(Boolean),
      { y: 15, opacity: 0, scale: 0.8 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'dp4Slide',
        stagger: 0.05,
      }
    );
  }, []);

  const getColor = (val: number): string => {
    const ratio = (val - min) / (max - min);
    if (ratio <= 0.3) return '#10B981'; // green
    if (ratio <= 0.6) return '#F59E0B'; // yellow/amber
    if (ratio <= 0.8) return '#F97316'; // orange
    return '#EF4444'; // red
  };

  const handleSelect = (val: number, index: number) => {
    if (disabled) return;

    const btn = buttonRefs.current[index];
    if (btn) {
      const color = getColor(val);
      gsap.fromTo(
        btn,
        { scale: 1, boxShadow: 'none' },
        {
          scale: 1.15,
          boxShadow: `0 0 16px ${color}40`,
          duration: 0.15,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        }
      );
    }

    onChange(val);
  };

  return (
    <div className="space-y-3">
      {/* Scale buttons */}
      <div ref={containerRef} className="flex flex-wrap justify-center gap-2">
        {values.map((val, index) => {
          const isSelected = value === val;
          const color = getColor(val);

          return (
            <button
              key={val}
              ref={(el) => { buttonRefs.current[index] = el; }}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(val, index)}
              className={`
                w-11 h-11 sm:w-12 sm:h-12 rounded-full
                flex items-center justify-center
                text-sm font-bold transition-all duration-300
                border-2
                focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={
                isSelected
                  ? {
                      backgroundColor: `${color}20`,
                      borderColor: color,
                      color: color,
                      boxShadow: `0 0 20px ${color}30`,
                    }
                  : {
                      backgroundColor: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      color: 'rgba(255,255,255,0.5)',
                    }
              }
              aria-pressed={isSelected}
              aria-label={`${val} de ${max}`}
            >
              {val}
            </button>
          );
        })}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between px-2">
        <span className="text-xs text-muted-foreground/80">Nenhuma</span>
        <span className="text-xs text-muted-foreground/80">Extrema</span>
      </div>

      {/* Selected value display */}
      {value !== null && value !== undefined && (
        <div className="text-center">
          <span
            className="text-2xl font-bold"
            style={{ color: getColor(value) }}
          >
            {value}
          </span>
          <span className="text-sm text-muted-foreground/80 ml-1">/ {max}</span>
        </div>
      )}
    </div>
  );
}
