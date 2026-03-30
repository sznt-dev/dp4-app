'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, X, Check, UserX, UserCheck, Trash2, Copy, Eye, EyeOff } from 'lucide-react';

interface Dentist {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  clinic_name: string | null;
  unique_slug: string | null;
  is_active: boolean;
  created_at: string;
  patient_count: number;
}

export default function DentistsPage() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', clinic_name: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDentists();
  }, []);

  async function loadDentists() {
    const res = await fetch('/api/dentists');
    const data = await res.json();
    if (Array.isArray(data)) {
      setDentists(data);
    }
    setLoading(false);
  }

  const handleCreate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    const res = await fetch('/api/dentists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json();
      setFormError(err.error || 'Erro ao criar');
      setSaving(false);
      return;
    }

    const result = await res.json();
    if (result.defaultPassword) {
      setCreatedCredentials({ email: formData.email, password: result.defaultPassword });
    }
    setFormData({ name: '', email: '', phone: '', clinic_name: '' });
    setShowForm(false);
    setSaving(false);
    loadDentists();
  }, [formData]);

  const toggleActive = useCallback(async (id: string, currentActive: boolean) => {
    const res = await fetch('/api/dentists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_active: !currentActive }),
    });

    if (res.ok) {
      setDentists((prev) =>
        prev.map((d) => (d.id === id ? { ...d, is_active: !currentActive } : d))
      );
    }
  }, []);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o dentista "${name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }
    setDeleting(id);
    const res = await fetch(`/api/dentists?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDentists((prev) => prev.filter((d) => d.id !== id));
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao excluir');
    }
    setDeleting(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dentistas</h1>
          <p className="text-base text-foreground/60 mt-1">
            {dentists.length} dentista{dentists.length !== 1 ? 's' : ''} cadastrado{dentists.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-medium hover:bg-amber-500/25 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancelar' : 'Novo Dentista'}
        </button>
      </div>

      {/* Created credentials modal */}
      {createdCredentials && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 p-5 space-y-3">
          <h3 className="text-base font-semibold text-emerald-400">Dentista criado com sucesso!</h3>
          <p className="text-sm text-foreground/70">Envie estas credenciais para o dentista acessar o painel:</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2.5">
              <span className="text-xs text-foreground/50 w-14">Email:</span>
              <span className="text-sm text-foreground font-mono flex-1">{createdCredentials.email}</span>
              <button
                onClick={() => navigator.clipboard.writeText(createdCredentials.email)}
                className="p-1 text-foreground/40 hover:text-foreground/70 transition-colors"
                title="Copiar"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2.5">
              <span className="text-xs text-foreground/50 w-14">Senha:</span>
              <span className="text-sm text-foreground font-mono flex-1">
                {showPassword ? createdCredentials.password : '••••••••••'}
              </span>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-foreground/40 hover:text-foreground/70 transition-colors"
                title={showPassword ? 'Ocultar' : 'Mostrar'}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(createdCredentials.password)}
                className="p-1 text-foreground/40 hover:text-foreground/70 transition-colors"
                title="Copiar"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <button
            onClick={() => { setCreatedCredentials(null); setShowPassword(false); }}
            className="text-xs text-foreground/50 hover:text-foreground/70 transition-colors mt-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/90">Nome *</label>
              <input
                required
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="Dr. João Silva"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/90">Email *</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="joao@clinica.com"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/90">Telefone</label>
              <input
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground/90">Clínica</label>
              <input
                value={formData.clinic_name}
                onChange={(e) => setFormData((p) => ({ ...p, clinic_name: e.target.value }))}
                placeholder="Clínica Odontológica"
                className="w-full px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:border-amber-500/30 transition-colors"
              />
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/25 text-sm font-medium hover:bg-amber-500/25 transition-colors disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Criar Dentista'}
          </button>
        </form>
      )}

      {/* Dentists list */}
      {dentists.length === 0 ? (
        <p className="text-sm text-muted-foreground/80 py-12 text-center">Nenhum dentista cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {dentists.map((dentist) => (
            <div
              key={dentist.id}
              className={`
                flex items-center justify-between px-4 py-4 rounded-xl
                bg-white/[0.02] border border-white/[0.06]
                ${!dentist.is_active ? 'opacity-50' : ''}
              `}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-base font-medium text-foreground truncate">{dentist.name}</p>
                  {!dentist.is_active && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      Inativo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-foreground/60">{dentist.email}</span>
                  {dentist.clinic_name && (
                    <span className="text-sm text-foreground/50">• {dentist.clinic_name}</span>
                  )}
                  {dentist.unique_slug && (
                    <span className="text-sm text-amber-400/60 font-mono">• /d/{dentist.unique_slug}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 ml-4">
                <span className="text-xs text-muted-foreground/80">
                  {dentist.patient_count} paciente{dentist.patient_count !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => toggleActive(dentist.id, dentist.is_active)}
                  className={`p-2 rounded-lg transition-colors ${
                    dentist.is_active
                      ? 'text-muted-foreground/80 hover:text-red-400 hover:bg-red-500/5'
                      : 'text-muted-foreground/80 hover:text-emerald-400 hover:bg-emerald-500/5'
                  }`}
                  title={dentist.is_active ? 'Desativar' : 'Ativar'}
                >
                  {dentist.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
                {dentist.id !== '00000000-0000-0000-0000-000000000001' && (
                  <button
                    onClick={() => handleDelete(dentist.id, dentist.name)}
                    disabled={deleting === dentist.id}
                    className="p-2 rounded-lg text-muted-foreground/80 hover:text-red-400 hover:bg-red-500/5 transition-colors disabled:opacity-50"
                    title="Excluir dentista"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
