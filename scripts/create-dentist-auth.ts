/**
 * Create Supabase Auth users for all migrated dentists in new DP4.
 * Password pattern: dp4{firstName}2026
 *
 * Usage:
 *   npx tsx scripts/create-dentist-auth.ts --dry-run
 *   npx tsx scripts/create-dentist-auth.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const DRY_RUN = process.argv.includes('--dry-run');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generatePassword(name: string): string {
  const firstName = name
    .split(' ')[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z]/g, ''); // only letters
  return `dp4${firstName || 'user'}2026`;
}

async function main() {
  console.log(`\nCreating auth users for DP4 dentists`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Password pattern: dp4{firstName}2026\n`);

  // Get all dentists from dp4_dentists
  const { data: dentists, error } = await supabase
    .from('dp4_dentists')
    .select('id, name, email, is_active')
    .order('name');

  if (error) {
    console.error('Failed to fetch dentists:', error.message);
    return;
  }

  console.log(`Found ${dentists?.length} dentists\n`);

  let created = 0;
  let alreadyExists = 0;
  let errors = 0;
  const credentials: { name: string; email: string; password: string }[] = [];

  for (const dentist of dentists || []) {
    if (!dentist.email) continue;

    const password = generatePassword(dentist.name);

    if (DRY_RUN) {
      credentials.push({ name: dentist.name, email: dentist.email, password });
      created++;
      continue;
    }

    // Create auth user with the dentist's existing UUID as ID
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: dentist.email,
      password,
      email_confirm: true,
      user_metadata: { name: dentist.name, role: 'dentist' },
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        alreadyExists++;
      } else {
        errors++;
        if (errors <= 5) console.error(`  Error ${dentist.email}:`, authError.message);
      }
      continue;
    }

    // Update dp4_dentists.id to match the auth user ID
    if (authUser?.user?.id && authUser.user.id !== dentist.id) {
      // The dentist ID and auth ID are different — we need to update the dentist record
      // But this would break FK references. Instead, just log it.
      // The dentist table ID doesn't need to match auth.users.id for login to work.
    }

    credentials.push({ name: dentist.name, email: dentist.email, password });
    created++;
  }

  console.log(`\nResults: ${created} created, ${alreadyExists} already existed, ${errors} errors`);

  if (DRY_RUN) {
    console.log('\nSample credentials (first 10):');
    for (const c of credentials.slice(0, 10)) {
      console.log(`  ${c.name} | ${c.email} | ${c.password}`);
    }
  }
}

main().catch(console.error);
