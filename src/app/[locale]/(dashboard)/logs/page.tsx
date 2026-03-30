'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  details: Record<string, unknown>;
  patient_name: string | null;
  dentist_name: string | null;
  submission_id: string | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  form_started: { label: 'Form iniciado', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  form_resumed: { label: 'Form retomado', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  form_completed: { label: 'Form completo', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  form_abandoned: { label: 'Form abandonado', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  section_completed: { label: 'Seção completa', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  link_created: { label: 'Link criado', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  pdf_downloaded: { label: 'PDF baixado', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  webhook_sent: { label: 'Webhook enviado', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  error: { label: 'Erro', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const supabase = createClient();

    const { data: logsData } = await supabase
      .from('dp4_logs')
      .select('id, action, details, patient_id, dentist_id, submission_id, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (!logsData) {
      setLoading(false);
      return;
    }

    // Get patient and dentist names
    const patientIds = [...new Set(logsData.map((l) => l.patient_id).filter(Boolean))];
    const dentistIds = [...new Set(logsData.map((l) => l.dentist_id).filter(Boolean))];

    const [patientsRes, dentistsRes] = await Promise.all([
      patientIds.length > 0
        ? supabase.from('dp4_patients').select('id, name').in('id', patientIds)
        : { data: [] },
      dentistIds.length > 0
        ? supabase.from('dp4_dentists').select('id, name').in('id', dentistIds)
        : { data: [] },
    ]);

    const patientMap = new Map((patientsRes.data || []).map((p) => [p.id, p.name]));
    const dentistMap = new Map((dentistsRes.data || []).map((d) => [d.id, d.name]));

    setLogs(
      logsData.map((l) => ({
        id: l.id,
        action: l.action,
        details: l.details || {},
        patient_name: patientMap.get(l.patient_id) || null,
        dentist_name: dentistMap.get(l.dentist_id) || null,
        submission_id: l.submission_id,
        created_at: l.created_at,
      }))
    );

    setLoading(false);
  }

  const filtered = useMemo(() => {
    let result = logs;

    if (filterAction) {
      result = result.filter((l) => l.action === filterAction);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          (l.patient_name && l.patient_name.toLowerCase().includes(q)) ||
          (l.dentist_name && l.dentist_name.toLowerCase().includes(q)) ||
          l.action.toLowerCase().includes(q) ||
          JSON.stringify(l.details).toLowerCase().includes(q)
      );
    }

    return result;
  }, [logs, search, filterAction]);

  const uniqueActions = useMemo(() => {
    return [...new Set(logs.map((l) => l.action))];
  }, [logs]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
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
          <h1 className="text-2xl font-bold text-foreground">Logs</h1>
          <p className="text-base text-foreground/60 mt-1">{logs.length} registro{logs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground/90 hover:text-foreground hover:bg-white/[0.04] transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/80" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por paciente, dentista ou detalhes..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:border-amber-500/30 transition-colors"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-foreground focus:outline-none focus:border-amber-500/30 transition-colors"
        >
          <option value="">Todas as ações</option>
          {uniqueActions.map((action) => (
            <option key={action} value={action}>
              {ACTION_LABELS[action]?.label || action}
            </option>
          ))}
        </select>
      </div>

      {/* Logs list */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground/80 py-12 text-center">
          {search || filterAction ? 'Nenhum log encontrado.' : 'Nenhum log registrado ainda.'}
        </p>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((log) => {
            const actionInfo = ACTION_LABELS[log.action] || {
              label: log.action,
              color: 'text-muted-foreground/80 bg-white/[0.03] border-white/[0.06]',
            };

            return (
              <div
                key={log.id}
                className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors"
              >
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border shrink-0 mt-0.5 ${actionInfo.color}`}
                >
                  {actionInfo.label}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {log.patient_name && (
                      <span className="text-sm text-foreground/95">{log.patient_name}</span>
                    )}
                    {log.dentist_name && (
                      <span className="text-xs text-muted-foreground/80">• {log.dentist_name}</span>
                    )}
                  </div>
                  {Object.keys(log.details).length > 0 && (
                    <p className="text-xs text-muted-foreground/80 font-mono mt-0.5 truncate">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>

                <span className="text-[11px] text-muted-foreground/80 shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
