'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface NavigationButtonsProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastQuestion: boolean;
  isRequired: boolean;
  hasValue: boolean;
}

export default function NavigationButtons({
  onNext,
  onPrev,
  canGoNext,
  canGoPrev,
  isLastQuestion,
  isRequired,
  hasValue,
}: NavigationButtonsProps) {
  const t = useTranslations('common');
  const nextRef = useRef<HTMLButtonElement>(null);

  const isNextDisabled = isRequired && !hasValue;

  const handleNext = () => {
    if (isNextDisabled) {
      // Shake animation for required fields
      if (nextRef.current) {
        gsap.fromTo(
          nextRef.current,
          { x: 0 },
          {
            x: 8,
            duration: 0.08,
            yoyo: true,
            repeat: 5,
            ease: 'power2.inOut',
          }
        );
      }
      return;
    }
    onNext();
  };

  return (
    <div className="flex items-center justify-between gap-4 mt-8">
      {/* Back button */}
      <button
        type="button"
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-xl
          text-sm font-medium transition-all duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
          ${
            canGoPrev
              ? 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
              : 'text-muted-foreground/20 cursor-not-allowed'
          }
        `}
      >
        <ArrowLeft className="w-4 h-4" />
        {t('back')}
      </button>

      {/* Next / Complete button */}
      <button
        ref={nextRef}
        type="button"
        onClick={handleNext}
        className={`
          flex items-center gap-2 px-6 py-3 rounded-xl
          text-sm font-semibold transition-all duration-300
          focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
          ${
            isNextDisabled
              ? 'bg-white/[0.04] text-muted-foreground/80 cursor-not-allowed'
              : isLastQuestion
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/25 hover:bg-amber-500/25'
          }
        `}
      >
        {isLastQuestion ? (
          <>
            {t('finish')}
            <Check className="w-4 h-4" />
          </>
        ) : (
          <>
            {t('next')}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

    </div>
  );
}

// Separate skip hint component to avoid absolute positioning issues
export function SkipHint({
  isRequired,
  hasValue,
  onSkip,
}: {
  isRequired: boolean;
  hasValue: boolean;
  onSkip: () => void;
}) {
  const t = useTranslations('common');

  if (isRequired || hasValue) return null;

  return (
    <div className="text-center mt-3">
      <button
        type="button"
        onClick={onSkip}
        className="text-xs text-muted-foreground/80 hover:text-muted-foreground/90 transition-colors py-1"
      >
        {t('skipQuestion')}
      </button>
    </div>
  );
}
