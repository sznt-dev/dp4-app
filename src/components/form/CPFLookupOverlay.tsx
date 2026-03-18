'use client';

import { useEffect, useRef } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import { FileText, Clock, RefreshCw } from 'lucide-react';
import type { CPFLookupStatus } from '@/types';

interface CPFLookupOverlayProps {
  status: Exclude<CPFLookupStatus, 'new'>;
  completedAt?: string;
  remainingDays?: number;
  onResume: () => void;
  onStartFresh: () => void;
  onClose: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function CPFLookupOverlay({
  status,
  completedAt,
  remainingDays,
  onResume,
  onStartFresh,
  onClose,
}: CPFLookupOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'dp4Luxe' } });

    tl.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6 }
    )
      .fromTo(
        iconRef.current,
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'deyaBounce' },
        '-=0.3'
      )
      .fromTo(
        titleRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        '-=0.4'
      )
      .fromTo(
        descRef.current,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        '-=0.4'
      )
      .fromTo(
        buttonsRef.current?.children || [],
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.15 },
        '-=0.3'
      );

    return () => { tl.kill(); };
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'incomplete':
        return {
          icon: <FileText className="w-8 h-8 text-amber-400" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20',
          title: 'Formulário em andamento',
          description: 'Encontramos um formulário que você começou a preencher. Deseja continuar de onde parou?',
          buttons: (
            <>
              <button
                type="button"
                onClick={onResume}
                className="w-full py-4 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-semibold hover:bg-amber-500/25 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
              >
                Continuar de onde parei
              </button>
              <button
                type="button"
                onClick={onStartFresh}
                className="w-full py-4 rounded-xl bg-white/[0.03] text-muted-foreground/90 border border-white/[0.06] text-sm font-medium hover:bg-white/[0.06] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Começar do zero
              </button>
            </>
          ),
        };

      case 'blocked':
        return {
          icon: <Clock className="w-8 h-8 text-blue-400" />,
          iconBg: 'bg-blue-500/10 border-blue-500/20',
          title: 'Prontuário já preenchido',
          description: `Seu prontuário foi preenchido em ${completedAt ? formatDate(completedAt) : '—'}. Para preencher novamente ou fazer o controle, fale com o seu dentista.`,
          buttons: (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-4 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/25 text-sm font-semibold hover:bg-blue-500/25 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            >
              Entendi
            </button>
          ),
        };

      case 'control_eligible':
        return {
          icon: <RefreshCw className="w-8 h-8 text-emerald-400" />,
          iconBg: 'bg-emerald-500/10 border-emerald-500/20',
          title: 'Controle disponível',
          description: `Seu último prontuário tem mais de 90 dias. Deseja preencher o formulário de controle?`,
          buttons: (
            <>
              <button
                type="button"
                onClick={onStartFresh}
                className="w-full py-4 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-sm font-semibold hover:bg-emerald-500/25 transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              >
                Preencher controle
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 rounded-xl bg-white/[0.03] text-muted-foreground/90 border border-white/[0.06] text-sm font-medium hover:bg-white/[0.06] transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
              >
                Agora não
              </button>
            </>
          ),
        };
    }
  };

  const content = renderContent();

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-[#07070C]/95 backdrop-blur-lg flex items-center justify-center px-4"
      style={{ opacity: 0 }}
    >
      <div className="w-full max-w-md text-center space-y-6">
        <div
          ref={iconRef}
          className={`mx-auto w-16 h-16 rounded-full ${content.iconBg} border flex items-center justify-center`}
        >
          {content.icon}
        </div>

        <div className="space-y-3">
          <h2 ref={titleRef} className="text-2xl font-bold text-foreground">
            {content.title}
          </h2>
          <p ref={descRef} className="text-muted-foreground/90 leading-relaxed text-sm">
            {content.description}
          </p>
        </div>

        <div ref={buttonsRef} className="space-y-3">
          {content.buttons}
        </div>
      </div>
    </div>
  );
}
