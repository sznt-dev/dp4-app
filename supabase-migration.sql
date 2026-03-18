-- DP4 APP — Database Migration
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nrcphwbaqgjeyecancnm/sql

-- 1. Dentists
CREATE TABLE IF NOT EXISTS dp4_dentists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  clinic_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed dev dentist
INSERT INTO dp4_dentists (id, name, email, clinic_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Dr. Dev', 'dev@dp4.local', 'Clínica Dev')
ON CONFLICT (email) DO NOTHING;

-- 2. Patients
CREATE TABLE IF NOT EXISTS dp4_patients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id uuid REFERENCES dp4_dentists(id),
  name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  phone text,
  dob text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp4_patients_cpf ON dp4_patients(cpf);

-- 3. Submissions
CREATE TABLE IF NOT EXISTS dp4_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid REFERENCES dp4_patients(id),
  dentist_id uuid REFERENCES dp4_dentists(id),
  submission_type text DEFAULT 'first' CHECK (submission_type IN ('first', 'control')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),

  -- JSONB per section
  dados_pessoais jsonb DEFAULT '{}'::jsonb,
  saude_oral jsonb DEFAULT '{}'::jsonb,
  saude_medica jsonb DEFAULT '{}'::jsonb,
  prontuario jsonb DEFAULT '{}'::jsonb,
  neuroplasticidade jsonb DEFAULT '{}'::jsonb,
  pain_map jsonb DEFAULT '{}'::jsonb,
  orofacial jsonb DEFAULT '{}'::jsonb,
  sleep_disorders jsonb DEFAULT '{}'::jsonb,
  chronic_disorders jsonb DEFAULT '{}'::jsonb,
  physical_measurements jsonb DEFAULT '{}'::jsonb,
  estresse_lipp jsonb DEFAULT '{}'::jsonb,
  grau_bruxismo jsonb DEFAULT '{}'::jsonb,
  teste_epworth jsonb DEFAULT '{}'::jsonb,

  -- Flat answers map (for easy resume)
  answers_flat jsonb DEFAULT '{}'::jsonb,

  -- Calculated scores
  lipp_score integer,
  lipp_classification text,
  bruxism_score integer,
  bruxism_classification text,
  epworth_score integer,
  epworth_classification text,

  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp4_submissions_patient ON dp4_submissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_dp4_submissions_status ON dp4_submissions(status);

-- 4. Submission Progress (for resume)
CREATE TABLE IF NOT EXISTS dp4_submission_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid UNIQUE REFERENCES dp4_submissions(id) ON DELETE CASCADE,
  current_section integer DEFAULT 1,
  current_question_index integer DEFAULT 0,
  answered_questions integer DEFAULT 0,
  total_questions integer,
  last_answer_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Logs
CREATE TABLE IF NOT EXISTS dp4_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dentist_id uuid REFERENCES dp4_dentists(id),
  patient_id uuid REFERENCES dp4_patients(id),
  submission_id uuid REFERENCES dp4_submissions(id),
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp4_logs_action ON dp4_logs(action);
CREATE INDEX IF NOT EXISTS idx_dp4_logs_created ON dp4_logs(created_at DESC);

-- 6. RLS — permissive for Phase 3 (no auth yet)
ALTER TABLE dp4_dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_submission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all_dentists" ON dp4_dentists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_patients" ON dp4_patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_submissions" ON dp4_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_progress" ON dp4_submission_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_all_logs" ON dp4_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_dp4_patients_updated
  BEFORE UPDATE ON dp4_patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_dp4_submissions_updated
  BEFORE UPDATE ON dp4_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_dp4_progress_updated
  BEFORE UPDATE ON dp4_submission_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
