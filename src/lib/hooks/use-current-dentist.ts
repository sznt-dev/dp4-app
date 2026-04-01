'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface CurrentDentist {
  id: string;
  email: string;
  name: string;
  unique_slug: string | null;
  isAdmin: boolean;
}

/**
 * Hook to get the current logged-in dentist's info.
 * Admin users see all data; dentists see only their own.
 */
export function useCurrentDentist() {
  const [dentist, setDentist] = useState<CurrentDentist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      const adminEmails = ['admin@dp4.com', 'admin@admin.com', 'admin@sibx.com.br'];
      const isAdmin = user.user_metadata?.role === 'admin' || adminEmails.includes(user.email);

      const { data: dentistRow } = await supabase
        .from('dp4_dentists')
        .select('id, email, name, unique_slug')
        .eq('email', user.email)
        .single();

      setDentist({
        id: dentistRow?.id || user.id,
        email: user.email,
        name: dentistRow?.name || user.user_metadata?.name || user.email.split('@')[0],
        unique_slug: dentistRow?.unique_slug || null,
        isAdmin,
      });
      setLoading(false);
    });
  }, []);

  return { dentist, loading };
}
