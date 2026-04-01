# Checklist de Testes - DP4 + DEYA Integration

## Data: 2026-04-01

---

## 1. Endpoints (Automatizado)

- [x] Old DP4 form carrega (PT-BR): 200
- [x] Old DP4 form carrega (EN): 200
- [x] DEYA health: OK
- [x] DEYA standard webhook rejeita token invalido: 401
- [x] DEYA legacy webhook rejeita token invalido: 401
- [x] DEYA legacy webhook aceita payload valido: 200 + cria paciente
- [x] New DP4 (Vercel) carrega: 200
- [x] New DP4 i18n (EN, ES): 308 redirect
- [x] New DP4 API health: OK

## 2. Migracao de Dados

- [x] 303 dentistas no Supabase DP4
- [x] 7727 pacientes no Supabase DP4
- [x] 7564 submissions no Supabase DP4
- [x] 303 dentistas (users) no DEYA
- [x] 7739 pacientes no DEYA
- [x] 0 pacientes orfaos (sem dentist_id)
- [x] Todos em pipeline_stage = 'dp4_received'
- [x] Scores calculados corretamente (amostragem)
- [x] Vinculacao dentista-paciente correta (amostragem)

## 3. Agentes DEYA

- [x] 12 agentes ativos (10 pipeline + 2 extras)
- [x] 8 agentes antigos desativados
- [x] Novos slugs: dtc-diagnostico, venda-diagnostica, laudo-dtc, etc.
- [x] Interdisciplinar e Secretaria mantidos como extras

## 4. Webhooks

- [x] Old DP4 aponta para deya.sibx.global/api/webhooks/dp4-legacy
- [x] Token X-DP4-Token configurado no old DP4
- [x] Adapter transforma formato Django -> DEYA automaticamente
- [x] New DP4 webhook-deya.ts criado e integrado no complete/route.ts
- [x] New DP4 deployado no Vercel com webhook integration

## 5. Testes Manuais (Eli)

### Old DP4
- [ ] Preencher formulario completo no dp4.app
- [ ] Verificar que paciente apareceu no DEYA sob o dentista correto
- [ ] Verificar que scores foram calculados no DEYA

### New DP4
- [ ] Preencher formulario via link de dentista
- [ ] Auto-save funciona entre secoes
- [ ] Resume via CPF funciona
- [ ] Completion dispara webhook para DEYA
- [ ] Paciente aparece no DEYA

### Dashboard DP4
- [ ] Login funciona (admin@dp4.com / dp4admin123)
- [ ] Lista de pacientes mostra dados migrados
- [ ] PDF de prontuario gera corretamente
- [ ] Multi-idioma funciona no dashboard

### DEYA Dashboard
- [ ] Login funciona (admin@deya.ia / DeyaAdmin2026x)
- [ ] Lista de pacientes mostra 7739 pacientes
- [ ] Cada dentista ve apenas seus pacientes
- [ ] Pipeline visual mostra novos nomes (DTC Diagnostico, etc.)
- [ ] Clicar em paciente mostra detalhes com scores

### DEYA Pipeline (com 3 pacientes)
- [ ] DTC Diagnostico: gera hipotese com contexto DP4
- [ ] Venda Diagnostica Pro: argumentos de venda
- [ ] Laudo Inteligente DTC: laudo completo
- [ ] Venda Tratamento Pro: scripts de tratamento
- [ ] Protocolo Pre-Sono: rotinas de sono
- [ ] Suplementacao Clinica: sugestoes seguras
- [ ] Placa Personalizada DTC: selecao de placa
- [ ] Conduta Medicamentosa: protocolo farmacologico
- [ ] Venda de Controle: retorno e fidelizacao
- [ ] Ajuste de Crise de Dor: manejo emergencial
- [ ] Contexto acumulativo entre etapas funciona
- [ ] Interdisciplinar acessivel a qualquer momento
- [ ] Secretaria acessivel a qualquer momento

## 6. Seguranca (Pendente)

- [ ] SQL de security LGPD aplicado no Supabase DP4
  - Arquivo: supabase-migration-security-lgpd.sql
  - URL: https://supabase.com/dashboard/project/nrcphwbaqgjeyecancnm/sql
- [ ] RLS ativo em todas as tabelas DP4
- [ ] Realtime desabilitado para tabelas sensiveis
- [ ] Anon nao consegue listar pacientes/submissions
- [ ] Webhook sem token -> 401
- [ ] CPF nunca em URLs/logs
- [ ] CORS configurado

## 7. Env Vars Pendentes (Vercel)

No Vercel do new DP4, adicionar:
- `DEYA_WEBHOOK_URL` = `https://deya.sibx.global/api/webhooks/dp4`
- `DEYA_WEBHOOK_TOKEN` = `deya_dp4_sec_2026_xK9mPqR7`
