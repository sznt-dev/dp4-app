'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { Search, ChevronRight } from 'lucide-react';

interface PatientRow {
  id: string;
  name: string;
  cpf: string;
  created_at: string;
  latestStatus: string | null;
  bruxismScore: number | null;
  bruxismClassification: string | null;
  submissionId: string | null;
  formType: 'adult' | 'kids';
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [activeTab, setActiveTab] = useState<'adult' | 'kids'>('adult');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const t = useTranslations('patients');

  useEffect(() => {
    loadPatients();
  }, []);

  async function loadPatients() {
    const supabase = createClient();

    const { data: patientsData } = await supabase
      .from('dp4_patients')
      .select('id, name, cpf, created_at')
      .order('created_at', { ascending: false });

    if (!patientsData) {
      setLoading(false);
      return;
    }

    // Get latest submission for each patient
    const patientIds = patientsData.map((p) => p.id);
    const { data: submissions } = await supabase
      .from('dp4_submissions')
      .select('id, patient_id, status, bruxism_score, bruxism_classification, form_type')
      .in('patient_id', patientIds)
      .order('created_at', { ascending: false });

    // Map: patientId → latest submission
    const latestSubs = new Map<string, typeof submissions extends (infer T)[] | null ? T : never>();
    for (const sub of submissions || []) {
      if (!latestSubs.has(sub.patient_id)) {
        latestSubs.set(sub.patient_id, sub);
      }
    }

    setPatients(
      patientsData.map((p) => {
        const sub = latestSubs.get(p.id);
        return {
          id: p.id,
          name: p.name,
          cpf: formatCPF(p.cpf),
          created_at: p.created_at,
          latestStatus: sub?.status ?? null,
          formType: (sub?.form_type === 'kids' ? 'kids' : 'adult') as 'adult' | 'kids',
          bruxismScore: sub?.bruxism_score ?? null,
          bruxismClassification: sub?.bruxism_classification ?? null,
          submissionId: sub?.id ?? null,
        };
      })
    );

    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = patients.filter((p) => p.formType === activeTab);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.cpf.includes(q)
      );
    }
    return result;
  }, [patients, search, activeTab]);

  const adultCount = patients.filter((p) => p.formType === 'adult').length;
  const kidsCount = patients.filter((p) => p.formType === 'kids').length;

  function formatCPF(cpf: string): string {
    const c = cpf.replace(/\D/g, '');
    if (c.length !== 11) return cpf;
    return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-base text-foreground/60 mt-1">{patients.length} {patients.length !== 1 ? t('countSuffix') : t('countSuffixSingular')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('adult')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'adult'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
              : 'text-foreground/50 hover:text-foreground hover:bg-white/[0.04]'
          }`}
        >
          {t('tabs.adults')} {adultCount > 0 && <span className="ml-1 text-xs">({adultCount})</span>}
        </button>
        <button
          onClick={() => setActiveTab('kids')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'kids'
              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
              : 'text-foreground/50 hover:text-foreground hover:bg-white/[0.04]'
          }`}
        >
          {t('tabs.kids')} {kidsCount > 0 && <span className="ml-1 text-xs">({kidsCount})</span>}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="
            w-full pl-10 pr-4 py-2.5 rounded-xl
            bg-white/[0.03] border border-white/[0.06]
            text-sm text-foreground placeholder:text-muted-foreground/80
            focus:outline-none focus:border-amber-500/30
            transition-colors duration-200
          "
        />
      </div>

      {/* Patient list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground/80 py-12 text-center">
          {search ? t('noResults') : t('noPatients')}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((patient) => (
            <button
              key={patient.id}
              onClick={() => router.push(`/patients/${patient.id}`)}
              className="
                w-full flex items-center justify-between px-4 py-4 rounded-xl
                bg-white/[0.02] border border-white/[0.06]
                hover:bg-white/[0.04] hover:border-white/[0.1]
                transition-colors duration-200 text-left group
              "
            >
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-foreground truncate">{patient.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-foreground/60 font-mono">{patient.cpf}</span>
                  <span className="text-sm text-foreground/50">{formatDate(patient.created_at)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                {patient.latestStatus && (
                  <span
                    className={`hidden md:inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                      patient.latestStatus === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {patient.latestStatus === 'completed' ? t('statusComplete') : t('statusInProgress')}
                  </span>
                )}

                {patient.bruxismScore !== null && (
                  <span className="text-xs text-muted-foreground/90 hidden md:block">
                    {t('bruxLabel')}: {patient.bruxismScore}/20
                  </span>
                )}

                <ChevronRight className="w-4 h-4 text-muted-foreground/20 group-hover:text-muted-foreground/80 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
