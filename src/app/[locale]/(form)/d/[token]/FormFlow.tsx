'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import FormEngine, { type FormEngineHandle } from '@/components/form/FormEngine';
import CPFLookupOverlay from '@/components/form/CPFLookupOverlay';
import type { CPFLookupResponse, CPFLookupStatus } from '@/types';

interface FormFlowProps {
  token: string;
  dentistId?: string;
  dentistName?: string;
  submissionId?: string;
  initialAnswers?: Record<string, unknown>;
  initialSection?: number;
  initialQuestionIndex?: number;
  isControl?: boolean;
  lockedPatient?: { id: string; name: string; cpf: string };
  parentSubmissionId?: string;
}

export default function FormFlow({
  token,
  dentistId,
  dentistName,
  submissionId: initialSubmissionId,
  initialAnswers: propInitialAnswers,
  initialSection,
  initialQuestionIndex,
  isControl = false,
  lockedPatient,
  parentSubmissionId,
}: FormFlowProps) {
  const t = useTranslations('form');

  // For control forms, pre-fill name and CPF from locked patient
  const initialAnswers = lockedPatient
    ? { nome: lockedPatient.name, cpf: lockedPatient.cpf, ...propInitialAnswers }
    : propInitialAnswers;
  const [isComplete, setIsComplete] = useState(false);
  const [scores, setScores] = useState<Record<string, unknown> | null>(null);

  // Submission tracking
  const submissionIdRef = useRef(initialSubmissionId || `dev-${token}`);
  const patientIdRef = useRef<string | null>(null);
  const answersRef = useRef<Record<string, unknown>>(initialAnswers || {});
  const formEngineRef = useRef<FormEngineHandle>(null);

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<boolean>(false);
  const isFirstSaveRef = useRef(!initialSubmissionId);

  // CPF lookup state
  const [cpfOverlay, setCpfOverlay] = useState<{
    status: Exclude<CPFLookupStatus, 'new'>;
    completedAt?: string;
    remainingDays?: number;
    savedAnswers?: Record<string, unknown>;
    savedSubmissionId?: string;
    savedSection?: number;
    savedQuestionIndex?: number;
  } | null>(null);

  // Blocked state (form cannot continue)
  const [isBlocked, setIsBlocked] = useState(false);

  // Save to API
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
        patientName: answersRef.current.nome as string | undefined,
        patientCpf: answersRef.current.cpf as string | undefined,
        dentistId,
        submissionType: isControl ? 'control' : 'first',
        patientId: lockedPatient?.id,
      };

      const res = await fetch('/api/submissions/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (result.ok) {
        if (result.created && result.submissionId) {
          submissionIdRef.current = result.submissionId;
          formEngineRef.current?.updateSubmissionId(result.submissionId);
        }
        if (result.patientId) {
          patientIdRef.current = result.patientId;
        }
      }
    } catch (error) {
      console.error('[DP4 Auto-save error]', error);
    }
  }, []);

  // Auto-save handler with debounce
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

      // First save is immediate (creates the submission)
      if (isFirstSaveRef.current) {
        isFirstSaveRef.current = false;
        saveToAPI(data);
        return;
      }

      // Debounced saves
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      pendingSaveRef.current = true;
      saveTimerRef.current = setTimeout(() => {
        pendingSaveRef.current = false;
        saveToAPI(data);
      }, 400);
    },
    [saveToAPI]
  );

  // Flush pending save on unmount / tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingSaveRef.current) {
        const payload = JSON.stringify({
          submissionId: submissionIdRef.current,
          questionId: '_flush',
          section: '_flush',
          field: '_flush',
          value: null,
          currentSection: 1,
          currentQuestionIndex: 0,
          answeredQuestions: Object.keys(answersRef.current).length,
        });
        navigator.sendBeacon('/api/submissions/save', payload);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // CPF Lookup handler — skip for control forms (patient already known)
  const handleCPFLookup = useCallback(async (cpf: string) => {
    if (isControl) return; // Control forms don't need CPF lookup
    try {
      const res = await fetch('/api/patients/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf }),
      });

      const data: CPFLookupResponse = await res.json();

      if (data.status === 'new') return;

      if (data.status === 'incomplete') {
        setCpfOverlay({
          status: 'incomplete',
          savedAnswers: data.savedAnswers,
          savedSubmissionId: data.submissionId,
          savedSection: data.progress?.current_section,
          savedQuestionIndex: data.progress?.current_question_index,
        });
      } else if (data.status === 'blocked') {
        setCpfOverlay({
          status: 'blocked',
          completedAt: data.completedAt,
          remainingDays: data.remainingDays,
        });
      } else if (data.status === 'control_eligible') {
        setCpfOverlay({
          status: 'control_eligible',
          completedAt: data.completedAt,
        });
      }
    } catch (error) {
      console.error('[CPF Lookup error]', error);
    }
  }, []);

  // CPF overlay handlers
  const handleResume = useCallback(() => {
    if (!cpfOverlay) return;

    if (cpfOverlay.savedAnswers && cpfOverlay.savedSubmissionId) {
      submissionIdRef.current = cpfOverlay.savedSubmissionId;
      answersRef.current = { ...answersRef.current, ...cpfOverlay.savedAnswers };
      isFirstSaveRef.current = false;

      formEngineRef.current?.updateSubmissionId(cpfOverlay.savedSubmissionId);
      formEngineRef.current?.loadSavedState(
        cpfOverlay.savedAnswers,
        cpfOverlay.savedSection || 1,
        cpfOverlay.savedQuestionIndex || 0
      );
    }

    setCpfOverlay(null);
  }, [cpfOverlay]);

  const handleStartFresh = useCallback(() => {
    setCpfOverlay(null);
  }, []);

  const handleOverlayClose = useCallback(() => {
    if (cpfOverlay?.status === 'blocked') {
      setIsBlocked(true);
    }
    setCpfOverlay(null);
  }, [cpfOverlay]);

  // Form completion handler
  const handleComplete = useCallback(
    async (answers: Record<string, unknown>, calculatedScores: Record<string, unknown>) => {
      setScores(calculatedScores);
      setIsComplete(true);

      try {
        const scorePayload: Record<string, unknown> = {};
        const scoresTyped = calculatedScores as Record<string, { score: number; classification: string }>;

        if (scoresTyped.lipp) {
          scorePayload.lipp_score = scoresTyped.lipp.score;
          scorePayload.lipp_classification = scoresTyped.lipp.classification;
        }
        if (scoresTyped.bruxismo) {
          scorePayload.bruxism_score = scoresTyped.bruxismo.score;
          scorePayload.bruxism_classification = scoresTyped.bruxismo.classification;
        }
        if (scoresTyped.epworth) {
          scorePayload.epworth_score = scoresTyped.epworth.score;
          scorePayload.epworth_classification = scoresTyped.epworth.classification;
        }

        await fetch('/api/submissions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: submissionIdRef.current,
            scores: scorePayload,
          }),
        });
      } catch (error) {
        console.error('[DP4 Complete error]', error);
      }
    },
    []
  );

  // Blocked screen
  if (isBlocked) {
    return (
      <div className="min-h-screen bg-[#07070C] bg-grid relative overflow-hidden flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-radial-glow pointer-events-none" />
        <div className="relative z-10 w-full max-w-lg text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('blocked.title')}</h1>
          <p className="text-muted-foreground/90 leading-relaxed">
            {t('blocked.message')}
          </p>
        </div>
      </div>
    );
  }

  // Completion screen
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
            <h1 className="text-3xl font-bold text-foreground">{t('completion.title')}</h1>
            <p className="text-muted-foreground/90 leading-relaxed">
              {t('completion.message')}
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
                    <span className="text-sm text-muted-foreground/90 capitalize">{key}</span>
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
          <p className="text-xs text-muted-foreground/80">
            {t('completion.closeHint')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <FormEngine
        ref={formEngineRef}
        submissionId={submissionIdRef.current}
        initialAnswers={initialAnswers}
        initialSection={initialSection}
        initialQuestionIndex={initialQuestionIndex}
        onAutoSave={handleAutoSave}
        onComplete={handleComplete}
        onCPFLookup={handleCPFLookup}
        lockedFields={lockedPatient ? ['nome', 'cpf'] : undefined}
      />

      {cpfOverlay && (
        <CPFLookupOverlay
          status={cpfOverlay.status}
          completedAt={cpfOverlay.completedAt}
          remainingDays={cpfOverlay.remainingDays}
          onResume={handleResume}
          onStartFresh={handleStartFresh}
          onClose={handleOverlayClose}
        />
      )}
    </>
  );
}
