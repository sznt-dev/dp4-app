'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from '@/lib/animations/gsap-config';

interface QuestionCardProps {
  children: ReactNode;
  label: string;
  description?: string;
  required?: boolean;
  subsection?: string;
  direction?: 'forward' | 'backward';
  isVisible?: boolean;
}

export default function QuestionCard({
  children,
  label,
  description,
  required,
  subsection,
  direction = 'forward',
  isVisible = true,
}: QuestionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!cardRef.current || !isVisible) return;

    if (!hasAnimated.current) {
      const fromX = direction === 'forward' ? 60 : -60;

      gsap.fromTo(
        cardRef.current,
        {
          y: 30,
          x: fromX,
          opacity: 0,
          scale: 0.97,
        },
        {
          y: 0,
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 1.0,
          ease: 'dp4Luxe',
          clearProps: 'transform',
        }
      );
      hasAnimated.current = true;
    }
  }, [isVisible, direction]);

  if (!isVisible) return null;

  return (
    <div
      ref={cardRef}
      className="w-full max-w-lg mx-auto opacity-0"
    >
      {/* Subsection badge */}
      {subsection && (
        <div className="mb-4">
          <span className="text-xs font-medium text-amber-500/70 uppercase tracking-wider">
            {subsection}
          </span>
        </div>
      )}

      {/* Question card */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 sm:p-8 shadow-lg">
        {/* Label */}
        <h2 className="text-lg sm:text-xl font-medium text-foreground leading-relaxed mb-1">
          {label}
          {required && (
            <span className="text-amber-500 ml-1" aria-label="obrigatório">*</span>
          )}
        </h2>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground/90 mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {!description && <div className="mb-6" />}

        {/* Input area */}
        <div className="space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
}
