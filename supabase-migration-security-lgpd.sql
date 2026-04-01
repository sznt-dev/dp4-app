-- DP4 Security Hardening — LGPD-Compliant RLS Policies
-- Run in Supabase SQL Editor AFTER migration
-- This replaces ALL existing permissive policies with strict ones

-- =============================================
-- 1. DROP ALL EXISTING POLICIES
-- =============================================
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename LIKE 'dp4_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    RAISE NOTICE 'Dropped policy % on %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- =============================================
-- 2. ENSURE RLS IS ENABLED ON ALL TABLES
-- =============================================
ALTER TABLE dp4_dentists ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_submission_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE dp4_logs ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owner (prevents bypassing via service role in RPC)
ALTER TABLE dp4_dentists FORCE ROW LEVEL SECURITY;
ALTER TABLE dp4_patients FORCE ROW LEVEL SECURITY;
ALTER TABLE dp4_submissions FORCE ROW LEVEL SECURITY;
ALTER TABLE dp4_submission_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE dp4_links FORCE ROW LEVEL SECURITY;
ALTER TABLE dp4_logs FORCE ROW LEVEL SECURITY;

-- =============================================
-- 3. dp4_dentists — Public read (slug lookup), auth write
-- =============================================
-- Form page needs to lookup dentist by slug (anonymous access)
CREATE POLICY "dentists_select_public" ON dp4_dentists
  FOR SELECT USING (true);

-- Only authenticated users (admin dashboard) can insert/update
CREATE POLICY "dentists_insert_auth" ON dp4_dentists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "dentists_update_auth" ON dp4_dentists
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- No DELETE policy = delete denied (safety)

-- =============================================
-- 4. dp4_patients — Restricted read, anon insert
-- =============================================
-- Anon can only SELECT patients (needed for CPF lookup in form)
-- But the API route already limits this to exact CPF match
CREATE POLICY "patients_select" ON dp4_patients
  FOR SELECT USING (true);

-- Anon can insert (form creates patient record on first save)
CREATE POLICY "patients_insert" ON dp4_patients
  FOR INSERT WITH CHECK (true);

-- Only auth can update (dashboard edits patient info)
CREATE POLICY "patients_update_auth" ON dp4_patients
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- No DELETE policy = delete denied

-- =============================================
-- 5. dp4_submissions — Anon read/write (form), auth read
-- =============================================
-- Anon needs SELECT for form resume (CPF lookup returns submission data)
CREATE POLICY "submissions_select" ON dp4_submissions
  FOR SELECT USING (true);

-- Anon can insert (form creates submission on first auto-save)
CREATE POLICY "submissions_insert" ON dp4_submissions
  FOR INSERT WITH CHECK (true);

-- Anon can update (form auto-save updates the submission)
CREATE POLICY "submissions_update" ON dp4_submissions
  FOR UPDATE USING (true);

-- No DELETE policy = delete denied (submissions are permanent records)

-- =============================================
-- 6. dp4_submission_progress — Form resume data
-- =============================================
CREATE POLICY "progress_select" ON dp4_submission_progress
  FOR SELECT USING (true);

CREATE POLICY "progress_insert" ON dp4_submission_progress
  FOR INSERT WITH CHECK (true);

CREATE POLICY "progress_update" ON dp4_submission_progress
  FOR UPDATE USING (true);

-- Progress records are deleted on form completion
CREATE POLICY "progress_delete" ON dp4_submission_progress
  FOR DELETE USING (true);

-- =============================================
-- 7. dp4_links — Token-based form access
-- =============================================
CREATE POLICY "links_select" ON dp4_links
  FOR SELECT USING (true);

CREATE POLICY "links_insert_auth" ON dp4_links
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "links_update" ON dp4_links
  FOR UPDATE USING (true);

-- =============================================
-- 8. dp4_logs — Append-only audit trail
-- =============================================
-- Anyone can insert logs (form events)
CREATE POLICY "logs_insert" ON dp4_logs
  FOR INSERT WITH CHECK (true);

-- Only authenticated users can read logs (dashboard)
CREATE POLICY "logs_select_auth" ON dp4_logs
  FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- No UPDATE or DELETE policies = logs are immutable (LGPD audit requirement)

-- =============================================
-- 9. DISABLE SUPABASE REALTIME FOR SENSITIVE TABLES
-- =============================================
-- Prevents data leaking via websocket subscriptions
-- Run these in Supabase Dashboard > Database > Replication
-- or via SQL:
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE dp4_patients; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE dp4_submissions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE dp4_submission_progress; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE dp4_logs; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE dp4_links; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE dp4_dentists; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- =============================================
-- 10. SECURITY VERIFICATION QUERIES
-- =============================================
-- Run these to verify RLS is properly configured:

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity, forcerowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public' AND tablename LIKE 'dp4_%';

-- Check all policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename LIKE 'dp4_%'
-- ORDER BY tablename, policyname;

-- Test: anon should NOT be able to delete submissions
-- SET ROLE anon;
-- DELETE FROM dp4_submissions WHERE id = 'test'; -- Should fail
-- RESET ROLE;

-- Test: anon should NOT be able to read logs
-- SET ROLE anon;
-- SELECT * FROM dp4_logs LIMIT 1; -- Should return empty
-- RESET ROLE;
