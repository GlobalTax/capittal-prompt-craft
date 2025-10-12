# Valuation System Replication Prompt

A practical, copy-paste guide to replicate a company valuation system using Supabase, React, TypeScript, and shadcn/ui. It includes database SQL (with RLS policies), TypeScript types, data hooks and repositories, component structure, PDF generation, routes, and an implementation checklist.

---

## Tabla de Contenidos
- 1. Estructura de Base de Datos (SQL + RLS)
- 2. Tipos TypeScript de Datos
- 3. Data Layer: Repository y Hooks
- 4. Componentes Clave y Flujo UI
- 5. Generación de PDFs (@react-pdf/renderer)
- 6. Rutas (React Router)
- 7. Checklist de Implementación
- 8. Validaciones y Troubleshooting

---

## 1) Estructura de Base de Datos (SQL + RLS)

Notas importantes
- Habilitar RLS en todas las tablas con datos de usuarios.
- Evitar recursión en RLS: no consultar la propia tabla en una policy.
- Asegurar que el user_id se establece en las inserciones desde el cliente autenticado.

Trigger genérico para updated_at
```sql
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;
```

Tabla: valuations
```sql
create table if not exists public.valuations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Nueva valoración',
  status text not null default 'draft', -- draft | completed
  valuation_type text not null default 'multiples', -- multiples | dcf | mixed

  -- Cliente y compañía
  client_name text,
  client_email text,
  company_name text,
  sector_code text,
  sector_name text,

  -- Datos financieros base (ejemplo simplificado)
  year_1 jsonb default '{}'::jsonb, -- { revenue, ebitda, net_income, ... }
  year_2 jsonb default '{}'::jsonb,

  -- Configuración y resultados
  pl_rows jsonb default '[]'::jsonb, -- filas P&L para tabla dinámica
  config jsonb default '{}'::jsonb,   -- configuración de métodos, ajustes, escenarios
  dcf_results jsonb default '{}'::jsonb,
  comparable_multiples_results jsonb default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.valuations enable row level security;

create policy "Users can view their valuations"
  on public.valuations
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their valuations"
  on public.valuations
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their valuations"
  on public.valuations
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their valuations"
  on public.valuations
  for delete
  using (auth.uid() = user_id);

create trigger trg_valuations_updated
  before update on public.valuations
  for each row execute function public.update_updated_at_column();
```

Tabla: sector_multiples
```sql
create table if not exists public.sector_multiples (
  id uuid primary key default gen_random_uuid(),
  sector_code text not null,
  sector_name text not null,
  revenue_multiple_min numeric not null default 0,
  revenue_multiple_avg numeric not null default 0,
  revenue_multiple_max numeric not null default 0,
  ebitda_multiple_min numeric not null default 0,
  ebitda_multiple_avg numeric not null default 0,
  ebitda_multiple_max numeric not null default 0,
  pe_ratio_min numeric not null default 0,
  pe_ratio_avg numeric not null default 0,
  pe_ratio_max numeric not null default 0
);

alter table public.sector_multiples enable row level security;

-- Lectura pública autenticada (ajustar según necesidad)
create policy "Anyone authenticated can read sector multiples"
  on public.sector_multiples
  for select
  to authenticated
  using (true);

-- Insert/Update/Delete: restringir a admins si tu proyecto los usa
-- (Requiere función has_role y tabla user_roles)
-- create policy "Admins manage sector multiples"
--   on public.sector_multiples for all to authenticated
--   using (public.has_role(auth.uid(), 'admin'))
--   with check (public.has_role(auth.uid(), 'admin'));

-- Datos de ejemplo
insert into public.sector_multiples (sector_code, sector_name,
  revenue_multiple_min, revenue_multiple_avg, revenue_multiple_max,
  ebitda_multiple_min, ebitda_multiple_avg, ebitda_multiple_max,
  pe_ratio_min, pe_ratio_avg, pe_ratio_max)
values
  ('SaaS', 'Software as a Service', 3.0, 5.5, 10.0, 8.0, 12.0, 20.0, 15.0, 25.0, 45.0)
  on conflict do nothing;
```

Tabla recomendada: advisor_profiles (branding PDF)
- Ya suele existir en proyectos de ejemplo; si no, crearla siguiendo patrón con RLS por user_id.

---

## 2) Tipos TypeScript de Datos

```ts
export type ValuationStatus = 'draft' | 'completed';
export type ValuationType = 'multiples' | 'dcf' | 'mixed';

export interface PLRow {
  id: string;
  label: string;
  type: 'input' | 'calculated' | 'percentage';
  category: 'revenue' | 'cogs' | 'opex' | 'other';
  indent?: number;
  values: Record<string, number>; // { 'Y1': 1000, 'Y2': 1200 }
  formula?: string; // opcional para calculadas
}

export interface ValuationConfig {
  currency?: string;
  method?: ValuationType; // método seleccionado
  adjustments?: { qualityScore?: number; discount?: number; premium?: number };
  scenarios?: Array<{ name: string; revenueMultiple?: number; ebitdaMultiple?: number }>;
}

export interface Valuation {
  id: string;
  user_id: string;
  title: string;
  status: ValuationStatus;
  valuation_type: ValuationType;
  client_name?: string;
  client_email?: string;
  company_name?: string;
  sector_code?: string;
  sector_name?: string;
  year_1?: { revenue?: number; ebitda?: number; net_income?: number; [k: string]: number | undefined };
  year_2?: { revenue?: number; ebitda?: number; net_income?: number; [k: string]: number | undefined };
  pl_rows?: PLRow[];
  config?: ValuationConfig;
  dcf_results?: Record<string, any>;
  comparable_multiples_results?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SectorMultiples {
  id: string;
  sector_code: string;
  sector_name: string;
  revenue_multiple_min: number;
  revenue_multiple_avg: number;
  revenue_multiple_max: number;
  ebitda_multiple_min: number;
  ebitda_multiple_avg: number;
  ebitda_multiple_max: number;
  pe_ratio_min: number;
  pe_ratio_avg: number;
  pe_ratio_max: number;
}
```

---

## 3) Data Layer: Repository y Hooks

Repositorio (CRUD) – ejemplo general
```ts
import { supabase } from '@/integrations/supabase/client';
import type { Valuation } from '@/hooks/useValuations';

export class ValuationRepository {
  async findAll(userId: string): Promise<Valuation[]> {
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Valuation[];
  }

  async findById(id: string): Promise<Valuation | null> {
    const { data, error } = await supabase
      .from('valuations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data as Valuation | null;
  }

  async create(valuation: Partial<Valuation>): Promise<Valuation> {
    const { data, error } = await supabase
      .from('valuations')
      .insert([valuation as any])
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Valuation;
  }

  async update(id: string, updates: Partial<Valuation>): Promise<void> {
    const { error } = await supabase
      .from('valuations')
      .update(updates)
      .eq('id', id);
    if (error) throw new Error(error.message);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('valuations')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  }
}

export const valuationRepository = new ValuationRepository();
```

Hook useValuations (interfaz sugerida)
```ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { valuationRepository } from '@/repositories/ValuationRepository';
import type { Valuation } from '@/hooks/useValuations';

export function useValuations() {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id;
      if (!uid) { setLoading(false); return; }
      try {
        const list = await valuationRepository.findAll(uid);
        setValuations(list);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const createValuation = useCallback(async (payload: Partial<Valuation>) => {
    const { data: user } = await supabase.auth.getUser();
    const uid = user.user?.id;
    if (!uid) throw new Error('Not authenticated');
    const v = await valuationRepository.create({ ...payload, user_id: uid });
    setValuations(prev => [v, ...prev]);
    return v;
  }, []);

  const updateValuation = useCallback(async (id: string, updates: Partial<Valuation>) => {
    await valuationRepository.update(id, updates);
    setValuations(prev => prev.map(v => v.id === id ? { ...v, ...updates } as Valuation : v));
  }, []);

  const deleteValuation = useCallback(async (id: string) => {
    await valuationRepository.delete(id);
    setValuations(prev => prev.filter(v => v.id !== id));
  }, []);

  return { valuations, loading, createValuation, updateValuation, deleteValuation };
}
```

Hook useSectorMultiples (interfaz sugerida)
```ts
import { useEffect, useState } from 'react';
import { sectorDataRepository } from '@/repositories/SectorDataRepository';
import type { SectorMultiples } from '@/repositories/SectorDataRepository';

export function useSectorMultiples() {
  const [data, setData] = useState<SectorMultiples[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await sectorDataRepository.findAll();
        setData(res);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return { data, loading, error };
}
```

---

## 4) Componentes Clave y Flujo UI

Resumen de componentes (alineado con una arquitectura típica):
- ValuationList: grid con tarjetas, filtros y botón “Nueva valoración”.
- ValuationEditor: editor principal, con header (título, indicador de auto-guardado, generar PDF, borrar), y secciones/tabs.
- ValuationCalculator: integra P&L dinámico (DynamicPLTable), métricas y métodos de valoración (múltiplos de ingresos/EBITDA, ajustes, escenarios).
- DCFCalculator: módulo para flujos de caja, descuento, valor terminal y sensibilidad.
- ComparableMultiples: selector de sector y aplicación de múltiplos min/avg/max (ingresos/EBITDA y P/E).
- Auxiliares: ValuationTypeSelector, ClientInfoForm, AutoSaveIndicator, StatusBadge, ValuationCard.

Pseudocódigo: ValuationCalculator (resumen)
```tsx
import { useMemo } from 'react';
import type { PLRow, ValuationConfig } from '@/types';

interface Props {
  rows: PLRow[];
  config?: ValuationConfig;
  onChangeConfig?: (cfg: ValuationConfig) => void;
  onChangeRows?: (rows: PLRow[]) => void;
}

export function ValuationCalculator({ rows, config, onChangeConfig, onChangeRows }: Props) {
  // Cálculos base: EBITDA, margen, etc.
  const totals = useMemo(() => {
    // Implementar suma de filas por categoría, etc.
    return { revenueY1: 0, ebitdaY1: 0 };
  }, [rows]);

  // Selección de método (múltiplos / dcf / mixto) y resultado
  // Mostrar UI para escoger múltiplos por sector o editar manualmente

  return (
    <section>
      {/* Controles de método, selección de sector y escenarios */}
      {/* Tabla P&L dinámica (edición por celdas) */}
      {/* KPIs calculados y valor resultante */}
    </section>
  );
}
```

Pseudocódigo: ComparableMultiples (resumen)
```tsx
import { useSectorMultiples } from '@/hooks/useSectorMultiples';

export function ComparableMultiples({ sectorCode, baseRevenue, baseEBITDA, onChange }) {
  const { data, loading } = useSectorMultiples();
  if (loading) return <div>Cargando sectores...</div>;
  const sector = data.find(s => s.sector_code === sectorCode);

  const estimates = sector ? {
    revenueMin: baseRevenue * sector.revenue_multiple_min,
    revenueAvg: baseRevenue * sector.revenue_multiple_avg,
    revenueMax: baseRevenue * sector.revenue_multiple_max,
    ebitdaMin: baseEBITDA * sector.ebitda_multiple_min,
    ebitdaAvg: baseEBITDA * sector.ebitda_multiple_avg,
    ebitdaMax: baseEBITDA * sector.ebitda_multiple_max,
  } : undefined;

  // onChange({...}) para guardar en comparable_multiples_results

  return <div>{/* Mostrar tarjetas con estimaciones */}</div>;
}
```

---

## 5) Generación de PDFs (@react-pdf/renderer)

Pseudocódigo: ValuationPDFExporter
```tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 32 },
  h1: { fontSize: 18, marginBottom: 12 },
  section: { marginBottom: 16 }
});

export function ValuationPDFExporter({ valuation, advisorProfile }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>{valuation.title}</Text>
        <View style={styles.section}>
          <Text>Cliente: {valuation.client_name}</Text>
          <Text>Compañía: {valuation.company_name}</Text>
          <Text>Sector: {valuation.sector_name}</Text>
        </View>
        {/* Resumen de KPIs y tabla P&L básica */}
      </Page>
    </Document>
  );
}
```

---

## 6) Rutas (React Router)

```tsx
import { Routes, Route } from 'react-router-dom';
import { ValuationList } from '@/components/valuation/ValuationList';
import { ValuationEditor } from '@/components/valuation/ValuationEditor';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/valuation" element={<ValuationList />} />
      <Route path="/valuation/:id" element={<ValuationEditor />} />
    </Routes>
  );
}
```

---

## 7) Checklist de Implementación

- DB y RLS
  - Crear tablas valuations y sector_multiples.
  - Habilitar RLS y policies (SELECT/INSERT/UPDATE/DELETE) por user_id.
  - Trigger updated_at activo.
- Tipos TS
  - Definir Valuation, PLRow, ValuationConfig y SectorMultiples.
- Data Layer
  - Repositorio ValuationRepository con CRUD.
  - Hook useValuations para estado, creación, actualización, borrado.
  - Hook useSectorMultiples para catálogos.
- UI Componentes
  - ValuationList (listado + crear) y ValuationEditor (edición + auto-guardado + PDF).
  - Módulos: ValuationCalculator, DCFCalculator, ComparableMultiples, auxiliares.
- PDF
  - Exportador con branding opcional (advisor_profiles).
- Rutas
  - /valuation y /valuation/:id protegidas si aplica.

---

## 8) Validaciones y Troubleshooting

Validaciones
- En inserciones a valuations, incluir user_id = auth.uid() para pasar RLS.
- Campos numéricos: normalizar NaN/undefined a 0 para cálculos consistentes.
- Mantener un único H1 por página y semántica HTML en UI para buen SEO.

Errores comunes
- new row violates row-level security policy: falta user_id en insert.
- infinite recursion detected in policy: no consultar la misma tabla en la policy; usar funciones SECURITY DEFINER.
- Colores o estilos inconsistentes: centralizar tokens en index.css/tailwind.config.ts.

Rendimiento
- Memorizar cálculos pesados (useMemo).
- Debounce en auto-guardado.
- Lazy load para módulos grandes (PDF u otros) si es necesario.

Seguridad
- Roles en tabla separada user_roles (no en perfiles) y verificación en RLS vía función has_role.
- Nunca depender de localStorage para privilegios de admin.
