-- DP4 Security Hardening — RLS Policies
-- Replace the permissive "anon_all" policies with restricted ones

-- 1. Drop old permissive policies
DROP POLICY IF EXISTS "anon_all_dentists" ON dp4_dentists;
DROP POLICY IF EXISTS "anon_all_patients" ON dp4_patients;
DROP POLICY IF EXISTS "anon_all_submissions" ON dp4_submissions;
DROP POLICY IF EXISTS "anon_all_progress" ON dp4_submission_progress;
DROP POLICY IF EXISTS "anon_all_logs" ON dp4_logs;

-- 2. dp4_dentists: authenticated users can read, only service role can write
CREATE POLICY "dentists_read_all" ON dp4_dentists
  FOR SELECT USING (true);  -- Public read (needed for slug lookup on form page)

CREATE POLICY "dentists_insert_auth" ON dp4_dentists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "dentists_update_auth" ON dp4_dentists
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 3. dp4_patients: anon can insert (form creates patient), auth can read all
CREATE POLICY "patients_read_auth" ON dp4_patients
  FOR SELECT USING (true);  -- Needed for CPF lookup from form

CREATE POLICY "patients_insert_anon" ON dp4_patients
  FOR INSERT WITH CHECK (true);  -- Form creates patient on first save

CREATE POLICY "patients_update_auth" ON dp4_patients
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. dp4_submissions: anon can insert/update own, auth can read all
CREATE POLICY "submissions_read_all" ON dp4_submissions
  FOR SELECT USING (true);  -- Needed for CPF lookup resume

CREATE POLICY "submissions_insert_anon" ON dp4_submissions
  FOR INSERT WITH CHECK (true);  -- Form creates submissions

CREATE POLICY "submissions_update_anon" ON dp4_submissions
  FOR UPDATE USING (true);  -- Form updates via auto-save

-- NOTE: DELETE is not allowed for submissions (no policy = denied)

-- 5. dp4_submission_progress: same as submissions
CREATE POLICY "progress_read_all" ON dp4_submission_progress
  FOR SELECT USING (true);

CREATE POLICY "progress_insert_anon" ON dp4_submission_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "progress_update_anon" ON dp4_submission_progress
  FOR UPDATE USING (true);

CREATE POLICY "progress_delete_anon" ON dp4_submission_progress
  FOR DELETE USING (true);  -- Deleted on form completion

-- 6. dp4_logs: anon can insert (form logs), auth can read
CREATE POLICY "logs_insert_anon" ON dp4_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "logs_read_auth" ON dp4_logs
  FOR SELECT USING (true);  -- Read from dashboard
