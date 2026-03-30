'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { gsap } from '@/lib/animations/gsap-config';

export default function Home() {
  const t = useTranslations('landing');
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline();
    tl.fromTo(
      logoRef.current,
      { y: 30, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'dp4Luxe' }
    );
    tl.fromTo(
      subtitleRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, ease: 'dp4Luxe' },
      '-=0.4'
    );
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex min-h-screen items-center justify-center bg-[#07070C] bg-grid relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <main className="flex flex-col items-center gap-8 text-center relative z-10">
        <h1
          ref={logoRef}
          className="text-6xl font-bold text-gradient-amber opacity-0"
        >
          {t('title')}
        </h1>
        <p
          ref={subtitleRef}
          className="text-lg text-muted-foreground max-w-md opacity-0"
        >
          {t('subtitle')}
        </p>
        <p className="text-sm text-muted-foreground/80 mt-8">
          {t('inDevelopment')}
        </p>
      </main>
    </div>
  );
}
