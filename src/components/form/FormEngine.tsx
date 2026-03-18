'use client';

import { useState, useCallback, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { gsap } from '@/lib/animations/gsap-config';
import type { Question, FormState, PainMapData, QuestionOption } from '@/types';

export interface FormEngineHandle {
  loadSavedState: (answers: Record<string, unknown>, section: number, questionIndex: number) => void;
  updateSubmissionId: (id: string) => void;
}
import { SECTIONS, QUESTIONS_BY_SECTION, ALL_QUESTIONS } from '@/lib/questions';
import { calculateLipp } from '@/lib/scoring/lipp';
import { calculateBruxismo } from '@/lib/scoring/bruxismo';
import { calculateEpworth } from '@/lib/scoring/epworth';

import ProgressBar from './ProgressBar';
import QuestionCard from './QuestionCard';
import YesNoCards from './YesNoCards';
import ScaleButtons from './ScaleButtons';
import ScaleSegmented from './ScaleSegmented';
import TextInput from './TextInput';
import SelectInput from './SelectInput';
import CheckboxGroup from './CheckboxGroup';
import PainMap from './PainMap';
import BMICalculator from './BMICalculator';
import ScoreResult from './ScoreResult';
import SectionTransition from './SectionTransition';
import NavigationButtons from './NavigationButtons';

interface FormEngineProps {
  submissionId: string;
  initialAnswers?: Record<string, unknown>;
  initialSection?: number;
  initialQuestionIndex?: number;
  onAutoSave?: (data: {
    questionId: string;
    section: string;
    field: string;
    value: unknown;
    currentSection: number;
    currentQuestionIndex: number;
    answeredQuestions: number;
  }) => void;
  onCPFLookup?: (cpf: string) => Promise<void>;
  lockedFields?: string[];
  // Custom question sets (for Kids mode)
  customSections?: typeof SECTIONS;
  customQuestionsBySection?: typeof QUESTIONS_BY_SECTION;
  customAllQuestions?: typeof ALL_QUESTIONS;
  onComplete?: (answers: Record<string, unknown>, scores: {
    lipp: ReturnType<typeof calculateLipp>;
    bruxismo: ReturnType<typeof calculateBruxismo>;
    epworth: ReturnType<typeof calculateEpworth>;
  }) => void;
}

const FormEngine = forwardRef<FormEngineHandle, FormEngineProps>(function FormEngine({
  submissionId,
  initialAnswers = {},
  initialSection = 1,
  initialQuestionIndex = 0,
  onAutoSave,
  onComplete,
  onCPFLookup,
  lockedFields,
  customSections,
  customQuestionsBySection,
  customAllQuestions,
}, ref) {
  // Use custom question sets if provided (Kids mode), otherwise defaults
  const activeSections = customSections || SECTIONS;
  const activeQuestionsBySection = customQuestionsBySection || QUESTIONS_BY_SECTION;
  const activeAllQuestions = customAllQuestions || ALL_QUESTIONS;
  const [state, setState] = useState<FormState>({
    submissionId,
    currentSection: initialSection,
    currentQuestionIndex: initialQuestionIndex,
    answers: { ...initialAnswers },
    totalQuestions: activeAllQuestions.length,
    answeredQuestions: Object.keys(initialAnswers).length,
    isTransitioning: false,
    direction: 'forward',
  });

  // Expose methods for external state updates (resume flow)
  useImperativeHandle(ref, () => ({
    loadSavedState: (answers: Record<string, unknown>, section: number, questionIndex: number) => {
      setState((prev) => ({
        ...prev,
        answers: { ...prev.answers, ...answers },
        currentSection: section,
        currentQuestionIndex: questionIndex,
        answeredQuestions: Object.keys(answers).length,
      }));
    },
    updateSubmissionId: (id: string) => {
      setState((prev) => ({ ...prev, submissionId: id }));
    },
  }));

  const [showSectionTransition, setShowSectionTransition] = useState(false);
  const [showScoreResult, setShowScoreResult] = useState(false);
  const [pendingSection, setPendingSection] = useState<number | null>(null);
  const questionContainerRef = useRef<HTMLDivElement>(null);

  // Get questions for current section, filtering by conditionals
  const currentSectionQuestions = useMemo(() => {
    const questions = activeQuestionsBySection[state.currentSection] || [];
    return questions.filter((q) => {
      if (!q.conditionalOn) return true;
      const depValue = state.answers[q.conditionalOn.questionId];
      return depValue === q.conditionalOn.value;
    });
  }, [state.currentSection, state.answers]);

  // Current question
  const currentQuestion = currentSectionQuestions[state.currentQuestionIndex] || null;

  // Count answered questions globally
  const answeredCount = useMemo(() => {
    return activeAllQuestions.filter((q) => {
      // Skip conditionals that don't apply
      if (q.conditionalOn) {
        const depValue = state.answers[q.conditionalOn.questionId];
        if (depValue !== q.conditionalOn.value) return false;
      }
      return state.answers[q.id] !== undefined && state.answers[q.id] !== '' && state.answers[q.id] !== null;
    }).length;
  }, [state.answers]);

  // Total visible questions (excluding hidden conditionals)
  const totalVisible = useMemo(() => {
    return activeAllQuestions.filter((q) => {
      if (!q.conditionalOn) return true;
      const depValue = state.answers[q.conditionalOn.questionId];
      return depValue === q.conditionalOn.value;
    }).length;
  }, [state.answers]);

  // Check if current question has a value
  const hasCurrentValue = useMemo(() => {
    if (!currentQuestion) return false;
    const val = state.answers[currentQuestion.id];
    if (val === undefined || val === null || val === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  }, [currentQuestion, state.answers]);

  // Handle answer change
  const handleAnswer = useCallback(
    (questionId: string, value: unknown) => {
      setState((prev) => {
        const newAnswers = { ...prev.answers, [questionId]: value };
        return { ...prev, answers: newAnswers };
      });

      // Auto-save
      if (onAutoSave && currentQuestion) {
        const dbField = currentQuestion.dbField;
        const dotIdx = dbField.indexOf('.');
        const section = dotIdx > -1 ? dbField.substring(0, dotIdx) : dbField;

        onAutoSave({
          questionId,
          section,
          field: dbField,
          value,
          currentSection: state.currentSection,
          currentQuestionIndex: state.currentQuestionIndex,
          answeredQuestions: answeredCount + (hasCurrentValue ? 0 : 1),
        });
      }
    },
    [onAutoSave, currentQuestion, state.currentSection, state.currentQuestionIndex, answeredCount, hasCurrentValue]
  );

  // Handle yes_no_conditional: after answering "yes", show follow-up inline
  const [showFollowUp, setShowFollowUp] = useState(false);

  useEffect(() => {
    if (
      currentQuestion?.type === 'yes_no_conditional' &&
      state.answers[currentQuestion.id] === true &&
      currentQuestion.followUp
    ) {
      setShowFollowUp(true);
    } else {
      setShowFollowUp(false);
    }
  }, [currentQuestion, state.answers]);

  // Animate transition between questions
  const animateTransition = useCallback(
    (direction: 'forward' | 'backward', callback: () => void) => {
      if (!questionContainerRef.current) {
        callback();
        return;
      }

      setState((prev) => ({ ...prev, isTransitioning: true }));

      const exitX = direction === 'forward' ? -80 : 80;

      gsap.to(questionContainerRef.current, {
        x: exitX,
        opacity: 0,
        duration: 0.4,
        ease: 'dp4Slide',
        onComplete: () => {
          callback();
          // Reset position before entry
          if (questionContainerRef.current) {
            gsap.set(questionContainerRef.current, {
              x: direction === 'forward' ? 80 : -80,
              opacity: 0,
            });
            gsap.to(questionContainerRef.current, {
              x: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'dp4Luxe',
              onComplete: () => {
                setState((prev) => ({ ...prev, isTransitioning: false }));
              },
            });
          }
        },
      });
    },
    []
  );

  // Navigate to next question
  const goNext = useCallback(() => {
    if (state.isTransitioning) return;

    // If showing follow-up, check if it's answered before proceeding
    if (showFollowUp && currentQuestion?.followUp) {
      const followUpVal = state.answers[currentQuestion.followUp.id];
      if (currentQuestion.followUp.required && (!followUpVal || followUpVal === '')) {
        return;
      }
    }

    // CPF lookup trigger: when leaving CPF question, check for existing submissions
    if (currentQuestion?.id === 'cpf' && onCPFLookup && state.answers.cpf) {
      onCPFLookup(state.answers.cpf as string);
    }

    const nextIndex = state.currentQuestionIndex + 1;

    if (nextIndex < currentSectionQuestions.length) {
      // Next question in same section
      animateTransition('forward', () => {
        setState((prev) => ({
          ...prev,
          currentQuestionIndex: nextIndex,
          direction: 'forward',
        }));
      });
    } else {
      // Section complete
      const sectionMeta = activeSections.find((s) => s.section === state.currentSection);

      if (sectionMeta?.scorable) {
        // Show score result before transitioning
        setShowScoreResult(true);
      } else {
        // Go to next section
        goToNextSection();
      }
    }
  }, [state, currentSectionQuestions, showFollowUp, currentQuestion, animateTransition]);

  const goToNextSection = useCallback(() => {
    const nextSection = state.currentSection + 1;

    if (nextSection > 5) {
      // Form complete! Extract numeric answers for scoring
      const numericAnswers: Record<string, number> = {};
      for (const [key, val] of Object.entries(state.answers)) {
        if (typeof val === 'number') numericAnswers[key] = val;
      }
      const lipp = calculateLipp(numericAnswers);
      const bruxismo = calculateBruxismo(numericAnswers);
      const epworth = calculateEpworth(numericAnswers);
      onComplete?.(state.answers, { lipp, bruxismo, epworth });
      return;
    }

    setPendingSection(nextSection);
    setShowSectionTransition(true);
  }, [state, onComplete]);

  // Navigate to previous question
  const goPrev = useCallback(() => {
    if (state.isTransitioning) return;

    if (state.currentQuestionIndex > 0) {
      animateTransition('backward', () => {
        setState((prev) => ({
          ...prev,
          currentQuestionIndex: prev.currentQuestionIndex - 1,
          direction: 'backward',
        }));
      });
    } else if (state.currentSection > 1) {
      // Go to previous section's last question
      const prevSection = state.currentSection - 1;
      const prevQuestions = activeQuestionsBySection[prevSection] || [];
      const filteredPrev = prevQuestions.filter((q) => {
        if (!q.conditionalOn) return true;
        const depValue = state.answers[q.conditionalOn.questionId];
        return depValue === q.conditionalOn.value;
      });

      animateTransition('backward', () => {
        setState((prev) => ({
          ...prev,
          currentSection: prevSection,
          currentQuestionIndex: filteredPrev.length - 1,
          direction: 'backward',
        }));
      });
    }
  }, [state, animateTransition]);

  // Section transition complete
  const handleSectionTransitionComplete = useCallback(() => {
    setShowSectionTransition(false);
    if (pendingSection !== null) {
      setState((prev) => ({
        ...prev,
        currentSection: pendingSection,
        currentQuestionIndex: 0,
        direction: 'forward',
      }));
      setPendingSection(null);
    }
  }, [pendingSection]);

  // Score result dismissed
  const handleScoreDismiss = useCallback(() => {
    setShowScoreResult(false);
    goToNextSection();
  }, [goToNextSection]);

  // Get current score result if showing
  const currentScoreResult = useMemo(() => {
    if (!showScoreResult) return null;

    const sectionMeta = activeSections.find((s) => s.section === state.currentSection);
    if (!sectionMeta?.scorable) return null;

    const numericAnswers: Record<string, number> = {};
    for (const [key, val] of Object.entries(state.answers)) {
      if (typeof val === 'number') numericAnswers[key] = val;
    }

    switch (sectionMeta.scoreType) {
      case 'lipp':
        return { title: 'Estresse Lipp', result: calculateLipp(numericAnswers) };
      case 'bruxismo':
        return { title: 'Grau de Bruxismo', result: calculateBruxismo(numericAnswers) };
      case 'epworth':
        return { title: 'Teste Epworth', result: calculateEpworth(numericAnswers) };
      default:
        return null;
    }
  }, [showScoreResult, state.currentSection, state.answers]);

  // Render the appropriate input for the current question type
  const renderInput = (question: Question) => {
    const val = state.answers[question.id];

    // Locked fields (control form): show value as read-only
    if (lockedFields?.includes(question.id)) {
      return (
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-amber-500/20 text-foreground/80 text-base">
          {String(val || '—')}
          <p className="text-xs text-amber-400/60 mt-1">Este campo não pode ser alterado no controle</p>
        </div>
      );
    }

    switch (question.type) {
      case 'yes_no':
        return (
          <YesNoCards
            value={val as boolean | null ?? null}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'yes_no_conditional':
        return (
          <div className="space-y-4">
            <YesNoCards
              value={val as boolean | null ?? null}
              onChange={(v) => handleAnswer(question.id, v)}
            />
            {showFollowUp && question.followUp && (
              <div className="mt-4 pl-4 border-l-2 border-amber-500/20">
                <p className="text-sm text-foreground/80 mb-3">{question.followUp.label}</p>
                <TextInput
                  type={question.followUp.type as 'text' | 'textarea'}
                  value={(state.answers[question.followUp.id] as string) || ''}
                  onChange={(v) => handleAnswer(question.followUp!.id, v)}
                  placeholder={question.followUp.placeholder}
                  required={question.followUp.required}
                />
              </div>
            )}
          </div>
        );

      case 'scale_0_1':
      case 'scale_0_2':
      case 'scale_0_3':
        return (
          <ScaleButtons
            options={question.options || []}
            value={val as string | number | null ?? null}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'scale_0_10':
        return (
          <ScaleSegmented
            min={question.min ?? 0}
            max={question.max ?? 10}
            value={val as number | null ?? null}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'select':
        return (
          <SelectInput
            options={question.options || []}
            value={val as string | number | null ?? null}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'checkbox_group':
        return (
          <CheckboxGroup
            options={question.options || []}
            value={(val as (string | number)[]) || []}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'pain_map':
        return (
          <PainMap
            value={(val as PainMapData) || {
              trapezio_right: 0, trapezio_left: 0,
              masseter_right: 0, masseter_left: 0,
              temporal_right: 0, temporal_left: 0,
              frontal: 0, cervical: 0,
            }}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'bmi_calculator':
        return (
          <BMICalculator
            value={(val as { peso: string; altura: string; imc: number | null; classificacao: string }) || {
              peso: '', altura: '', imc: null, classificacao: '',
            }}
            onChange={(v) => handleAnswer(question.id, v)}
          />
        );

      case 'text':
      case 'textarea':
      case 'email':
      case 'phone':
      case 'cpf':
      case 'date':
      case 'number':
        return (
          <TextInput
            type={question.type as 'text' | 'textarea' | 'email' | 'phone' | 'cpf' | 'date' | 'number'}
            value={(val as string) || ''}
            onChange={(v) => handleAnswer(question.id, v)}
            placeholder={question.placeholder}
            required={question.required}
            min={question.min}
            max={question.max}
            onSubmit={goNext}
          />
        );

      default:
        return (
          <TextInput
            value={(val as string) || ''}
            onChange={(v) => handleAnswer(question.id, v)}
            placeholder={question.placeholder}
            onSubmit={goNext}
          />
        );
    }
  };

  // Section transition overlay
  if (showSectionTransition && pendingSection !== null) {
    const meta = activeSections.find((s) => s.section === pendingSection);
    if (meta) {
      return (
        <SectionTransition
          title={meta.title}
          description={meta.description}
          sectionNumber={meta.section}
          totalSections={activeSections.length}
          icon={meta.icon}
          onComplete={handleSectionTransitionComplete}
        />
      );
    }
  }

  // Score result overlay
  if (showScoreResult && currentScoreResult) {
    return (
      <div className="min-h-screen bg-[#07070C] flex items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-6">
          <ScoreResult
            title={currentScoreResult.title}
            result={currentScoreResult.result}
          />
          <button
            type="button"
            onClick={handleScoreDismiss}
            className="
              w-full py-4 rounded-xl
              bg-amber-500/15 text-amber-400 border border-amber-500/25
              text-sm font-semibold
              hover:bg-amber-500/25 transition-colors duration-300
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
            "
          >
            Continuar →
          </button>
        </div>
      </div>
    );
  }

  // No question available (shouldn't happen normally)
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07070C] bg-grid relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Progress bar */}
      <ProgressBar
        currentSection={state.currentSection}
        totalSections={activeSections.length}
        answeredQuestions={answeredCount}
        totalQuestions={totalVisible}
      />

      {/* Main content area */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-20">
        <div ref={questionContainerRef} className="w-full max-w-lg">
          <QuestionCard
            label={currentQuestion.label}
            description={currentQuestion.description}
            required={currentQuestion.required}
            subsection={currentQuestion.subsection}
            direction={state.direction}
          >
            {renderInput(currentQuestion)}
          </QuestionCard>

          {/* Navigation */}
          <div className="mt-6 relative">
            <NavigationButtons
              onNext={goNext}
              onPrev={goPrev}
              canGoNext={true}
              canGoPrev={state.currentSection > 1 || state.currentQuestionIndex > 0}
              isLastQuestion={
                state.currentSection === 5 &&
                state.currentQuestionIndex === currentSectionQuestions.length - 1
              }
              isRequired={currentQuestion.required}
              hasValue={hasCurrentValue}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default FormEngine;
