'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import type { QuestionOption } from '@/types';

interface ScaleButtonsProps {
  options: QuestionOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  disabled?: boolean;
}

export default function ScaleButtons({ options, value, onChange, disabled }: ScaleButtonsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    gsap.fromTo(
      buttonRefs.current.filter(Boolean),
      { x: -30, opacity: 0, scale: 0.9 },
      {
        x: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: 'dp4Slide',
        stagger: 0.1,
      }
    );
  }, []);

  const handleSelect = (optionValue: string | number, index: number) => {
    if (disabled) return;

    const btn = buttonRefs.current[index];
    if (btn) {
      gsap.fromTo(
        btn,
        { scale: 1 },
        {
          scale: 1.06,
          duration: 0.12,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
        }
      );
    }

    onChange(optionValue);
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2.5">
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const color = option.color || '#F59E0B';

        return (
          <button
            key={String(option.value)}
            ref={(el) => { buttonRefs.current[index] = el; }}
            type="button"
            disabled={disabled}
            onClick={() => handleSelect(option.value, index)}
            className={`
              relative flex items-center gap-4 px-5 py-4 rounded-xl
              border-2 transition-all duration-300 text-left
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070C]
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
              ${
                isSelected
                  ? 'bg-white/[0.06] shadow-lg'
                  : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }
            `}
            style={
              isSelected
                ? {
                    borderColor: `${color}60`,
                    boxShadow: `0 0 20px ${color}15`,
                  }
                : undefined
            }
            aria-pressed={isSelected}
          >
            {/* Color indicator dot */}
            <div
              className={`
                w-4 h-4 rounded-full shrink-0 transition-all duration-300
                ${isSelected ? 'scale-110' : 'scale-100 opacity-60'}
              `}
              style={{ backgroundColor: color }}
            />

            {/* Label */}
            <span
              className={`
                text-base font-medium transition-colors duration-300
                ${isSelected ? 'text-foreground' : 'text-foreground/60'}
              `}
            >
              {option.label}
            </span>

            {/* Selected checkmark */}
            {isSelected && (
              <div className="ml-auto">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M5 10l3.5 3.5L15 7"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
