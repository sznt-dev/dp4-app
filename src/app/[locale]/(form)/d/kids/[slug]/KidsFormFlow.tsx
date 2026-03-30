'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FormEngine, { type FormEngineHandle } from '@/components/form/FormEngine';
import { KIDS_SECTIONS, KIDS_QUESTIONS_BY_SECTION, ALL_KIDS_QUESTIONS } from '@/lib/questions/kids';
import { calculateAOS, calculateSCARED, calculateRitmoSono } from '@/lib/scoring/kids';

interface KidsFormFlowProps {
  slug: string;
  dentistId: string;
  dentistName: string;
}

export default function KidsFormFlow({
  slug,
  dentistId,
  dentistName,
}: KidsFormFlowProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [scores, setScores] = useState<Record<string, unknown> | null>(null);

  const submissionIdRef = useRef(`dev-kids-${slug}`);
  const answersRef = useRef<Record<string, unknown>>({});
  const formEngineRef = useRef<FormEngineHandle>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSaveRef = useRef(true);

  // Save to API (reuses adult save endpoint)
  const saveToAPI = useCallback(async (data: {
    questionId: string;
    section: string;
    field: string;
    value: unknown;
    currentSection: number;
    currentQuestionIndex: number;
    answeredQuestions: number;
  }) => {
    try {
      const payload = {
        submissionId: submissionIdRef.current,
        questionId: data.questionId,
        section: data.section,
        field: data.field,
        value: data.value,
        currentSection: data.currentSection,
        currentQuestionIndex: data.currentQuestionIndex,
        answeredQuestions: data.answeredQuestions,
        patientName: answersRef.current.kids_nome_crianca as string | undefined,
        patientCpf: answersRef.current.kids_cpf_responsavel as string | undefined,
        dentistId,
        submissionType: 'first',
        formType: 'kids',
      };

      const res = await fetch('/api/submissions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.ok && result.created && result.submissionId) {
        submissionIdRef.current = result.submissionId;
        formEngineRef.current?.updateSubmissionId(result.submissionId);
      }
    } catch (error) {
      console.error('[Kids Auto-save error]', error);
    }
  }, [dentistId]);

  const handleAutoSave = useCallback(
    (data: {
      questionId: string;
      section: string;
      field: string;
      value: unknown;
      currentSection: number;
      currentQuestionIndex: number;
      answeredQuestions: number;
    }) => {
      answersRef.current = { ...answersRef.current, [data.questionId]: data.value };

      if (isFirstSaveRef.current) {
        isFirstSaveRef.current = false;
        saveToAPI(data);
        return;
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => saveToAPI(data), 400);
    },
    [saveToAPI]
  );

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  const handleComplete = useCallback(
    async (answers: Record<string, unknown>) => {
      const aos = calculateAOS(answers);
      const scared = calculateSCARED(answers);
      const ritmo = calculateRitmoSono(answers);

      const calculatedScores = { aos, scared, ritmo };
      setScores(calculatedScores);
      setIsComplete(true);

      try {
        await fetch('/api/submissions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: submissionIdRef.current,
            scores: {
              lipp_score: aos.score,
              lipp_classification: aos.classification,
              bruxism_score: scared.score,
              bruxism_classification: scared.classification,
              epworth_score: ritmo.score,
              epworth_classification: ritmo.classification,
            },
          }),
        });
      } catch (error) {
        console.error('[Kids Complete error]', error);
      }
    },
    []
  );

  if (isComplete) {
    return (
      <div className="min-h-screen bg-[#07070C] bg-grid relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="relative z-10 w-full max-w-lg text-center space-y-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground">Obrigado!</h1>
            <p className="text-foreground/60 leading-relaxed">
              O questionário foi preenchido com sucesso. O dentista já tem acesso aos resultados.
            </p>
          </div>

          {scores && (
            <div className="grid gap-3">
              {Object.entries(scores).map(([key, score]) => {
                const s = score as { score: number; maxScore: number; classification: string; color: string };
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between px-5 py-4 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  >
                    <span className="text-sm text-foreground/60 capitalize">
                      {key === 'aos' ? 'Sono (AOS)' : key === 'scared' ? 'Ansiedade (SCARED)' : 'Ritmo Sono-Vigília'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium" style={{ color: s.color }}>
                        {s.classification}
                      </span>
                      <span className="text-lg font-bold" style={{ color: s.color }}>
                        {s.score}/{s.maxScore}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-foreground/30">
            Você pode fechar esta página com segurança.
          </p>
        </div>
      </div>
    );
  }

  return (
    <FormEngine
      ref={formEngineRef}
      submissionId={submissionIdRef.current}
      onAutoSave={handleAutoSave}
      onComplete={(answers) => handleComplete(answers)}
      customSections={KIDS_SECTIONS}
      customQuestionsBySection={KIDS_QUESTIONS_BY_SECTION}
      customAllQuestions={ALL_KIDS_QUESTIONS}
    />
  );
}
