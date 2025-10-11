# Prompt para Replicar Calculadora de Presupuesto Mensual

## Descripción General
Necesito implementar una calculadora de presupuesto mensual dinámica con las siguientes características:

### 1. Base de Datos (Supabase)

Crear tabla `monthly_budgets` con esta estructura:

```sql
CREATE TABLE monthly_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  budget_name TEXT NOT NULL,
  sections JSONB NOT NULL DEFAULT '[]',
  month_statuses JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own budgets" ON monthly_budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own budgets" ON monthly_budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets" ON monthly_budgets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets" ON monthly_budgets
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_monthly_budgets_updated_at
  BEFORE UPDATE ON monthly_budgets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

### 2. Tipos de Datos

#### BudgetTableRow
```typescript
interface BudgetTableRow {
  id: string;
  label: string;
  type: 'input' | 'calculated';
  category: 'income' | 'expense' | 'result';
  indented: boolean;
  values: { [month: string]: number };
  formula?: (monthData: { [key: string]: number }) => number;
}
```

#### BudgetTableSection
```typescript
interface BudgetTableSection {
  id: string;
  title: string;
  editable: boolean;
  rows: BudgetTableRow[];
}
```

#### MonthlyBudget
```typescript
interface MonthlyBudget {
  id: string;
  user_id: string;
  year: number;
  budget_name: string;
  sections: BudgetTableSection[];
  month_statuses: ('real' | 'presupuestado')[];
  created_at: string;
  updated_at: string;
}
```

### 3. Hook de Datos (useMonthlyBudgets.ts)

Crear hook con estas funciones:
- `budgets`: Lista de presupuestos
- `loading`: Estado de carga
- `createBudget(year, name, sections)`: Crear presupuesto
- `updateBudget(id, updates)`: Actualizar presupuesto

```typescript
export function useMonthlyBudgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBudgets();
  }, [user]);

  const fetchBudgets = async () => {
    const { data } = await supabase
      .from('monthly_budgets')
      .select('*')
      .eq('user_id', user.id)
      .order('year', { ascending: false });
    setBudgets(data as any);
    setLoading(false);
  };

  const createBudget = async (year, name, sections) => {
    const { data } = await supabase
      .from('monthly_budgets')
      .insert({
        user_id: user.id,
        year,
        budget_name: name,
        sections,
        month_statuses: Array(12).fill('presupuestado')
      })
      .select()
      .single();
    await fetchBudgets();
    return data;
  };

  const updateBudget = async (id, updates) => {
    await supabase
      .from('monthly_budgets')
      .update(updates)
      .eq('id', id);
    await fetchBudgets();
  };

  return { budgets, loading, createBudget, updateBudget };
}
```

### 4. Componente de Tabla Dinámica (DynamicBudgetTable.tsx)

Crear componente con estas características:

**Props:**
- `months: string[]` - Array de meses
- `monthStatuses: ('real' | 'presupuestado')[]` - Estado de cada mes
- `sections: BudgetTableSection[]` - Secciones con filas
- `year: number` - Año del presupuesto
- `onDataChange: (sections) => void` - Callback al cambiar datos
- `onMonthStatusToggle: (monthIndex) => void` - Callback al cambiar estado de mes

**Funcionalidades:**
1. Tabla con columnas fijas (Concepto) y columnas por mes
2. Toggle "Real" vs "Presupuestado" por mes (visual)
3. Inputs editables para filas tipo 'input'
4. Cálculos automáticos para filas tipo 'calculated'
5. Estilos diferentes por categoría (income=verde, expense=rojo, result=azul)
6. Soporte para filas indentadas
7. Agregar/eliminar filas dinámicamente
8. Agregar/eliminar secciones dinámicamente
9. Total por mes en footer

**Estructura de Tabla:**
```
| Concepto | Ene (R/P) | Feb (R/P) | ... | Dic (R/P) |
|----------|-----------|-----------|-----|-----------|
| INGRESOS |           |           |     |           |
| Ventas   | [input]   | [input]   | ... | [input]   |
| GASTOS   |           |           |     |           |
| ...      |           |           |     |           |
| TOTAL    | [calc]    | [calc]    | ... | [calc]    |
```

### 5. Componente Principal (MonthlyBudget.tsx)

**Funcionalidades:**
1. Selector de año
2. Botón "Crear Presupuesto" si no existe para el año
3. Cards con métricas:
   - Total Ingresos (verde)
   - Total Gastos (rojo)
   - Resultado Neto (verde/rojo según valor)
4. Tabla dinámica integrada
5. Auto-guardado al cambiar datos o estados de mes

**Estructura de Secciones por Defecto:**
```typescript
const DEFAULT_SECTIONS = [
  {
    id: 'income-section',
    title: 'INGRESOS',
    editable: false,
    rows: [
      { id: 'sales', label: 'Ventas', type: 'input', category: 'income', ... },
      { id: 'other-income', label: 'Otros Ingresos', type: 'input', category: 'income', ... }
    ]
  },
  {
    id: 'fixed-costs-section',
    title: 'GASTOS FIJOS',
    editable: false,
    rows: [
      { id: 'rent', label: 'Alquiler', type: 'input', category: 'expense', ... },
      { id: 'salaries', label: 'Nóminas', type: 'input', category: 'expense', ... }
    ]
  },
  {
    id: 'results-section',
    title: 'RESULTADOS',
    editable: false,
    rows: [
      { 
        id: 'total-income', 
        label: 'Total Ingresos', 
        type: 'calculated',
        formula: (monthData) => suma de ingresos
      },
      { 
        id: 'total-expenses', 
        label: 'Total Gastos', 
        type: 'calculated',
        formula: (monthData) => suma de gastos
      },
      { 
        id: 'net-result', 
        label: 'Resultado Neto', 
        type: 'calculated',
        formula: (monthData) => ingresos - gastos
      }
    ]
  }
];
```

### 6. Integración en la App

Agregar ruta en App.tsx:
```tsx
<Route path="/presupuesto" element={
  <ProtectedRoute>
    <MonthlyBudget />
  </ProtectedRoute>
} />
```

### 7. Características Clave del Sistema

1. **Auto-guardado**: Cambios se guardan automáticamente en la base de datos
2. **Cálculos en Tiempo Real**: Las fórmulas se recalculan al cambiar valores
3. **Estado por Mes**: Cada mes puede marcarse como "Real" o "Presupuestado"
4. **Multi-año**: Soporte para múltiples presupuestos anuales
5. **Secciones Dinámicas**: Agregar/eliminar secciones y filas
6. **Formato de Moneda**: Valores formateados como EUR
7. **Responsive**: Tabla con scroll horizontal en móviles

### 8. Dependencias Necesarias

```json
{
  "@supabase/supabase-js": "^2.x",
  "lucide-react": "latest",
  "@/components/ui/card": "shadcn",
  "@/components/ui/button": "shadcn",
  "@/components/ui/select": "shadcn",
  "@/components/ui/input": "shadcn"
}
```

### 9. Estilo y Diseño

- Usar tokens de diseño del sistema (colors, spacing)
- Headers sticky en tabla
- Colores semánticos:
  - Verde: Ingresos
  - Rojo: Gastos
  - Azul: Resultados
- Cards con iconos de Lucide (TrendingUp, TrendingDown, DollarSign)

### 10. Validaciones

- Año debe ser numérico
- Valores monetarios deben ser >= 0
- Solo un presupuesto por año por usuario
- month_statuses debe tener exactamente 12 elementos

---

## Instrucciones de Implementación

1. Crear migración de base de datos
2. Crear tipos TypeScript
3. Crear hook useMonthlyBudgets
4. Crear componente DynamicBudgetTable
5. Crear componente MonthlyBudget
6. Integrar en App.tsx
7. Probar funcionalidades:
   - Crear presupuesto
   - Editar valores
   - Cambiar estados de mes
   - Verificar cálculos automáticos
   - Verificar guardado automático

## Notas Importantes

- Los valores de `monthData` en las fórmulas son objetos con keys siendo los IDs de las filas
- El componente debe recalcular automáticamente los totales al editar inputs
- Los estados de mes son solo visuales, no afectan cálculos
- Usar `as any` temporalmente para evitar conflictos de tipos con Supabase hasta regenerar types
