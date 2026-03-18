-- Add Kids JSONB columns to dp4_submissions
ALTER TABLE dp4_submissions ADD COLUMN IF NOT EXISTS dados_crianca jsonb DEFAULT '{}'::jsonb;
ALTER TABLE dp4_submissions ADD COLUMN IF NOT EXISTS sono_pediatrico jsonb DEFAULT '{}'::jsonb;
ALTER TABLE dp4_submissions ADD COLUMN IF NOT EXISTS scared jsonb DEFAULT '{}'::jsonb;
ALTER TABLE dp4_submissions ADD COLUMN IF NOT EXISTS ritmo_sono jsonb DEFAULT '{}'::jsonb;
ALTER TABLE dp4_submissions ADD COLUMN IF NOT EXISTS diario_sono jsonb DEFAULT '{}'::jsonb;

-- Add form_type column to easily distinguish adult vs kids
ALTER TABLE dp4_submissions ADD COLUMN IF NOT EXISTS form_type text DEFAULT 'adult' CHECK (form_type IN ('adult', 'kids'));
