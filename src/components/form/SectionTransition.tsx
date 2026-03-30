'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';
import { User, Brain, Heart, Activity, Moon } from 'lucide-react';

const SECTION_ICONS: Record<string, React.ReactNode> = {
  User: <User className="w-8 h-8" />,
  Brain: <Brain className="w-8 h-8" />,
  Heart: <Heart className="w-8 h-8" />,
  Activity: <Activity className="w-8 h-8" />,
  Moon: <Moon className="w-8 h-8" />,
};

interface SectionTransitionProps {
  title: string;
  description: string;
  sectionNumber: number;
  totalSections: number;
  icon: string;
  onComplete: () => void;
}

export default function SectionTransition({
  title,
  description,
  sectionNumber,
  totalSections,
  icon,
  onComplete,
}: SectionTransitionProps) {
  const t = useTranslations();
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      onComplete: () => {
        // After the transition, fade out and call onComplete
        gsap.to(containerRef.current, {
          opacity: 0,
          scale: 0.98,
          duration: 0.5,
          ease: 'dp4Luxe',
          onComplete,
        });
      },
    });

    // Container fade in
    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: 'dp4Luxe' }
    );

    // Section number
    tl.fromTo(
      numberRef.current,
      { opacity: 0, y: 15 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'dp4Luxe' },
      '-=0.2'
    );

    // Icon appears with scale
    tl.fromTo(
      iconRef.current,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.8, ease: 'deyaBounce' },
      '-=0.3'
    );

    // Title slides up
    tl.fromTo(
      titleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'dp4Luxe' },
      '-=0.4'
    );

    // Description
    tl.fromTo(
      descRef.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'dp4Luxe' },
      '-=0.3'
    );

    // Hold for a dramatic pause
    tl.to({}, { duration: 1.5 });
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#07070C]/95 backdrop-blur-lg opacity-0"
    >
      <div className="flex flex-col items-center gap-5 text-center px-8">
        {/* Section number */}
        <span
          ref={numberRef}
          className="text-xs font-medium text-amber-500/50 uppercase tracking-[0.2em] opacity-0"
        >
          {t('form.sectionOf', { current: sectionNumber, total: totalSections })}
        </span>

        {/* Icon */}
        <div
          ref={iconRef}
          className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 opacity-0"
        >
          {SECTION_ICONS[icon] || <Activity className="w-8 h-8" />}
        </div>

        {/* Title */}
        <h2
          ref={titleRef}
          className="text-2xl sm:text-3xl font-bold text-foreground opacity-0"
        >
          {title}
        </h2>

        {/* Description */}
        <p
          ref={descRef}
          className="text-sm text-muted-foreground/80 max-w-sm opacity-0"
        >
          {description}
        </p>
      </div>
    </div>
  );
}
