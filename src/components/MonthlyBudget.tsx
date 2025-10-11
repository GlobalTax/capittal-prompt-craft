import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicBudgetTable, BudgetTableSection } from '@/components/valuation/DynamicBudgetTable';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const createMonthValues = (months: string[]) => {
  return months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
};

const DEFAULT_SECTIONS = (months: string[]): BudgetTableSection[] => [
  {
    id: 'income-section',
    title: 'INGRESOS',
    editable: false,
    rows: [
      { id: 'sales', label: 'Ventas', type: 'input', category: 'income', indented: false, values: createMonthValues(months) },
      { id: 'other-income', label: 'Otros Ingresos', type: 'input', category: 'income', indented: false, values: createMonthValues(months) }
    ]
  },
  {
    id: 'fixed-costs-section',
    title: 'GASTOS FIJOS',
    editable: false,
    rows: [
      { id: 'rent', label: 'Alquiler', type: 'input', category: 'expense', indented: false, values: createMonthValues(months) },
      { id: 'salaries', label: 'Nóminas', type: 'input', category: 'expense', indented: false, values: createMonthValues(months) },
      { id: 'insurance', label: 'Seguros', type: 'input', category: 'expense', indented: false, values: createMonthValues(months) }
    ]
  },
  {
    id: 'variable-costs-section',
    title: 'GASTOS VARIABLES',
    editable: false,
    rows: [
      { id: 'supplies', label: 'Suministros', type: 'input', category: 'expense', indented: false, values: createMonthValues(months) },
      { id: 'marketing', label: 'Marketing', type: 'input', category: 'expense', indented: false, values: createMonthValues(months) }
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
        category: 'result',
        indented: false,
        values: createMonthValues(months),
        formula: (monthData: { [key: string]: number }) => {
          return Object.entries(monthData)
            .filter(([key]) => key === 'sales' || key === 'other-income')
            .reduce((sum, [, value]) => sum + value, 0);
        }
      },
      { 
        id: 'total-expenses', 
        label: 'Total Gastos', 
        type: 'calculated',
        category: 'result',
        indented: false,
        values: createMonthValues(months),
        formula: (monthData: { [key: string]: number }) => {
          return Object.entries(monthData)
            .filter(([key]) => ['rent', 'salaries', 'insurance', 'supplies', 'marketing'].includes(key))
            .reduce((sum, [, value]) => sum + value, 0);
        }
      },
      { 
        id: 'net-result', 
        label: 'Resultado Neto', 
        type: 'calculated',
        category: 'result',
        indented: false,
        values: createMonthValues(months),
        formula: (monthData: { [key: string]: number }) => {
          const income = (monthData['total-income'] || 0);
          const expenses = (monthData['total-expenses'] || 0);
          return income - expenses;
        }
      }
    ]
  }
];

export default function MonthlyBudget() {
  const { user } = useAuth();
  const { budgets, loading, createBudget, updateBudget } = useMonthlyBudgets();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sections, setSections] = useState<BudgetTableSection[]>(() => DEFAULT_SECTIONS(MONTHS));
  const [monthStatuses, setMonthStatuses] = useState<('real' | 'presupuestado')[]>(Array(12).fill('presupuestado'));
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);

  // Generar años disponibles
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    const yearBudget = budgets.find(b => b.year === selectedYear);
    if (yearBudget) {
      setSections(yearBudget.sections);
      setMonthStatuses(yearBudget.month_statuses);
      setCurrentBudgetId(yearBudget.id);
    } else {
      setSections(DEFAULT_SECTIONS(MONTHS));
      setMonthStatuses(Array(12).fill('presupuestado'));
      setCurrentBudgetId(null);
    }
  }, [selectedYear, budgets]);

  const handleCreateBudget = async () => {
    if (!user) return;
    
    try {
      const budget = await createBudget(selectedYear, `Presupuesto ${selectedYear}`, DEFAULT_SECTIONS(MONTHS));
      if (budget) {
        setCurrentBudgetId(budget.id);
        toast({
          title: "Presupuesto creado",
          description: `Presupuesto para ${selectedYear} creado exitosamente`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el presupuesto",
        variant: "destructive",
      });
    }
  };

  const handleSectionsChange = async (newSections: BudgetTableSection[]) => {
    setSections(newSections);
    if (currentBudgetId) {
      await updateBudget(currentBudgetId, { sections: newSections as any });
    }
  };

  const handleMonthStatusToggle = async (monthIndex: number) => {
    const newStatuses = [...monthStatuses];
    newStatuses[monthIndex] = newStatuses[monthIndex] === 'real' ? 'presupuestado' : 'real';
    setMonthStatuses(newStatuses);
    if (currentBudgetId) {
      await updateBudget(currentBudgetId, { month_statuses: newStatuses as any });
    }
  };

  const calculateTotalIncome = () => {
    return sections
      .flatMap(s => s.rows.filter(r => r.category === 'income'))
      .reduce((acc, row) => acc + Object.values(row.values).reduce((sum, val) => sum + val, 0), 0);
  };

  const calculateTotalExpenses = () => {
    return sections
      .flatMap(s => s.rows.filter(r => r.category === 'expense'))
      .reduce((acc, row) => acc + Object.values(row.values).reduce((sum, val) => sum + val, 0), 0);
  };

  const calculateNetResult = () => {
    return calculateTotalIncome() - calculateTotalExpenses();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Presupuesto Mensual</h1>
          <p className="text-muted-foreground">Gestiona tus ingresos y gastos mensuales</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <Select value={selectedYear.toString()} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {!currentBudgetId && (
            <Button onClick={handleCreateBudget}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Presupuesto {selectedYear}
            </Button>
          )}
        </div>
      </div>

      {currentBudgetId ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Ingresos</p>
                  <p className="text-2xl font-bold text-green-600">
                    €{calculateTotalIncome().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Gastos</p>
                  <p className="text-2xl font-bold text-red-600">
                    €{calculateTotalExpenses().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resultado Neto</p>
                  <p className={`text-2xl font-bold ${calculateNetResult() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    €{calculateNetResult().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <DynamicBudgetTable
              months={MONTHS}
              monthStatuses={monthStatuses}
              sections={sections}
              year={selectedYear}
              onDataChange={handleSectionsChange}
              onMonthStatusToggle={handleMonthStatusToggle}
            />
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No existe presupuesto para el año {selectedYear}
          </p>
          <Button onClick={handleCreateBudget}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Presupuesto {selectedYear}
          </Button>
        </Card>
      )}
    </div>
  );
}
