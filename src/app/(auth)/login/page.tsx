'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { gsap } from '@/lib/animations/gsap-config';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formRef.current) return;
    const els = formRef.current.querySelectorAll('[data-animate]');
    gsap.fromTo(
      els,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'dp4Luxe' }
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('E-mail ou senha incorretos');
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070C] bg-grid relative overflow-hidden flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      <div ref={formRef} className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div data-animate className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            DP4
          </h1>
          <p className="text-sm text-muted-foreground/90 mt-1">
            Prontuário Digital de Bruxismo
          </p>
        </div>

        {/* Login card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div data-animate className="space-y-2">
            <label className="text-sm text-muted-foreground/90" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/[0.03] border border-white/[0.08]
                text-foreground placeholder:text-muted-foreground/60
                text-base
                focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20
                transition-colors duration-300
              "
            />
          </div>

          <div data-animate className="space-y-2">
            <label className="text-sm text-muted-foreground/90" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="
                w-full px-4 py-3 rounded-xl
                bg-white/[0.03] border border-white/[0.08]
                text-foreground placeholder:text-muted-foreground/60
                text-base
                focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20
                transition-colors duration-300
              "
            />
          </div>

          {error && (
            <div data-animate className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            data-animate
            type="submit"
            disabled={loading}
            className="
              w-full py-3.5 rounded-xl
              bg-amber-500/15 text-amber-400 border border-amber-500/25
              text-sm font-semibold
              hover:bg-amber-500/25 transition-colors duration-300
              focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
