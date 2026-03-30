'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';
import type { ScoreResult as ScoreResultType } from '@/types';

interface ScoreResultProps {
  title: string;
  result: ScoreResultType;
  icon?: React.ReactNode;
  scoreType?: 'lipp' | 'bruxismo' | 'epworth';
}

export default function ScoreResult({ title, result, icon, scoreType }: ScoreResultProps) {
  const t = useTranslations('scores');
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const classificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();

    // Container fade in
    tl.fromTo(
      containerRef.current,
      { opacity: 0, y: 30, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'dp4Luxe' }
    );

    // Counter animation 0 → score
    if (counterRef.current) {
      tl.fromTo(
        { val: 0 },
        { val: 0 },
        {
          val: result.score,
          duration: 1.5,
          ease: 'dp4Reveal',
          onUpdate: function () {
            if (counterRef.current) {
              counterRef.current.textContent = Math.round(this.targets()[0].val).toString();
            }
          },
        },
        '-=0.6'
      );
    }

    // Badge pulse
    if (badgeRef.current) {
      tl.fromTo(
        badgeRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'deyaBounce',
        },
        '-=0.8'
      );

      // Gentle pulse loop
      tl.to(badgeRef.current, {
        scale: 1.03,
        duration: 1.5,
        ease: 'dp4Breathe',
        yoyo: true,
        repeat: 3,
      });
    }

    // Classification fade in
    if (classificationRef.current) {
      tl.fromTo(
        classificationRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'dp4Luxe' },
        '-=3'
      );
    }
  }, [result.score]);

  return (
    <div
      ref={containerRef}
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 sm:p-8 text-center space-y-5 opacity-0"
    >
      {/* Icon + Title */}
      <div className="flex flex-col items-center gap-2">
        {icon && (
          <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center text-muted-foreground">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-medium text-muted-foreground/90 uppercase tracking-wider">
          {title}
        </h3>
      </div>

      {/* Score counter */}
      <div className="flex items-baseline justify-center gap-2">
        <span
          ref={counterRef}
          className="text-5xl sm:text-6xl font-bold"
          style={{ color: result.color }}
        >
          0
        </span>
        <span className="text-lg text-muted-foreground/70">
          / {result.maxScore}
        </span>
      </div>

      {/* Classification badge */}
      <div ref={badgeRef} className="inline-block opacity-0">
        <span
          className="inline-flex px-4 py-1.5 rounded-full text-sm font-semibold border"
          style={{
            color: result.color,
            backgroundColor: `${result.color}15`,
            borderColor: `${result.color}30`,
          }}
        >
          {result.classification}
        </span>
      </div>

      {/* Visual bar */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${(result.score / result.maxScore) * 100}%`,
              backgroundColor: result.color,
            }}
          />
        </div>
      </div>

      {/* Description */}
      <div ref={classificationRef} className="opacity-0">
        <p className="text-sm text-muted-foreground/80 leading-relaxed">
          {result.severity && t(`severity.${result.severity}`)}
        </p>
      </div>
    </div>
  );
}
