'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import { Check } from 'lucide-react';
import type { QuestionOption } from '@/types';

interface CheckboxGroupProps {
  options: QuestionOption[];
  value: (string | number)[];
  onChange: (value: (string | number)[]) => void;
  disabled?: boolean;
}

export default function CheckboxGroup({ options, value, onChange, disabled }: CheckboxGroupProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    gsap.fromTo(
      itemRefs.current.filter(Boolean),
      { y: 15, opacity: 0, scale: 0.97 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.4,
        ease: 'dp4Slide',
        stagger: 0.06,
      }
    );
  }, []);

  const toggleItem = (optionValue: string | number, index: number) => {
    if (disabled) return;

    const btn = itemRefs.current[index];
    const isNowSelected = !value.includes(optionValue);

    // Toggle animation
    if (btn) {
      if (isNowSelected) {
        gsap.fromTo(
          btn,
          { scale: 1 },
          { scale: 1.02, duration: 0.15, ease: 'power2.out', yoyo: true, repeat: 1 }
        );
      }
    }

    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      {options.map((option, index) => {
        const isSelected = value.includes(option.value);

        return (
          <button
            key={String(option.value)}
            ref={(el) => { itemRefs.current[index] = el; }}
            type="button"
            disabled={disabled}
            onClick={() => toggleItem(option.value, index)}
            className={`
              flex items-center gap-3 px-4 py-3.5 rounded-xl
              border-2 text-left transition-all duration-300
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}
              ${
                isSelected
                  ? 'border-amber-500/40 bg-amber-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
              }
            `}
            aria-pressed={isSelected}
          >
            {/* Checkbox indicator */}
            <div
              className={`
                w-6 h-6 rounded-md shrink-0 flex items-center justify-center
                border-2 transition-all duration-300
                ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/20'
                    : 'border-white/[0.15] bg-transparent'
                }
              `}
            >
              {isSelected && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </div>

            {/* Label */}
            <span
              className={`
                text-sm sm:text-base transition-colors duration-300
                ${isSelected ? 'text-foreground' : 'text-foreground/60'}
              `}
            >
              {option.label}
            </span>
          </button>
        );
      })}

      {/* Count */}
      {value.length > 0 && (
        <p className="text-xs text-amber-500/60 mt-1 text-right">
          {value.length} selecionado{value.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
