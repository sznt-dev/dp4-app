-- dp4_links: Track control links tied to specific patients
CREATE TABLE IF NOT EXISTS dp4_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  token text UNIQUE NOT NULL,
  dentist_id uuid REFERENCES dp4_dentists(id),
  patient_id uuid REFERENCES dp4_patients(id),
  link_type text DEFAULT 'control' CHECK (link_type IN ('first', 'control')),
  parent_submission_id uuid REFERENCES dp4_submissions(id),
  is_used boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp4_links_token ON dp4_links(token);

-- RLS
ALTER TABLE dp4_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "links_read_all" ON dp4_links FOR SELECT USING (true);
CREATE POLICY "links_insert_auth" ON dp4_links FOR INSERT WITH CHECK (true);
CREATE POLICY "links_update_all" ON dp4_links FOR UPDATE USING (true);
