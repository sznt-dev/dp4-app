'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import { Check, X } from 'lucide-react';

interface YesNoCardsProps {
  value: boolean | null;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export default function YesNoCards({ value, onChange, disabled }: YesNoCardsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const yesRef = useRef<HTMLButtonElement>(null);
  const noRef = useRef<HTMLButtonElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!containerRef.current || hasAnimated.current) return;
    hasAnimated.current = true;

    const cards = containerRef.current.children;
    gsap.fromTo(
      cards,
      { y: 20, opacity: 0, scale: 0.95 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'dp4Slide',
        stagger: 0.12,
      }
    );
  }, []);

  const handleSelect = (selected: boolean, buttonRef: React.RefObject<HTMLButtonElement | null>) => {
    if (disabled) return;

    // Micro-animation on selection
    if (buttonRef.current) {
      gsap.fromTo(
        buttonRef.current,
        { scale: 1 },
        {
          scale: 1.05,
          duration: 0.15,
          ease: 'power2.out',
          yoyo: true,
          repeat: 1,
          onComplete: () => {
            gsap.to(buttonRef.current, { scale: 1.02, duration: 0.2, ease: 'deyaBounce' });
          },
        }
      );
    }

    onChange(selected);
  };

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-3 sm:gap-4">
      {/* SIM */}
      <button
        ref={yesRef}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(true, yesRef)}
        className={`
          relative flex flex-col items-center justify-center gap-3
          min-h-[100px] sm:min-h-[120px] rounded-xl
          border-2 transition-colors duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070C]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
          ${
            value === true
              ? 'border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
          }
        `}
        aria-pressed={value === true}
      >
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
            ${value === true ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.05] text-muted-foreground'}
          `}
        >
          <Check className="w-5 h-5" />
        </div>
        <span
          className={`
            text-base font-semibold transition-colors duration-300
            ${value === true ? 'text-emerald-400' : 'text-foreground/70'}
          `}
        >
          Sim
        </span>
      </button>

      {/* NÃO */}
      <button
        ref={noRef}
        type="button"
        disabled={disabled}
        onClick={() => handleSelect(false, noRef)}
        className={`
          relative flex flex-col items-center justify-center gap-3
          min-h-[100px] sm:min-h-[120px] rounded-xl
          border-2 transition-colors duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070C]
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
          ${
            value === false
              ? 'border-red-500/60 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15] hover:bg-white/[0.04]'
          }
        `}
        aria-pressed={value === false}
      >
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
            ${value === false ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.05] text-muted-foreground'}
          `}
        >
          <X className="w-5 h-5" />
        </div>
        <span
          className={`
            text-base font-semibold transition-colors duration-300
            ${value === false ? 'text-red-400' : 'text-foreground/70'}
          `}
        >
          Não
        </span>
      </button>
    </div>
  );
}
