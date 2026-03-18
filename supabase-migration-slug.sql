-- Add unique_slug to dp4_dentists
ALTER TABLE dp4_dentists ADD COLUMN IF NOT EXISTS unique_slug text UNIQUE;

-- Set slug for dev dentist
UPDATE dp4_dentists SET unique_slug = 'dr-dev' WHERE id = '00000000-0000-0000-0000-000000000001';

-- Create index
CREATE INDEX IF NOT EXISTS idx_dp4_dentists_slug ON dp4_dentists(unique_slug);
