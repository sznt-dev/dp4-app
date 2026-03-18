// ============================================
// DP4 APP — Type Definitions
// ============================================

// --- Question Engine Types ---

export type QuestionType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'number'
  | 'email'
  | 'phone'
  | 'cpf'
  | 'yes_no'
  | 'yes_no_conditional'
  | 'scale_0_1'
  | 'scale_0_2'
  | 'scale_0_3'
  | 'scale_0_10'
  | 'select'
  | 'pain_map'
  | 'checkbox_group'
  | 'bmi_calculator'
  | 'group'
  | 'frequency_scale'; // Nunca/Ocasionalmente/Algumas vezes/Quase sempre/Sempre

export interface QuestionOption {
  value: string | number;
  label: string;
  color?: string; // For colored scale buttons
  icon?: string;  // Lucide icon name
}

export interface Question {
  id: string;
  section: 1 | 2 | 3 | 4 | 5;
  subsection?: string;
  type: QuestionType;
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: QuestionOption[];
  conditionalOn?: {
    questionId: string;
    value: string | number | boolean;
  };
  followUp?: Question;
  group?: Question[];
  min?: number;
  max?: number;
  dbField: string; // Maps to JSONB path in dp4_submissions (e.g., 'saude_medica.diabetes')
}

export interface SectionMeta {
  section: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  scorable: boolean;
  scoreType?: 'lipp' | 'bruxismo' | 'epworth';
}

// --- Score Types ---

export interface ScoreResult {
  score: number;
  maxScore: number;
  classification: string;
  severity: 'normal' | 'low' | 'moderate' | 'high' | 'severe';
  color: string; // Hex color for display
}

// --- Pain Map Types ---

export interface PainPoint {
  id: string;
  label: string;
  shortLabel: string;
  value: number; // 0-10
}

export interface PainMapData {
  trapezio_right: number;
  trapezio_left: number;
  masseter_right: number;
  masseter_left: number;
  temporal_right: number;
  temporal_left: number;
  frontal: number;
  cervical: number;
}

// --- Database Types ---

export interface DP4Dentist {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  clinic_name?: string;
  unique_slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DP4Patient {
  id: string;
  dentist_id: string;
  name: string;
  email?: string;
  cpf?: string;
  phone?: string;
  dob?: string;
  created_at: string;
  updated_at: string;
}

export type LinkType = 'first' | 'control' | 'kids';
export type SubmissionStatus = 'in_progress' | 'completed' | 'abandoned';
export type SubmissionType = 'first' | 'control';

export interface DP4Link {
  id: string;
  dentist_id: string;
  patient_id?: string;
  token: string;
  link_type: LinkType;
  parent_submission_id?: string;
  is_used: boolean;
  expires_at?: string;
  created_at: string;
}

export interface DP4Submission {
  id: string;
  link_id?: string;
  patient_id?: string;
  dentist_id?: string;
  submission_type: SubmissionType;
  status: SubmissionStatus;

  // JSONB sections
  dados_pessoais: Record<string, unknown>;
  saude_oral: Record<string, unknown>;
  saude_medica: Record<string, unknown>;
  prontuario: Record<string, unknown>;
  neuroplasticidade: Record<string, unknown>;
  pain_map: Record<string, unknown>;
  orofacial: Record<string, unknown>;
  sleep_disorders: Record<string, unknown>;
  chronic_disorders: Record<string, unknown>;
  physical_measurements: Record<string, unknown>;
  estresse_lipp: Record<string, unknown>;
  grau_bruxismo: Record<string, unknown>;
  teste_epworth: Record<string, unknown>;

  // Flat answers map (questionId -> value) for easy resume
  answers_flat: Record<string, unknown>;

  // Calculated scores
  lipp_score?: number;
  lipp_classification?: string;
  bruxism_score?: number;
  bruxism_classification?: string;
  epworth_score?: number;
  epworth_classification?: string;

  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DP4SubmissionProgress {
  id: string;
  submission_id: string;
  current_section: number;
  current_question_index: number;
  total_questions: number;
  answered_questions: number;
  last_answer_at: string;
}

export type LogAction =
  | 'link_created'
  | 'form_started'
  | 'form_resumed'
  | 'section_completed'
  | 'form_completed'
  | 'form_abandoned'
  | 'pdf_downloaded'
  | 'webhook_sent'
  | 'error';

export interface DP4Log {
  id: string;
  dentist_id?: string;
  patient_id?: string;
  submission_id?: string;
  action: LogAction;
  details: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// --- Form Engine State ---

export interface FormState {
  submissionId: string;
  currentSection: number;
  currentQuestionIndex: number;
  answers: Record<string, unknown>; // Flat map: questionId -> value
  totalQuestions: number;
  answeredQuestions: number;
  isTransitioning: boolean;
  direction: 'forward' | 'backward';
}

// --- API Types ---

export interface AutoSavePayload {
  submissionId: string;
  questionId: string;   // e.g., 'nome', 'cpf'
  section: string;      // JSONB column e.g., 'saude_medica'
  field: string;        // Full dbField e.g., 'saude_medica.diabetes'
  value: unknown;
  currentSection: number;
  currentQuestionIndex: number;
  answeredQuestions: number;
}

// --- CPF Lookup Types ---

export type CPFLookupStatus = 'new' | 'incomplete' | 'blocked' | 'control_eligible';

export interface CPFLookupResponse {
  status: CPFLookupStatus;
  patientId?: string;
  submissionId?: string;
  progress?: DP4SubmissionProgress;
  savedAnswers?: Record<string, unknown>;
  completedAt?: string;
  remainingDays?: number;
}

export interface LinkValidationResult {
  valid: boolean;
  link?: DP4Link;
  submission?: DP4Submission;
  progress?: DP4SubmissionProgress;
  dentist?: { name: string; clinic_name?: string };
  error?: string;
}
