'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCurrentDentist } from '@/lib/hooks/use-current-dentist';
import { Users, FileCheck, Clock, Activity, Link2, Copy, Check } from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  completedForms: number;
  pendingForms: number;
  avgBruxismScore: number;
}

interface RecentSubmission {
  id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  patient_name: string;
  bruxism_score: number | null;
  bruxism_classification: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    completedForms: 0,
    pendingForms: 0,
    avgBruxismScore: 0,
  });
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [permanentLink, setPermanentLink] = useState('');
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const { dentist: currentDentist, loading: dentistLoading } = useCurrentDentist();

  useEffect(() => {
    if (!dentistLoading) {
      if (!currentDentist) {
        router.push('/login');
        return;
      }
      loadDashboard(currentDentist);
    }
  }, [dentistLoading, currentDentist]);

  async function loadDashboard(myDentist: NonNullable<typeof currentDentist>) {
    const supabase = createClient();

    // Set permanent link from current dentist's slug
    if (myDentist.unique_slug) {
      setPermanentLink(`${window.location.origin}/d/${myDentist.unique_slug}`);
    }

    // SECURITY: dentist ALWAYS filters by their own ID. Only admin sees all.
    const dentistId = myDentist.isAdmin ? null : myDentist.id;

    let patientsQ = supabase.from('dp4_patients').select('id', { count: 'exact', head: true });
    let completedQ = supabase.from('dp4_submissions').select('id', { count: 'exact', head: true }).eq('status', 'completed');
    let pendingQ = supabase.from('dp4_submissions').select('id', { count: 'exact', head: true }).eq('status', 'in_progress');
    let scoresQ = supabase.from('dp4_submissions').select('bruxism_score').eq('status', 'completed').not('bruxism_score', 'is', null);

    if (dentistId) {
      patientsQ = patientsQ.eq('dentist_id', dentistId);
      completedQ = completedQ.eq('dentist_id', dentistId);
      pendingQ = pendingQ.eq('dentist_id', dentistId);
      scoresQ = scoresQ.eq('dentist_id', dentistId);
    }

    // Get stats
    const [patientsRes, completedRes, pendingRes, scoresRes] = await Promise.all([
      patientsQ, completedQ, pendingQ, scoresQ,
    ]);

    const scores = scoresRes.data || [];
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + (s.bruxism_score || 0), 0) / scores.length)
      : 0;

    setStats({
      totalPatients: patientsRes.count || 0,
      completedForms: completedRes.count || 0,
      pendingForms: pendingRes.count || 0,
      avgBruxismScore: avgScore,
    });

    // Get recent submissions with patient names (filtered by dentist)
    let recentQ = supabase
      .from('dp4_submissions')
      .select('id, status, created_at, completed_at, bruxism_score, bruxism_classification, patient_id')
      .order('created_at', { ascending: false })
      .limit(10);
    if (dentistId) {
      recentQ = recentQ.eq('dentist_id', dentistId);
    }
    const { data: submissions } = await recentQ;

    if (submissions) {
      const patientIds = [...new Set(submissions.map((s) => s.patient_id).filter(Boolean))];
      const { data: patients } = await supabase
        .from('dp4_patients')
        .select('id, name')
        .in('id', patientIds);

      const patientMap = new Map((patients || []).map((p) => [p.id, p.name]));

      setRecent(
        submissions.map((s) => ({
          id: s.id,
          status: s.status,
          created_at: s.created_at,
          completed_at: s.completed_at,
          patient_name: patientMap.get(s.patient_id) || t('noName'),
          bruxism_score: s.bruxism_score,
          bruxism_classification: s.bruxism_classification,
        }))
      );
    }

    setLoading(false);
  }

  const copyLink = useCallback(async () => {
    if (permanentLink) {
      await navigator.clipboard.writeText(permanentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [permanentLink]);

  const dateLocaleMap: Record<string, string> = {
    'pt-br': 'pt-BR',
    'pt-pt': 'pt-PT',
    'es': 'es',
    'en': 'en-US',
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString(dateLocaleMap[locale] || locale, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const statCards = [
    { label: t('stats.patients'), value: stats.totalPatients, icon: <Users className="w-5 h-5" />, color: 'text-blue-400' },
    { label: t('stats.completed'), value: stats.completedForms, icon: <FileCheck className="w-5 h-5" />, color: 'text-emerald-400' },
    { label: t('stats.inProgress'), value: stats.pendingForms, icon: <Clock className="w-5 h-5" />, color: 'text-amber-400' },
    { label: t('stats.avgBruxismScore'), value: stats.avgBruxismScore, icon: <Activity className="w-5 h-5" />, color: 'text-purple-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-base text-foreground/60 mt-1">{t('subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="px-4 py-5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2"
          >
            <div className={`${card.color}`}>{card.icon}</div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-sm text-foreground/60">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Permanent links */}
      {permanentLink && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Adult link */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('links.adultTitle')}</h2>
              <p className="text-sm text-foreground/60 mt-0.5">{t('links.adultDescription')}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={permanentLink}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-foreground/90 font-mono"
              />
              <button
                onClick={copyLink}
                className="px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-400 hover:bg-amber-500/25 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Kids link */}
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('links.kidsTitle')}</h2>
              <p className="text-sm text-foreground/60 mt-0.5">{t('links.kidsDescription')}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={permanentLink.replace('/d/', '/d/kids/')}
                className="flex-1 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-foreground/90 font-mono"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(permanentLink.replace('/d/', '/d/kids/'));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-3 py-2 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-400 hover:bg-purple-500/25 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">{t('recentActivity')}</h2>

        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground/80 py-8 text-center">{t('noFormsYet')}</p>
        ) : (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground/50">{t('tableHeaders.patient')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground/50">{t('tableHeaders.status')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground/50 hidden md:table-cell">{t('tableHeaders.bruxism')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-foreground/50 hidden md:table-cell">{t('tableHeaders.date')}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((sub) => (
                  <tr
                    key={sub.id}
                    onClick={() => {
                      if (sub.status === 'completed') {
                        // Navigate to patient detail when ready
                      }
                    }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-foreground/95">{sub.patient_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                          sub.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {sub.status === 'completed' ? t('statusComplete') : t('statusInProgress')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground/80 hidden md:table-cell">
                      {sub.bruxism_score !== null ? `${sub.bruxism_score}/20` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground/80 hidden md:table-cell">
                      {formatDate(sub.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
