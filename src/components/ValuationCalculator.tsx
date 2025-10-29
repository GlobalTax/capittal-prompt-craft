import { useState, useEffect, useMemo, useCallback } from "react";
import React from "react";
import { useNavigate } from "react-router-dom";
import { trackFunnelEvent } from "@/lib/analytics";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, TrendingUp, Users, Euro, AlertTriangle, Info, Plus, Trash2, BarChart3, X, Handshake, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DynamicPLTable, type RowData, type TableSection } from "@/components/valuation/DynamicPLTable";
import { Valuation } from "@/hooks/useValuations";
import { useValuationYears } from "@/hooks/useValuationYears";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface YearData {
  year: string;
  yearStatus: 'closed' | 'projected'; // closed = cerrado/real, projected = en curso/proyectado
  totalRevenue: number;
  fiscalRecurringPercent: number;
  accountingRecurringPercent: number;
  laborRecurringPercent: number;
  otherRevenuePercent: number;
  personnelCosts: number;
  otherCosts: number;
  ownerSalary: number;
  numberOfEmployees: number;
}

interface FinancialData {
  years: YearData[];
}

interface ValuationResult {
  valuationAmount: number;
  multiplier: number;
  method: string;
}

interface ValuationMethod {
  id: string;
  name: string;
  type: 'ebitda' | 'revenue';
  enabled: boolean;
  multipliers: MultiplierScenario[];
}

interface MultiplierScenario {
  id: string;
  label: string;
  value: number;
  suggested: boolean;
  editable: boolean;
}

interface ValuationConfig {
  methods: ValuationMethod[];
  showSuggestions: boolean;
  baseYearForValuation: 'lastClosed' | 'current' | 'average2Years';
}

interface ValuationCalculatorProps {
  valuation: Valuation;
  onUpdate: (field: string, value: any) => void;
}

// Helper para mapear Valuation → FinancialData
const mapValuationToFinancialData = (val: Valuation): FinancialData => {
  const currentYear = new Date().getFullYear();
  
  return {
    years: [
      {
        year: val.year_1 || (currentYear - 1).toString(),
        yearStatus: 'closed',
        totalRevenue: val.revenue_1 || 0,
        fiscalRecurringPercent: val.fiscal_recurring_1 || 0,
        accountingRecurringPercent: val.accounting_recurring_1 || 0,
        laborRecurringPercent: val.labor_recurring_1 || 0,
        otherRevenuePercent: val.other_revenue_1 || 0,
        personnelCosts: val.personnel_costs_1 || 0,
        otherCosts: val.other_costs_1 || 0,
        ownerSalary: val.owner_salary_1 || 0,
        numberOfEmployees: val.employees_1 || 0,
      },
      {
        year: val.year_2 || currentYear.toString(),
        yearStatus: 'projected',
        totalRevenue: val.revenue_2 || 0,
        fiscalRecurringPercent: val.fiscal_recurring_2 || 0,
        accountingRecurringPercent: val.accounting_recurring_2 || 0,
        laborRecurringPercent: val.labor_recurring_2 || 0,
        otherRevenuePercent: val.other_revenue_2 || 0,
        personnelCosts: val.personnel_costs_2 || 0,
        otherCosts: val.other_costs_2 || 0,
        ownerSalary: val.owner_salary_2 || 0,
        numberOfEmployees: val.employees_2 || 0,
      },
    ],
  };
};

const ValuationCalculator = ({ valuation, onUpdate }: ValuationCalculatorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Hook para gestión de años dinámicos
  const { years: valuationYears, loading: yearsLoading, addYear, deleteYear, updateYear } = useValuationYears(valuation.id);
  
  // Collaboration dialog state
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);
  const [collaborationNotes, setCollaborationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Debounce timer for database persistence
  const saveTimeoutRef = React.useRef<NodeJS.Timeout>();
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Mapear años de la BD a formato local
  const data: FinancialData = useMemo(() => {
    if (valuationYears.length === 0) {
      return mapValuationToFinancialData(valuation);
    }
    
    return {
      years: valuationYears.map(vy => ({
        year: vy.year,
        yearStatus: vy.year_status,
        totalRevenue: vy.revenue,
        fiscalRecurringPercent: vy.fiscal_recurring,
        accountingRecurringPercent: vy.accounting_recurring,
        laborRecurringPercent: vy.labor_recurring,
        otherRevenuePercent: vy.other_revenue,
        personnelCosts: vy.personnel_costs,
        otherCosts: vy.other_costs,
        ownerSalary: vy.owner_salary,
        numberOfEmployees: vy.employees,
      }))
    };
  }, [valuationYears, valuation]);

  // Local data state for immediate UI updates (decoupled from DB)
  const [localData, setLocalData] = useState<FinancialData | null>(null);
  const viewData = localData ?? data; // Use local data for UI if available
  
  // Sync localData ONLY on initial load (not on every valuationYears change)
  useEffect(() => {
    // Only sync if localData is empty (initial load)
    if (localData === null) {
      if (valuationYears.length > 0) {
        setLocalData({
          years: valuationYears.map(vy => ({
            year: vy.year,
            yearStatus: vy.year_status,
            totalRevenue: vy.revenue,
            fiscalRecurringPercent: vy.fiscal_recurring,
            accountingRecurringPercent: vy.accounting_recurring,
            laborRecurringPercent: vy.labor_recurring,
            otherRevenuePercent: vy.other_revenue,
            personnelCosts: vy.personnel_costs,
            otherCosts: vy.other_costs,
            ownerSalary: vy.owner_salary,
            numberOfEmployees: vy.employees,
          }))
        });
      } else {
        setLocalData(mapValuationToFinancialData(valuation));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only execute on mount

  // Manual sync function to update from DB when needed
  const syncFromDB = useCallback(() => {
    if (valuationYears.length > 0) {
      setLocalData({
        years: valuationYears.map(vy => ({
          year: vy.year,
          yearStatus: vy.year_status,
          totalRevenue: vy.revenue,
          fiscalRecurringPercent: vy.fiscal_recurring,
          accountingRecurringPercent: vy.accounting_recurring,
          laborRecurringPercent: vy.labor_recurring,
          otherRevenuePercent: vy.other_revenue,
          personnelCosts: vy.personnel_costs,
          otherCosts: vy.other_costs,
          ownerSalary: vy.owner_salary,
          numberOfEmployees: vy.employees,
        }))
      });
    }
  }, [valuationYears]);

  const [valuations, setValuations] = useState<ValuationResult[]>([]);
  
  // Debounced data for charts to prevent jumping
  const [debouncedData, setDebouncedData] = useState<FinancialData>(data);
  
  // State to control alert visibility
  const [alertsVisible, setAlertsVisible] = useState(true);
  
  // Valuation configuration state
  const [valuationConfig, setValuationConfig] = useState<ValuationConfig>({
    methods: [
      {
        id: 'revenue-method',
        name: 'Múltiplo por Facturación',
        type: 'revenue',
        enabled: true,
        multipliers: [
          { id: 'r1', label: 'Conservador', value: 0.7, suggested: true, editable: true },
          { id: 'r2', label: 'Moderado', value: 0.8, suggested: true, editable: true },
          { id: 'r3', label: 'Optimista', value: 0.9, suggested: true, editable: true },
          { id: 'r4', label: 'Agresivo', value: 1.0, suggested: true, editable: true },
          { id: 'r5', label: 'Premium', value: 1.1, suggested: true, editable: true },
        ]
      },
      {
        id: 'ebitda-method',
        name: 'Múltiplo por EBITDA',
        type: 'ebitda',
        enabled: false,
        multipliers: [
          { id: 'e1', label: 'Conservador', value: 3.5, suggested: true, editable: true },
          { id: 'e2', label: 'Moderado', value: 4.5, suggested: true, editable: true },
          { id: 'e3', label: 'Optimista', value: 5.5, suggested: true, editable: true },
          { id: 'e4', label: 'Agresivo', value: 6.5, suggested: true, editable: true },
          { id: 'e5', label: 'Premium', value: 7.5, suggested: true, editable: true },
        ]
      }
    ],
    showSuggestions: true,
    baseYearForValuation: 'lastClosed',
  });
  
  // Custom sections state (for user-added sections in the future)
  const [customSections, setCustomSections] = useState<TableSection[]>([]);
  
  // Dynamic table sections - derived from viewData (local state for immediate UI updates)
  const dynamicSections = useMemo<TableSection[]>(() => {
    const customLabels = (valuation.metadata as any)?.customLabels || {};
    
    return [
      {
        id: 'revenue-section',
        title: 'INGRESOS',
        editable: true,
        rows: [
          {
            id: 'total-revenue',
            label: customLabels['total-revenue'] || 'Facturación Total',
            type: 'input' as const,
            category: 'revenue' as const,
            indented: false,
            values: viewData.years.reduce((acc, y) => ({ ...acc, [y.year]: y.totalRevenue }), {})
          },
          {
            id: 'fiscal-recurring',
            label: customLabels['fiscal-recurring'] || 'Servicios Fiscales',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => ({ ...acc, [y.year]: y.fiscalRecurringPercent }), {})
          },
          {
            id: 'accounting-recurring',
            label: customLabels['accounting-recurring'] || 'Servicios Contables',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => ({ ...acc, [y.year]: y.accountingRecurringPercent }), {})
          },
          {
            id: 'labor-recurring',
            label: customLabels['labor-recurring'] || 'Servicios Laborales',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => ({ ...acc, [y.year]: y.laborRecurringPercent }), {})
          },
          {
            id: 'other-revenue',
            label: customLabels['other-revenue'] || 'Otros Servicios',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => ({ ...acc, [y.year]: y.otherRevenuePercent }), {})
          }
        ]
      },
      {
        id: 'costs-section',
        title: 'COSTES',
        editable: true,
        rows: [
          {
            id: 'personnel-costs',
            label: customLabels['personnel-costs'] || 'Costes de Personal',
            type: 'percentage' as const,
            category: 'cost' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => {
              const percentage = y.totalRevenue ? (y.personnelCosts / y.totalRevenue) * 100 : 0;
              return { ...acc, [y.year]: percentage };
            }, {})
          },
          {
            id: 'other-costs',
            label: customLabels['other-costs'] || 'Otros Costes Operativos',
            type: 'percentage' as const,
            category: 'cost' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => {
              const percentage = y.totalRevenue ? (y.otherCosts / y.totalRevenue) * 100 : 0;
              return { ...acc, [y.year]: percentage };
            }, {})
          },
          {
            id: 'owner-salary',
            label: customLabels['owner-salary'] || 'Sueldo Propiedad',
            type: 'percentage' as const,
            category: 'cost' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: viewData.years.reduce((acc, y) => {
              const percentage = y.totalRevenue ? (y.ownerSalary / y.totalRevenue) * 100 : 0;
              return { ...acc, [y.year]: percentage };
            }, {})
          }
        ]
      },
      {
        id: 'results-section',
        title: 'RESULTADOS',
        editable: true,
        rows: [
          {
            id: 'employees',
            label: customLabels['employees'] || 'Nº Trabajadores',
            type: 'input' as const,
            category: 'result' as const,
            indented: true,
            values: viewData.years.reduce((acc, y) => ({ ...acc, [y.year]: y.numberOfEmployees }), {})
          },
          {
            id: 'total-costs',
            label: 'Costes Totales',
            type: 'calculated' as const,
            category: 'result' as const,
            indented: true,
            values: {},
            formula: (yearData: Record<string, number>) => {
              const personnelCosts = yearData['personnel-costs'] || 0;
              const otherCosts = yearData['other-costs'] || 0;
              const ownerSalary = yearData['owner-salary'] || 0;
              return personnelCosts + otherCosts + ownerSalary;
            }
          },
          {
            id: 'profit-before-taxes',
            label: 'BAI (Beneficio Antes de Impuestos)',
            type: 'calculated' as const,
            category: 'result' as const,
            indented: true,
            values: {},
            formula: (yearData: Record<string, number>) => {
              const totalRevenue = yearData['total-revenue'] || 0;
              const personnelCosts = yearData['personnel-costs'] || 0;
              const otherCosts = yearData['other-costs'] || 0;
              const ownerSalary = yearData['owner-salary'] || 0;
              return totalRevenue - personnelCosts - otherCosts - ownerSalary;
            }
          },
          {
            id: 'net-profit',
            label: 'Resultado Neto (después de Impuestos 25%)',
            type: 'calculated' as const,
            category: 'result' as const,
            indented: true,
            values: {},
            formula: (yearData: Record<string, number>) => {
              const totalRevenue = yearData['total-revenue'] || 0;
              const personnelCosts = yearData['personnel-costs'] || 0;
              const otherCosts = yearData['other-costs'] || 0;
              const ownerSalary = yearData['owner-salary'] || 0;
              const bai = totalRevenue - personnelCosts - otherCosts - ownerSalary;
              // Aplicar 25% de impuesto de sociedades
              const tax = bai * 0.25;
              return bai - tax;
            }
          },
          {
            id: 'ebitda',
            label: 'EBITDA Ajustado',
            type: 'calculated' as const,
            category: 'result' as const,
            indented: true,
            values: {},
            formula: (yearData: Record<string, number>) => {
              const totalRevenue = yearData['total-revenue'] || 0;
              const personnelCosts = yearData['personnel-costs'] || 0;
              const otherCosts = yearData['other-costs'] || 0;
              const ownerSalary = yearData['owner-salary'] || 0;
              // EBITDA Ajustado: suma el sueldo del propietario de vuelta
              return totalRevenue - personnelCosts - otherCosts + ownerSalary;
            }
          },
          {
            id: 'net-margin',
            label: 'Margen Neto (%)',
            type: 'calculated' as const,
            category: 'result' as const,
            indented: true,
            values: {},
            formula: (yearData: Record<string, number>) => {
              const totalRevenue = yearData['total-revenue'] || 0;
              const personnelCosts = yearData['personnel-costs'] || 0;
              const otherCosts = yearData['other-costs'] || 0;
              const ownerSalary = yearData['owner-salary'] || 0;
              const totalCosts = personnelCosts + otherCosts + ownerSalary;
              if (totalRevenue === 0) return 0;
              return ((totalRevenue - totalCosts) / totalRevenue) * 100;
            }
          }
        ]
      },
      ...customSections // Add custom sections for future extensibility
    ];
  }, [viewData, customSections, valuation.metadata]);

  const calculateMetricsForYear = (yearData: YearData) => {
    const fiscalRecurring = (yearData.totalRevenue * yearData.fiscalRecurringPercent) / 100;
    const accountingRecurring = (yearData.totalRevenue * yearData.accountingRecurringPercent) / 100;
    const laborRecurring = (yearData.totalRevenue * yearData.laborRecurringPercent) / 100;
    const otherRevenue = (yearData.totalRevenue * yearData.otherRevenuePercent) / 100;
    const totalRecurring = fiscalRecurring + accountingRecurring + laborRecurring + otherRevenue;
    const totalCosts = yearData.personnelCosts + yearData.otherCosts + yearData.ownerSalary;
    const netMargin = ((yearData.totalRevenue - totalCosts) / yearData.totalRevenue) * 100;
    const contributionMargin = ((yearData.totalRevenue - yearData.personnelCosts) / yearData.totalRevenue) * 100;
    const ownerMargin = (yearData.ownerSalary / yearData.totalRevenue) * 100;
    const revenuePerEmployee = yearData.totalRevenue / yearData.numberOfEmployees;
    const profitBeforeTaxes = yearData.totalRevenue - totalCosts;
    // EBITDA Ajustado: incluye el sueldo del propietario
    const ebitda = profitBeforeTaxes + yearData.ownerSalary;
    const recurringPercentage = (totalRecurring / yearData.totalRevenue) * 100;
    const costEfficiency = (totalCosts / yearData.totalRevenue) * 100;
    const otherIncome = yearData.totalRevenue - totalRecurring;

    return {
      fiscalRecurring,
      accountingRecurring,
      laborRecurring,
      otherRevenue,
      totalRecurring,
      otherIncome,
      totalCosts,
      netMargin,
      contributionMargin,
      ownerMargin,
      revenuePerEmployee,
      profitBeforeTaxes,
      ebitda,
      recurringPercentage,
      costEfficiency
    };
  };

  const calculateMetrics = () => {
    const latestYear = viewData.years[viewData.years.length - 1];
    const previousYear = viewData.years[viewData.years.length - 2];
    const latestMetrics = calculateMetricsForYear(latestYear);
    const revenueGrowth = previousYear ? ((latestYear.totalRevenue - previousYear.totalRevenue) / previousYear.totalRevenue) * 100 : 0;

    return {
      ...latestMetrics,
      revenueGrowth
    };
  };

  const calculateValuations = () => {
    // Determinar qué año usar según la configuración
    let baseYearData: YearData;
    let baseMetrics: ReturnType<typeof calculateMetricsForYear>;
    
    const closedYears = viewData.years.filter(y => y.yearStatus === 'closed');
    const lastClosedYear = closedYears.length > 0 ? closedYears[closedYears.length - 1] : viewData.years[0];
    const currentYear = viewData.years[viewData.years.length - 1];
    
    switch (valuationConfig.baseYearForValuation) {
      case 'lastClosed':
        baseYearData = lastClosedYear;
        baseMetrics = calculateMetricsForYear(baseYearData);
        break;
      case 'current':
        baseYearData = currentYear;
        baseMetrics = calculateMetricsForYear(baseYearData);
        break;
      case 'average2Years':
        // Promedio de los dos últimos años
        const last2Years = viewData.years.slice(-2);
        const avgRevenue = last2Years.reduce((sum, y) => sum + y.totalRevenue, 0) / last2Years.length;
        const avgPersonnelCosts = last2Years.reduce((sum, y) => sum + y.personnelCosts, 0) / last2Years.length;
        const avgOtherCosts = last2Years.reduce((sum, y) => sum + y.otherCosts, 0) / last2Years.length;
        const avgOwnerSalary = last2Years.reduce((sum, y) => sum + y.ownerSalary, 0) / last2Years.length;
        
        baseYearData = {
          ...currentYear,
          totalRevenue: avgRevenue,
          personnelCosts: avgPersonnelCosts,
          otherCosts: avgOtherCosts,
          ownerSalary: avgOwnerSalary
        };
        baseMetrics = calculateMetricsForYear(baseYearData);
        break;
    }
    
    const allValuations: ValuationResult[] = [];
    
    // Procesar cada método habilitado
    valuationConfig.methods.forEach(method => {
      if (!method.enabled) return;
      
      const baseValue = method.type === 'ebitda' 
        ? baseMetrics.ebitda 
        : baseYearData.totalRevenue;
      
      // Calcular valoraciones por cada multiplicador
      method.multipliers.forEach(multiplier => {
        let valuationAmount = baseValue * multiplier.value;
        
        // Aplicar ajustes automáticos si las sugerencias están activas
        if (valuationConfig.showSuggestions) {
          let adjustment = 1;
          
          // Ajuste por margen neto
          if (baseMetrics.netMargin > 30) adjustment += 0.1;
          else if (baseMetrics.netMargin < 10) adjustment -= 0.1;
          
          // Ajuste por recurrencia
          if (baseMetrics.recurringPercentage > 70) adjustment += 0.05;
          else if (baseMetrics.recurringPercentage < 40) adjustment -= 0.05;
          
          // Ajuste por tamaño
          if (baseYearData.totalRevenue >= 1000000) adjustment += 0.05;
          
          // Ajuste por crecimiento (solo aplicable si hay más de un año)
          if (viewData.years.length > 1) {
            const previousYear = viewData.years[viewData.years.length - 2];
            const revenueGrowth = ((currentYear.totalRevenue - previousYear.totalRevenue) / previousYear.totalRevenue) * 100;
            if (revenueGrowth > 20) adjustment += 0.1;
            else if (revenueGrowth < 0) adjustment -= 0.15;
          }
          
          valuationAmount *= adjustment;
        }
        
        allValuations.push({
          valuationAmount,
          multiplier: multiplier.value,
          method: `${method.name} - ${multiplier.label}`
        });
      });
    });
    
    setValuations(allValuations);
  };

  useEffect(() => {
    calculateValuations();
  }, [viewData, valuationConfig]);

  // Debounce chart data updates to prevent jumping
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedData(data);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [data]);

  const metrics = calculateMetrics();

  // Memoized chart data using debounced data
  const revenueCompositionData = useMemo(() => {
    const latestYear = debouncedData.years[debouncedData.years.length - 1];
    const fiscalRecurring = (latestYear.totalRevenue * latestYear.fiscalRecurringPercent) / 100;
    const accountingRecurring = (latestYear.totalRevenue * latestYear.accountingRecurringPercent) / 100;
    const laborRecurring = (latestYear.totalRevenue * latestYear.laborRecurringPercent) / 100;
    const otherRevenue = (latestYear.totalRevenue * latestYear.otherRevenuePercent) / 100;
    
    return [
      { name: "Fiscal", value: fiscalRecurring, fill: "hsl(var(--chart-1))" },
      { name: "Contable", value: accountingRecurring, fill: "hsl(var(--chart-2))" },
      { name: "Laboral", value: laborRecurring, fill: "hsl(var(--chart-3))" },
      { name: "Otros", value: otherRevenue, fill: "hsl(var(--chart-4))" }
    ].filter(item => item.value > 0);
  }, [debouncedData.years]);

  const yearComparisonData = useMemo(() => 
    debouncedData.years.map(year => ({
      year: year.year,
      revenue: year.totalRevenue
    })),
    [debouncedData.years]
  );

  const getMarginStatus = (margin: number, type: 'net' | 'owner') => {
    if (type === 'net') {
      if (margin < 10) return { label: "Insuficiente", color: "bg-destructive" };
      if (margin < 20) return { label: "Mínimo", color: "bg-warning" };
      if (margin < 30) return { label: "Óptimo", color: "bg-success" };
      return { label: "Superior", color: "bg-success" };
    } else {
      if (margin < 5) return { label: "Bajo", color: "bg-destructive" };
      if (margin < 8) return { label: "Normal", color: "bg-warning" };
      return { label: "Óptimo", color: "bg-success" };
    }
  };

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    
    // Redondear a 2 decimales para evitar problemas de precisión
    const rounded = Math.round(value * 100) / 100;
    
    // Usar toLocaleString con configuración española
    return rounded.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };

  // Función para parsear números con separadores de miles
  const parseNumber = (value: string): number => {
    // Eliminar puntos (separadores de miles) y reemplazar coma por punto decimal
    const cleaned = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle sell collaboration request
  const handleRequestCollaboration = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'Debes estar autenticado para realizar esta acción',
          variant: 'destructive'
        });
        return;
      }
      
      // Get current valuation amount
      const valuationAmount = valuations.length > 0 
        ? valuations.reduce((sum, v) => sum + v.valuationAmount, 0) / valuations.length
        : 0;
      
      const annualRevenue = viewData.years[0]?.totalRevenue || 0;
      
      // Determine company name based on valuation type
      const companyName = valuation.valuation_type === 'client_business' 
        ? (valuation.client_company || valuation.title)
        : valuation.valuation_type === 'potential_acquisition'
        ? (valuation.target_company_name || valuation.title)
        : valuation.title;
      
      if (!companyName || !annualRevenue) {
        toast({
          title: 'Datos incompletos',
          description: 'Por favor completa el nombre de la empresa y la facturación antes de solicitar ayuda',
          variant: 'destructive'
        });
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('request-sell-collaboration', {
        body: {
          valuationId: valuation.id,
          advisorUserId: user.id,
          companyName,
          sector: valuation.target_industry || 'No especificado',
          annualRevenue,
          valuationAmount,
          notes: collaborationNotes
        }
      });
      
      if (error) throw error;
      
      toast({
        title: '✅ Solicitud Enviada',
        description: 'Samuel y Lluis han recibido tu solicitud. Te contactarán pronto.',
      });
      
      setShowCollaborationDialog(false);
      setCollaborationNotes('');
      
      // Track event
      await trackFunnelEvent('sell_collaboration_requested', valuation.id);
    } catch (error: any) {
      console.error('Error requesting collaboration:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo enviar la solicitud. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };


  const addFutureYear = async () => {
    const latestYear = data.years[data.years.length - 1];
    const newYear = (parseInt(latestYear.year) + 1).toString();
    await addYear(newYear, 'projected');
    // Sync from DB after structural change
    setTimeout(syncFromDB, 100);
  };

  const addPastYear = async () => {
    const firstYear = data.years[0];
    const newYear = (parseInt(firstYear.year) - 1).toString();
    await addYear(newYear, 'closed');
    // Sync from DB after structural change
    setTimeout(syncFromDB, 100);
  };
  
  const toggleYearStatus = async (yearIndex: number) => {
    const yearToToggle = valuationYears[yearIndex];
    if (yearToToggle) {
      const newStatus = yearToToggle.year_status === 'closed' ? 'projected' : 'closed';
      await updateYear(yearToToggle.id, { year_status: newStatus });
      // Sync from DB after structural change
      setTimeout(syncFromDB, 100);
    }
  };

  const removeYear = async (yearIndex: number) => {
    const yearToRemove = valuationYears[yearIndex];
    if (yearToRemove && data.years.length > 2) {
      await deleteYear(yearToRemove.id);
      // Sync from DB after structural change
      setTimeout(syncFromDB, 100);
    }
  };

  const calculateVariation = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  // Helper to extract FinancialData from sections
  const extractFromSections = (sections: TableSection[], current: FinancialData): FinancialData => {
    const rows = sections.flatMap(s => s.rows);
    const get = (id: string) => rows.find(r => r.id === id);
    
    return {
      years: current.years.map(y => {
        const yr = y.year;
        const totalRevenue = get('total-revenue')?.values[yr] ?? y.totalRevenue;

        // Porcentajes de ingresos
        const fiscalPerc = get('fiscal-recurring')?.values[yr] ?? y.fiscalRecurringPercent;
        const accPerc = get('accounting-recurring')?.values[yr] ?? y.accountingRecurringPercent;
        const laborPerc = get('labor-recurring')?.values[yr] ?? y.laborRecurringPercent;
        const otherPerc = get('other-revenue')?.values[yr] ?? y.otherRevenuePercent;

        // Costes como % de ingresos → convertir a importe absoluto
        const personnelPerc = get('personnel-costs')?.values[yr];
        const otherCostsPerc = get('other-costs')?.values[yr];
        const ownerSalaryPerc = get('owner-salary')?.values[yr];

        const personnelCosts = totalRevenue * ((personnelPerc ?? (y.totalRevenue ? (y.personnelCosts / y.totalRevenue) * 100 : 0)) / 100);
        const otherCosts = totalRevenue * ((otherCostsPerc ?? (y.totalRevenue ? (y.otherCosts / y.totalRevenue) * 100 : 0)) / 100);
        const ownerSalary = totalRevenue * ((ownerSalaryPerc ?? (y.totalRevenue ? (y.ownerSalary / y.totalRevenue) * 100 : 0)) / 100);

        const employees = get('employees')?.values[yr] ?? y.numberOfEmployees;

        return {
          year: yr,
          yearStatus: y.yearStatus,
          totalRevenue,
          fiscalRecurringPercent: fiscalPerc,
          accountingRecurringPercent: accPerc,
          laborRecurringPercent: laborPerc,
          otherRevenuePercent: otherPerc,
          personnelCosts,
          otherCosts,
          ownerSalary,
          numberOfEmployees: employees,
        };
      })
    };
  };

  // Save custom labels to metadata
  const saveCustomLabels = useCallback((sections: TableSection[]) => {
    const customLabels: Record<string, string> = {};
    const defaultLabels: Record<string, string> = {
      'total-revenue': 'Facturación Total',
      'fiscal-recurring': 'Servicios Fiscales',
      'accounting-recurring': 'Servicios Contables',
      'labor-recurring': 'Servicios Laborales',
      'other-revenue': 'Otros Servicios',
      'personnel-costs': 'Costes de Personal',
      'other-costs': 'Otros Costes Operativos',
      'owner-salary': 'Sueldo Propiedad',
      'employees': 'Nº Trabajadores',
    };
    
    sections.forEach(section => {
      section.rows.forEach(row => {
        if (row.label !== defaultLabels[row.id]) {
          customLabels[row.id] = row.label;
        }
      });
    });
    
    const metadata = valuation.metadata || {};
    onUpdate('metadata', { ...metadata, customLabels });
  }, [valuation.metadata, onUpdate]);

  // Dynamic table handlers
  const handleDynamicDataChange = async (newSections: TableSection[]) => {
    // Separar secciones base de custom
    const BASE_SECTION_IDS = ['revenue-section', 'costs-section', 'results-section'];
    const customSectionsUpdated = newSections.filter(s => !BASE_SECTION_IDS.includes(s.id));
    
    // Actualizar custom sections localmente (inmediato)
    if (customSectionsUpdated.length > 0) {
      setCustomSections(customSectionsUpdated);
    }
    
    // Guardar labels personalizados
    saveCustomLabels(newSections);
    
    // Actualizar localData inmediatamente para feedback visual instantáneo
    setLocalData(prev => extractFromSections(newSections, prev ?? viewData));
    
    // Cancelar timeout previo
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Guardar en BD después de 500ms de inactividad (debounced)
    saveTimeoutRef.current = setTimeout(async () => {
      // Actualizar cada año en la base de datos
      for (let i = 0; i < viewData.years.length; i++) {
        const year = viewData.years[i];
        const valuationYear = valuationYears[i];
        
        if (!valuationYear) continue;
        
        const totalRevenueRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'total-revenue');
        const fiscalRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'fiscal-recurring');
        const accountingRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'accounting-recurring');
        const laborRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'labor-recurring');
        const otherRevenueRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'other-revenue');
        const personnelRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'personnel-costs');
        const otherCostsRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'other-costs');
        const ownerSalaryRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'owner-salary');
        const employeesRow = newSections
          .flatMap(s => s.rows)
          .find(r => r.id === 'employees');

        // Convert percentage values back to absolute amounts
        const totalRevenue = totalRevenueRow?.values[year.year] || 0;
        const personnelCosts = totalRevenue * ((personnelRow?.values[year.year] || 0) / 100);
        const otherCosts = totalRevenue * ((otherCostsRow?.values[year.year] || 0) / 100);
        const ownerSalary = totalRevenue * ((ownerSalaryRow?.values[year.year] || 0) / 100);

        // Actualizar en la BD con skipRefetch para evitar re-renders durante edición
        await updateYear(valuationYear.id, {
          revenue: totalRevenue,
          fiscal_recurring: fiscalRow?.values[year.year] || 0,
          accounting_recurring: accountingRow?.values[year.year] || 0,
          labor_recurring: laborRow?.values[year.year] || 0,
          other_revenue: otherRevenueRow?.values[year.year] || 0,
          personnel_costs: personnelCosts,
          other_costs: otherCosts,
          owner_salary: ownerSalary,
          employees: employeesRow?.values[year.year] || 0,
        }, true); // skipRefetch = true
      }
    }, 500);
  };

  const handleYearAdd = (type: 'past' | 'future') => {
    if (type === 'future') {
      addFutureYear();
    } else {
      addPastYear();
    }
  };

  const handleYearRemove = (yearIndex: number) => {
    removeYear(yearIndex);
  };

  const validateData = () => {
    const issues: string[] = [];
    
    viewData.years.forEach((yearData, index) => {
      // Solo validar si hay datos significativos en el año
      const hasSignificantData = yearData.totalRevenue > 0 || 
                                  yearData.personnelCosts > 0 || 
                                  yearData.otherCosts > 0;
      
      if (!hasSignificantData) {
        return; // Skip validación para este año si no tiene datos
      }
      
      const totalRecurringPercent = yearData.fiscalRecurringPercent + yearData.accountingRecurringPercent + 
                                     yearData.laborRecurringPercent + yearData.otherRevenuePercent;
      const yearMetrics = calculateMetricsForYear(yearData);
      
      // Convertir a advertencia en lugar de error
      if (yearMetrics.totalCosts >= yearData.totalRevenue && yearData.totalRevenue > 0) {
        issues.push(`⚠️ ${yearData.year}: Los costes superan o igualan los ingresos`);
      }
      if (totalRecurringPercent > 105) {
        issues.push(`${yearData.year}: Los porcentajes de facturación recurrente superan el 100%`);
      }

      if (index > 0) {
        const previousYear = viewData.years[index - 1];
        if (previousYear.totalRevenue > 0) {
          const growth = ((yearData.totalRevenue - previousYear.totalRevenue) / previousYear.totalRevenue) * 100;
          if (growth < -30) {
            issues.push(`⚠️ ${yearData.year}: Decrecimiento muy alto (-${Math.abs(growth).toFixed(1)}%)`);
          }
        }
      }
    });
    
    return issues;
  };

  // Chart data
  const chartConfig = {
    fiscal: { label: "Fiscal", color: "hsl(var(--chart-1))" },
    accounting: { label: "Contable", color: "hsl(var(--chart-2))" },
    labor: { label: "Laboral", color: "hsl(var(--chart-3))" },
    other: { label: "Otros", color: "hsl(var(--chart-4))" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <TooltipProvider>
        <div className="container mx-auto p-6 space-y-6">
          <div className="space-y-6">
              <div className="space-y-6 max-w-[95vw] mx-auto px-4">
                {/* Validation Alerts - Fixed position to prevent layout shifts */}
                {validateData().length > 0 && alertsVisible && (
                  <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4 animate-in slide-in-from-top-5">
                    <Alert className="border-warning shadow-lg bg-card/95 backdrop-blur relative">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Advertencias detectadas:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {validateData().map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setAlertsVisible(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </Alert>
                  </div>
                )}

                {/* P&L Comparativo - Dynamic Table */}
                <div className="w-full">
                  <DynamicPLTable
                    years={viewData.years.map(y => y.year)}
                    yearStatuses={viewData.years.map(y => y.yearStatus)}
                    sections={dynamicSections}
                    onDataChange={handleDynamicDataChange}
                    onYearAdd={handleYearAdd}
                    onYearRemove={handleYearRemove}
                    onYearStatusToggle={toggleYearStatus}
                  />
                </div>

                {/* Métricas Clave y Gráficos */}
                <div className="grid lg:grid-cols-2 gap-6 min-h-[400px]">
                  {/* Key Metrics */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Métricas Clave ({viewData.years[viewData.years.length - 1].year})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium flex items-center gap-1">
                                  Margen Neto <Info className="h-3 w-3" />
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Beneficio después de todos los gastos (&gt;20% es óptimo)</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-2xl font-bold text-primary">
                            {metrics.netMargin.toFixed(1)}%
                          </div>
                          <Badge className={`${getMarginStatus(metrics.netMargin, 'net').color} justify-center`}>
                            {getMarginStatus(metrics.netMargin, 'net').label}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium flex items-center gap-1">
                                  Crecimiento <Info className="h-3 w-3" />
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Crecimiento interanual de la facturación</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className={`text-2xl font-bold ${metrics.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                          </div>
                        </div>

                        <div className="space-y-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium flex items-center gap-1">
                                  EBITDA <Info className="h-3 w-3" />
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Beneficio antes de impuestos + sueldo del socio</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-xl font-bold text-success">
                            {formatNumber(metrics.ebitda)}€
                          </div>
                        </div>

                        <div className="space-y-2 text-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium flex items-center gap-1">
                                  Facturación/Empleado <Info className="h-3 w-3" />
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Productividad por empleado (&gt;100k€ es excelente)</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-xl font-bold">
                            {formatNumber(metrics.revenuePerEmployee)}€
                          </div>
                        </div>

                        <div className="space-y-2 text-center col-span-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center justify-center gap-1">
                                <span className="text-sm font-medium flex items-center gap-1">
                                  Recurrencia <Info className="h-3 w-3" />
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>Porcentaje de ingresos recurrentes vs totales</p>
                            </TooltipContent>
                          </Tooltip>
                          <div className="text-xl font-bold text-primary">
                            {metrics.recurringPercentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts */}
                  <Card className="shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Evolución de Facturación
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ChartContainer config={{ revenue: { label: "Facturación", color: "hsl(var(--primary))" } }}>
                          <BarChart data={yearComparisonData} width={400} height={300} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                            <ChartTooltip 
                              content={<ChartTooltipContent 
                                formatter={(value) => [`${Number(value).toLocaleString('es-ES')}€`, 'Facturación']}
                              />}
                              wrapperStyle={{ 
                                zIndex: 1000,
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '6px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                              }}
                            />
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Valuation Configuration Panel */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      Configuración de Valoración
                    </CardTitle>
                    <CardDescription>
                      Personaliza los métodos y multiplicadores según tu criterio
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    
                    {/* Selector de año base para valoración */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Año base para valoración</span>
                      </div>
                      <select 
                        value={valuationConfig.baseYearForValuation}
                        onChange={(e) => setValuationConfig(prev => ({
                          ...prev,
                          baseYearForValuation: e.target.value as 'lastClosed' | 'current' | 'average2Years'
                        }))}
                        className="w-full p-2 rounded-md border border-input bg-background text-sm"
                      >
                        <option value="lastClosed">Último año cerrado</option>
                        <option value="current">Año actual / más reciente</option>
                        <option value="average2Years">Promedio últimos 2 años</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Selecciona qué dato usar como base para calcular la valoración
                      </p>
                    </div>
                    
                    {/* Toggle de sugerencias automáticas */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Info className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Mostrar ajustes sugeridos</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={valuationConfig.showSuggestions}
                          onChange={(e) => setValuationConfig(prev => ({
                            ...prev,
                            showSuggestions: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Métodos de valoración */}
                    {valuationConfig.methods.map((method, methodIndex) => (
                      <div key={method.id} className="space-y-3 p-4 border rounded-lg">
                        
                        {/* Header del método */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={method.enabled}
                              onChange={(e) => {
                                const newMethods = [...valuationConfig.methods];
                                newMethods[methodIndex].enabled = e.target.checked;
                                setValuationConfig(prev => ({ ...prev, methods: newMethods }));
                              }}
                              className="w-4 h-4 rounded border-input"
                            />
                            <Label className="text-base font-semibold cursor-pointer">{method.name}</Label>
                          </div>
                          <Badge variant={method.enabled ? "default" : "secondary"}>
                            {method.enabled ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>

                        {/* Multiplicadores */}
                        {method.enabled && (
                          <div className="space-y-2 pl-6">
                            {method.multipliers.map((mult, multIndex) => (
                              <div key={mult.id} className="flex items-center gap-3">
                                <Label className="w-28 text-sm">{mult.label}</Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={mult.value}
                                  onChange={(e) => {
                                    const newMethods = [...valuationConfig.methods];
                                    newMethods[methodIndex].multipliers[multIndex].value = parseFloat(e.target.value) || 0;
                                    newMethods[methodIndex].multipliers[multIndex].suggested = false;
                                    setValuationConfig(prev => ({ ...prev, methods: newMethods }));
                                  }}
                                  className="w-24 h-8"
                                />
                                <span className="text-sm text-muted-foreground">x</span>
                                {mult.suggested && (
                                  <Badge variant="outline" className="text-xs">
                                    Sugerido
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const newMethods = [...valuationConfig.methods];
                                    newMethods[methodIndex].multipliers.splice(multIndex, 1);
                                    setValuationConfig(prev => ({ ...prev, methods: newMethods }));
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                            
                            {/* Botón para añadir multiplicador personalizado */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newMethods = [...valuationConfig.methods];
                                const newMult: MultiplierScenario = {
                                  id: crypto.randomUUID(),
                                  label: 'Personalizado',
                                  value: 1.0,
                                  suggested: false,
                                  editable: true
                                };
                                newMethods[methodIndex].multipliers.push(newMult);
                                setValuationConfig(prev => ({ ...prev, methods: newMethods }));
                              }}
                              className="mt-2"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Añadir escenario
                            </Button>
                          </div>
                        )}

                        {/* Info sobre el valor base */}
                        {method.enabled && (() => {
                          // Determinar qué año se está usando
                          const closedYears = data.years.filter(y => y.yearStatus === 'closed');
                          const lastClosedYear = closedYears.length > 0 ? closedYears[closedYears.length - 1] : data.years[0];
                          const currentYear = data.years[data.years.length - 1];
                          
                          let displayYear = '';
                          let displayValue = 0;
                          
                          switch (valuationConfig.baseYearForValuation) {
                            case 'lastClosed':
                              displayYear = lastClosedYear.year;
                              const lastClosedMetrics = calculateMetricsForYear(lastClosedYear);
                              displayValue = method.type === 'ebitda' ? lastClosedMetrics.ebitda : lastClosedYear.totalRevenue;
                              break;
                            case 'current':
                              displayYear = currentYear.year;
                              const currentMetrics = calculateMetricsForYear(currentYear);
                              displayValue = method.type === 'ebitda' ? currentMetrics.ebitda : currentYear.totalRevenue;
                              break;
                            case 'average2Years':
                              const last2Years = data.years.slice(-2);
                              displayYear = `Promedio ${last2Years[0].year}-${last2Years[1].year}`;
                              const avgRevenue = last2Years.reduce((sum, y) => sum + y.totalRevenue, 0) / last2Years.length;
                              const avgPersonnel = last2Years.reduce((sum, y) => sum + y.personnelCosts, 0) / last2Years.length;
                              const avgOther = last2Years.reduce((sum, y) => sum + y.otherCosts, 0) / last2Years.length;
                              displayValue = method.type === 'ebitda' 
                                ? avgRevenue - avgPersonnel - avgOther 
                                : avgRevenue;
                              break;
                          }
                          
                          return (
                            <Alert className="mt-2">
                              <AlertDescription className="text-xs">
                                {method.type === 'ebitda' 
                                  ? `EBITDA (${displayYear}): ${formatNumber(displayValue)}€`
                                  : `Facturación (${displayYear}): ${formatNumber(displayValue)}€`
                                }
                              </AlertDescription>
                            </Alert>
                          );
                        })()}
                      </div>
                    ))}

                    {/* Botón para recalcular */}
                    <Button 
                      onClick={calculateValuations}
                      className="w-full"
                      variant="default"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Recalcular Valoraciones
                    </Button>
                  </CardContent>
                </Card>

                {/* Valuation Results */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Resultados de Valoración
                    </CardTitle>
                    <CardDescription>
                      Escenarios calculados según tu configuración
                      {valuationConfig.showSuggestions && (
                        <span className="text-primary ml-1">(con ajustes automáticos)</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {valuations.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          Activa al menos un método de valoración para ver resultados
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {valuations.map((valuation, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border"
                            >
                              <div className="flex-1">
                                <div className="font-medium">{valuation.method}</div>
                                <div className="text-sm text-muted-foreground">
                                  Múltiplo: {valuation.multiplier.toFixed(2)}x
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-primary">
                                  {formatNumber(valuation.valuationAmount)}€
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Separator className="my-4" />
                        
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Mínima</div>
                            <div className="text-lg font-bold">
                              {formatNumber(Math.min(...valuations.map(v => v.valuationAmount)))}€
                            </div>
                          </div>
                          
                          <div className="text-center p-3 bg-primary/10 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Media</div>
                            <div className="text-xl font-bold text-primary">
                              {formatNumber(valuations.reduce((sum, v) => sum + v.valuationAmount, 0) / valuations.length)}€
                            </div>
                          </div>
                          
                          <div className="text-center p-3 bg-muted/30 rounded-lg">
                            <div className="text-xs text-muted-foreground mb-1">Máxima</div>
                            <div className="text-lg font-bold">
                              {formatNumber(Math.max(...valuations.map(v => v.valuationAmount)))}€
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Ayudar a Vender Button - Conditional based on valuation type */}
                {valuation.valuation_type === 'client_business' && (
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Handshake className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>¿Tu Cliente Quiere Vender?</CardTitle>
                          <CardDescription>
                            Genera comisiones ayudándole a vender su empresa con Capittal
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Comisión competitiva</p>
                            <p className="text-muted-foreground">Hasta un 5% del valor de la operación</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Sin costes adicionales</p>
                            <p className="text-muted-foreground">Solo cobras si la venta se cierra</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Proceso transparente</p>
                            <p className="text-muted-foreground">Seguimiento en tiempo real del progreso</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => setShowCollaborationDialog(true)}
                      >
                        <Handshake className="mr-2 h-5 w-5" />
                        Ayudar a Vender Esta Empresa
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {valuation.valuation_type === 'own_business' && (
                  <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-lg">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Handshake className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle>¿Quieres Vender Tu Despacho?</CardTitle>
                          <CardDescription>
                            Capittal te ayuda a vender tu despacho al mejor precio
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3">
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Valoración profesional</p>
                            <p className="text-muted-foreground">Análisis completo del valor de tu negocio</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Red de compradores</p>
                            <p className="text-muted-foreground">Acceso a inversores y compradores cualificados</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium">Proceso confidencial</p>
                            <p className="text-muted-foreground">Garantizamos discreción en todo momento</p>
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        size="lg" 
                        className="w-full"
                        onClick={() => setShowCollaborationDialog(true)}
                      >
                        <Handshake className="mr-2 h-5 w-5" />
                        Quiero Vender Mi Despacho, Ayúdame!
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
        </div>

        {/* Collaboration Dialog */}
        <Dialog open={showCollaborationDialog} onOpenChange={setShowCollaborationDialog}>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>
                {valuation.valuation_type === 'own_business' 
                  ? 'Solicitar Ayuda para Vender Mi Despacho'
                  : 'Solicitar Ayuda para Vender'}
              </DialogTitle>
              <DialogDescription>
                {valuation.valuation_type === 'own_business'
                  ? 'Enviaremos tu solicitud a Samuel y Lluis de Capittal junto con los datos de tu despacho'
                  : 'Enviaremos tu solicitud a Samuel y Lluis de Capittal junto con los datos de esta valoración'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="text-sm font-medium mb-3">Datos que se enviarán:</div>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empresa:</span>
                    <span className="font-medium">
                      {valuation.valuation_type === 'client_business' 
                        ? (valuation.client_company || valuation.title)
                        : valuation.valuation_type === 'potential_acquisition'
                        ? (valuation.target_company_name || valuation.title)
                        : valuation.title}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sector:</span>
                    <span className="font-medium">{valuation.target_industry || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facturación:</span>
                    <span className="font-medium">{formatCurrency(viewData.years[0]?.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valoración Media:</span>
                    <span className="font-medium text-primary">
                      {valuations.length > 0 
                        ? formatCurrency(valuations.reduce((sum, v) => sum + v.valuationAmount, 0) / valuations.length)
                        : 'No calculada'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  value={collaborationNotes}
                  onChange={(e) => setCollaborationNotes(e.target.value)}
                  placeholder="¿Algo más que deberíamos saber sobre este caso? Situación especial, urgencia, expectativas del cliente..."
                  rows={4}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCollaborationDialog(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleRequestCollaboration} 
                disabled={submitting}
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
};

export default ValuationCalculator;
export type { ValuationCalculatorProps };