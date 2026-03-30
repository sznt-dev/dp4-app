'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface ProgressBarProps {
  currentSection: number;
  totalSections: number;
  answeredQuestions: number;
  totalQuestions: number;
}

export default function ProgressBar({
  currentSection,
  totalSections,
  answeredQuestions,
  totalQuestions,
}: ProgressBarProps) {
  const t = useTranslations('form');
  const barRef = useRef<HTMLDivElement>(null);
  const percentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
  const remaining = totalQuestions - answeredQuestions;

  useEffect(() => {
    if (barRef.current) {
      gsap.to(barRef.current, {
        width: `${percentage}%`,
        duration: 0.6,
        ease: 'deyaSmooth',
      });
    }
  }, [percentage]);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[#07070C]/90 backdrop-blur-md border-b border-white/5">
      {/* Progress bar */}
      <div className="h-1 w-full bg-white/5">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-r-full"
          style={{ width: '0%' }}
        />
      </div>

      {/* Info row */}
      <div className="flex items-center justify-between px-4 py-2.5 max-w-lg mx-auto">
        <span className="text-xs text-muted-foreground">
          {t('sectionOf', { current: currentSection, total: totalSections })}
        </span>
        <span className="text-xs font-medium text-foreground/70">
          {percentage}%
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {remaining > 0 ? `${remaining} restantes` : 'Completo!'}
          </span>
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
