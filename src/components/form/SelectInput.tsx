'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import { ChevronDown } from 'lucide-react';
import type { QuestionOption } from '@/types';

interface SelectInputProps {
  options: QuestionOption[];
  value: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function SelectInput({
  options,
  value,
  onChange,
  placeholder = 'Selecione...',
  disabled,
}: SelectInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const selectedOption = options.find((o) => o.value === value);

  // Animate dropdown open/close
  useEffect(() => {
    if (!dropdownRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8, scaleY: 0.95 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.3, ease: 'dp4Slide' }
      );

      // Stagger options
      gsap.fromTo(
        optionRefs.current.filter(Boolean),
        { x: -10, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.25, ease: 'dp4Slide', stagger: 0.04 }
      );
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          px-4 py-3.5 rounded-xl border-2
          text-left text-base transition-all duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${
            isOpen
              ? 'border-amber-500/40 bg-white/[0.04] shadow-[0_0_20px_rgba(245,158,11,0.08)]'
              : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.15]'
          }
        `}
      >
        <span className={selectedOption ? 'text-foreground' : 'text-muted-foreground/60'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={`
            w-5 h-5 text-muted-foreground transition-transform duration-300
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="
            absolute z-50 w-full mt-2
            bg-[#0f0f18] backdrop-blur-none
            border border-white/[0.12] rounded-xl
            shadow-[0_8px_32px_rgba(0,0,0,0.6)]
            overflow-hidden
          "
        >
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((option, index) => {
              const isSelected = value === option.value;

              return (
                <button
                  key={String(option.value)}
                  ref={(el) => { optionRefs.current[index] = el; }}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`
                    w-full px-4 py-3 text-left text-base
                    transition-colors duration-150
                    ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'text-foreground/90 hover:bg-white/[0.06] hover:text-foreground'
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
