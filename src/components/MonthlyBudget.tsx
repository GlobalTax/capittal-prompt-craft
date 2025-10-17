import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DynamicBudgetTable, BudgetTableSection } from '@/components/valuation/DynamicBudgetTable';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, TrendingUp, TrendingDown, DollarSign, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
      { id: 'rent', label: 'Alquiler', type: 'percentage', category: 'expense', indented: false, values: createMonthValues(months), percentageOf: 'sales' },
      { id: 'salaries', label: 'Nóminas', type: 'percentage', category: 'expense', indented: false, values: createMonthValues(months), percentageOf: 'sales' },
      { id: 'insurance', label: 'Seguros', type: 'percentage', category: 'expense', indented: false, values: createMonthValues(months), percentageOf: 'sales' }
    ]
  },
  {
    id: 'variable-costs-section',
    title: 'GASTOS VARIABLES',
    editable: false,
    rows: [
      { id: 'supplies', label: 'Suministros', type: 'percentage', category: 'expense', indented: false, values: createMonthValues(months), percentageOf: 'sales' },
      { id: 'marketing', label: 'Marketing', type: 'percentage', category: 'expense', indented: false, values: createMonthValues(months), percentageOf: 'sales' }
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
        values: createMonthValues(months)
      },
      { 
        id: 'total-expenses', 
        label: 'Total Gastos', 
        type: 'calculated',
        category: 'result',
        indented: false,
        values: createMonthValues(months)
      },
      { 
        id: 'net-result', 
        label: 'Resultado Neto', 
        type: 'calculated',
        category: 'result',
        indented: false,
        values: createMonthValues(months)
      }
    ]
  }
];

export default function MonthlyBudget() {
  const { user } = useAuth();
  const { 
    budgets, 
    loading, 
    createBudget, 
    updateBudget, 
    refetch,
    isOnline,
    isSyncing,
    lastError,
    hasPending,
    loadDraft,
    clearDraft,
    retrySync
  } = useMonthlyBudgets();
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [sections, setSections] = useState<BudgetTableSection[]>(() => DEFAULT_SECTIONS(MONTHS));
  const [monthStatuses, setMonthStatuses] = useState<('real' | 'presupuestado')[]>(Array(12).fill('presupuestado'));
  const [currentBudgetId, setCurrentBudgetId] = useState<string | null>(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<any>(null);

  // Generar años disponibles
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  useEffect(() => {
    const yearBudget = budgets.find(b => b.year === selectedYear);
    if (yearBudget) {
      setSections(yearBudget.sections);
      setMonthStatuses(yearBudget.month_statuses);
      setCurrentBudgetId(yearBudget.id);

      const draft = loadDraft(selectedYear);
      if (draft && draft.timestamp > new Date(yearBudget.updated_at).getTime()) {
        setPendingDraft(draft);
        setShowDraftDialog(true);
      }
    } else {
      setSections(DEFAULT_SECTIONS(MONTHS));
      setMonthStatuses(Array(12).fill('presupuestado'));
      setCurrentBudgetId(null);
    }
  }, [selectedYear, budgets]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPending) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasPending]);

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

  const handleSectionsChange = (newSections: BudgetTableSection[]) => {
    setSections(newSections);
    if (currentBudgetId) {
      updateBudget(currentBudgetId, { sections: newSections as any });
    }
  };

  const handleRestoreDraft = () => {
    if (pendingDraft && currentBudgetId) {
      setSections(pendingDraft.sections);
      setMonthStatuses(pendingDraft.month_statuses);
      updateBudget(currentBudgetId, { 
        sections: pendingDraft.sections as any,
        month_statuses: pendingDraft.month_statuses as any
      });
      toast({
        title: "Draft restaurado",
        description: "Cambios locales aplicados",
      });
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
  };

  const handleDiscardDraft = () => {
    if (pendingDraft) {
      clearDraft(selectedYear);
      toast({
        title: "Draft descartado",
        description: "Se mantienen los datos del servidor",
      });
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
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
      <Dialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambios locales encontrados</DialogTitle>
            <DialogDescription>
              Tienes cambios sin sincronizar guardados localmente. ¿Quieres restaurarlos?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardDraft}>
              Descartar
            </Button>
            <Button onClick={handleRestoreDraft}>
              Restaurar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Presupuesto Mensual</h1>
          <p className="text-muted-foreground">Gestiona tus ingresos y gastos mensuales</p>
        </div>
        
        <div className="flex gap-4 items-center">
          {currentBudgetId && (
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refrescar
            </Button>
          )}
          
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

      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Sin conexión</AlertTitle>
          <AlertDescription>
            Trabajando offline. Los cambios se guardarán cuando vuelva la conexión.
          </AlertDescription>
        </Alert>
      )}

      {lastError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error al sincronizar</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{lastError}</span>
            <Button variant="outline" size="sm" onClick={retrySync}>
              Reintentar ahora
            </Button>
          </AlertDescription>
        </Alert>
      )}

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

        <Card className="p-6 relative">
          {(isSyncing || hasPending) && (
            <div className="absolute top-2 right-2 z-30">
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Guardando...
              </Badge>
            </div>
          )}
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
