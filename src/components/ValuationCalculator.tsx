import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, TrendingUp, Users, Euro, AlertTriangle, Info, Plus, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { DynamicPLTable, type RowData, type TableSection } from "@/components/valuation/DynamicPLTable";
import { Valuation } from "@/hooks/useValuations";


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
        year: val.year_1 || currentYear.toString(),
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
        year: val.year_2 || (currentYear + 1).toString(),
        yearStatus: 'closed',
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
  const [data, setData] = useState<FinancialData>(() => 
    mapValuationToFinancialData(valuation)
  );

  const [valuations, setValuations] = useState<ValuationResult[]>([]);
  
  // Debounced data for charts to prevent jumping
  const [debouncedData, setDebouncedData] = useState<FinancialData>(data);
  
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
  
  // Dynamic table state
  const [dynamicSections, setDynamicSections] = useState<TableSection[]>(() => {
    // Initialize dynamic sections from existing data
    return [
      {
        id: 'revenue-section',
        title: 'INGRESOS',
        editable: false,
        rows: [
          {
            id: 'total-revenue',
            label: 'Facturación Total',
            type: 'input' as const,
            category: 'revenue' as const,
            indented: false,
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: y.totalRevenue }), {})
          },
          {
            id: 'fiscal-recurring',
            label: 'Servicios Fiscales',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: y.fiscalRecurringPercent }), {})
          },
          {
            id: 'accounting-recurring',
            label: 'Servicios Contables',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: y.accountingRecurringPercent }), {})
          },
          {
            id: 'labor-recurring',
            label: 'Servicios Laborales',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: y.laborRecurringPercent }), {})
          },
          {
            id: 'other-revenue',
            label: 'Otros Servicios',
            type: 'percentage' as const,
            category: 'revenue' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: y.otherRevenuePercent }), {})
          }
        ]
      },
      {
        id: 'costs-section',
        title: 'COSTES',
        editable: false,
        rows: [
          {
            id: 'personnel-costs',
            label: 'Costes de Personal',
            type: 'percentage' as const,
            category: 'cost' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => {
              const percentage = y.totalRevenue ? (y.personnelCosts / y.totalRevenue) * 100 : 0;
              return { ...acc, [y.year]: percentage };
            }, {})
          },
          {
            id: 'other-costs',
            label: 'Otros Costes Operativos',
            type: 'percentage' as const,
            category: 'cost' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => {
              const percentage = y.totalRevenue ? (y.otherCosts / y.totalRevenue) * 100 : 0;
              return { ...acc, [y.year]: percentage };
            }, {})
          },
          {
            id: 'owner-salary',
            label: 'Sueldo Propiedad',
            type: 'percentage' as const,
            category: 'cost' as const,
            indented: true,
            percentageOf: 'total-revenue',
            values: data.years.reduce((acc, y) => {
              const percentage = y.totalRevenue ? (y.ownerSalary / y.totalRevenue) * 100 : 0;
              return { ...acc, [y.year]: percentage };
            }, {})
          }
        ]
      },
      {
        id: 'results-section',
        title: 'RESULTADOS',
        editable: false,
        rows: [
          {
            id: 'employees',
            label: 'Nº Trabajadores',
            type: 'input' as const,
            category: 'result' as const,
            indented: true,
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: y.numberOfEmployees }), {})
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
            label: 'EBITDA',
            type: 'calculated' as const,
            category: 'result' as const,
            indented: true,
            values: {},
            formula: (yearData: Record<string, number>) => {
              const totalRevenue = yearData['total-revenue'] || 0;
              const personnelCosts = yearData['personnel-costs'] || 0;
              const otherCosts = yearData['other-costs'] || 0;
              return totalRevenue - personnelCosts - otherCosts;
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
      }
    ];
  });

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
    const latestYear = data.years[data.years.length - 1];
    const previousYear = data.years[data.years.length - 2];
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
    
    const closedYears = data.years.filter(y => y.yearStatus === 'closed');
    const lastClosedYear = closedYears.length > 0 ? closedYears[closedYears.length - 1] : data.years[0];
    const currentYear = data.years[data.years.length - 1];
    
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
        const last2Years = data.years.slice(-2);
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
          if (data.years.length > 1) {
            const previousYear = data.years[data.years.length - 2];
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
  }, [data, valuationConfig]);

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

  const updateYearData = (yearIndex: number, field: keyof YearData, value: number) => {
    setData(prev => ({
      years: prev.years.map((year, index) =>
        index === yearIndex ? { ...year, [field]: value } : year
      )
    }));
  };

  const handleInputChange = (yearIndex: number, field: keyof YearData, value: string) => {
    const cleanValue = value.replace(/[^\d.]/g, '');
    const numValue = parseNumber(cleanValue);
    updateYearData(yearIndex, field, numValue);
  };

  const handlePercentageChange = (yearIndex: number, field: keyof YearData, value: string) => {
    if (value === '') {
      updateYearData(yearIndex, field, 0);
      return;
    }
    
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue);
    
    if (!isNaN(numValue)) {
      const cappedValue = Math.min(Math.max(numValue, 0), 100);
      updateYearData(yearIndex, field, cappedValue);
    }
  };

  const addFutureYear = () => {
    const latestYear = data.years[data.years.length - 1];
    const newYear = (parseInt(latestYear.year) + 1).toString();
    setData(prev => ({
      years: [...prev.years, { ...latestYear, year: newYear, yearStatus: 'projected' }]
    }));
  };

  const addPastYear = () => {
    const firstYear = data.years[0];
    const newYear = (parseInt(firstYear.year) - 1).toString();
    setData(prev => ({
      years: [{ ...firstYear, year: newYear, yearStatus: 'closed' }, ...prev.years]
    }));
  };
  
  const toggleYearStatus = (yearIndex: number) => {
    setData(prev => ({
      years: prev.years.map((year, index) =>
        index === yearIndex 
          ? { ...year, yearStatus: year.yearStatus === 'closed' ? 'projected' : 'closed' }
          : year
      )
    }));
  };

  const removeYear = (yearIndex: number) => {
    if (data.years.length > 2) {
      setData(prev => ({
        years: prev.years.filter((_, index) => index !== yearIndex)
      }));
    }
  };

  // Sincronizar cambios a Supabase
  const syncToValuation = (updatedYears: YearData[]) => {
    if (updatedYears.length >= 2) {
      const year1 = updatedYears[0];
      const year2 = updatedYears[1];
      
      onUpdate('year_1', year1.year);
      onUpdate('revenue_1', year1.totalRevenue);
      onUpdate('fiscal_recurring_1', year1.fiscalRecurringPercent);
      onUpdate('accounting_recurring_1', year1.accountingRecurringPercent);
      onUpdate('labor_recurring_1', year1.laborRecurringPercent);
      onUpdate('other_revenue_1', year1.otherRevenuePercent);
      onUpdate('personnel_costs_1', year1.personnelCosts);
      onUpdate('other_costs_1', year1.otherCosts);
      onUpdate('owner_salary_1', year1.ownerSalary);
      onUpdate('employees_1', year1.numberOfEmployees);
      
      onUpdate('year_2', year2.year);
      onUpdate('revenue_2', year2.totalRevenue);
      onUpdate('fiscal_recurring_2', year2.fiscalRecurringPercent);
      onUpdate('accounting_recurring_2', year2.accountingRecurringPercent);
      onUpdate('labor_recurring_2', year2.laborRecurringPercent);
      onUpdate('other_revenue_2', year2.otherRevenuePercent);
      onUpdate('personnel_costs_2', year2.personnelCosts);
      onUpdate('other_costs_2', year2.otherCosts);
      onUpdate('owner_salary_2', year2.ownerSalary);
      onUpdate('employees_2', year2.numberOfEmployees);
    }
  };

  // Sincronizar estado local cuando cambie la prop valuation
  useEffect(() => {
    setData(mapValuationToFinancialData(valuation));
  }, [valuation]);

  // Dynamic table handlers
  const handleDynamicDataChange = (newSections: TableSection[]) => {
    setDynamicSections(newSections);
    
    // Sync back to original data structure for calculations
    const updatedYears = data.years.map(year => {
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

      return {
        ...year,
        totalRevenue,
        fiscalRecurringPercent: fiscalRow?.values[year.year] || 0,
        accountingRecurringPercent: accountingRow?.values[year.year] || 0,
        laborRecurringPercent: laborRow?.values[year.year] || 0,
        otherRevenuePercent: otherRevenueRow?.values[year.year] || 0,
        personnelCosts,
        otherCosts,
        ownerSalary,
        numberOfEmployees: employeesRow?.values[year.year] || 0,
      };
    });

    setData({ years: updatedYears });
    
    // Propagar cambios a Supabase
    syncToValuation(updatedYears);
  };

  const handleYearAdd = (type: 'past' | 'future') => {
    if (type === 'future') {
      addFutureYear();
    } else {
      addPastYear();
    }
    
    // Update dynamic sections with new year
    setTimeout(() => {
      setDynamicSections(prevSections => 
        prevSections.map(section => ({
          ...section,
          rows: section.rows.map(row => ({
            ...row,
            values: data.years.reduce((acc, y) => ({ ...acc, [y.year]: row.values[y.year] || 0 }), {})
          }))
        }))
      );
    }, 0);
  };

  const handleYearRemove = (yearIndex: number) => {
    removeYear(yearIndex);
    
    // Update dynamic sections to remove year
    setTimeout(() => {
      const removedYear = data.years[yearIndex]?.year;
      if (removedYear) {
        setDynamicSections(prevSections =>
          prevSections.map(section => ({
            ...section,
            rows: section.rows.map(row => {
              const { [removedYear]: _, ...remainingValues } = row.values;
              return { ...row, values: remainingValues };
            })
          }))
        );
      }
    }, 0);
  };

  const calculateVariation = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const validateData = () => {
    const issues: string[] = [];
    
    data.years.forEach((yearData, index) => {
      const totalRecurringPercent = yearData.fiscalRecurringPercent + yearData.accountingRecurringPercent + 
                                     yearData.laborRecurringPercent + yearData.otherRevenuePercent;
      const yearMetrics = calculateMetricsForYear(yearData);
      
      if (yearMetrics.totalCosts >= yearData.totalRevenue) {
        issues.push(`${yearData.year}: Los costes superan los ingresos`);
      }
      if (totalRecurringPercent > 100) {
        issues.push(`${yearData.year}: Los porcentajes de facturación recurrente superan el 100%`);
      }
      if (yearData.numberOfEmployees === 0) {
        issues.push(`${yearData.year}: Número de empleados no puede ser cero`);
      }

      if (index > 0) {
        const previousYear = data.years[index - 1];
        const growth = ((yearData.totalRevenue - previousYear.totalRevenue) / previousYear.totalRevenue) * 100;
        if (growth < -20) {
          issues.push(`${yearData.year}: Decrecimiento muy alto (-${Math.abs(growth).toFixed(1)}%)`);
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
                {/* Validation Alerts - Fixed height to prevent layout shifts */}
                <div className="min-h-14">
                  {validateData().length > 0 && (
                    <Alert className="border-warning">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Advertencias detectadas:</strong>
                        <ul className="mt-1 list-disc list-inside">
                          {validateData().map((issue, index) => (
                            <li key={index}>{issue}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* P&L Comparativo - Dynamic Table */}
                <div className="w-full">
                  <DynamicPLTable
                    years={data.years.map(y => y.year)}
                    yearStatuses={data.years.map(y => y.yearStatus)}
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
                        Métricas Clave ({data.years[data.years.length - 1].year})
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
              </div>
            </div>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ValuationCalculator;
export type { ValuationCalculatorProps };