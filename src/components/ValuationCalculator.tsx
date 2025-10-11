import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, Users, Euro, AlertTriangle, Info, PieChart, BarChart3, ClipboardCheck, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import DCFCalculator from "./DCFCalculator";
import ComparableMultiples from "./ComparableMultiples";
import DueDiligenceChecklist from "./DueDiligenceChecklist";
import FinancialDataIntegrator from "./FinancialDataIntegrator";
import DataImporter from "./DataImporter";
import AlertSystem from "./AlertSystem";
import ZapierIntegration from "./ZapierIntegration";

interface YearData {
  year: string;
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

const ValuationCalculator = () => {
  const [data, setData] = useState<FinancialData>({
    years: [
      {
        year: "2023",
        totalRevenue: 625000,
        fiscalRecurringPercent: 28.85,
        accountingRecurringPercent: 19.23,
        laborRecurringPercent: 11.54,
        otherRevenuePercent: 0.48,
        personnelCosts: 400000,
        otherCosts: 50000,
        ownerSalary: 45000,
        numberOfEmployees: 8,
      },
      {
        year: "2024",
        totalRevenue: 1040000,
        fiscalRecurringPercent: 28.85,
        accountingRecurringPercent: 19.23,
        laborRecurringPercent: 11.54,
        otherRevenuePercent: 0.48,
        personnelCosts: 450000,
        otherCosts: 62500,
        ownerSalary: 50000,
        numberOfEmployees: 9,
      }
    ]
  });

  const [valuations, setValuations] = useState<ValuationResult[]>([]);

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
    const metrics = calculateMetrics();
    const latestYear = data.years[data.years.length - 1];
    
    // Valoración por múltiplos basada en los datos del Excel
    const valuationsByRevenue: ValuationResult[] = [
      { valuationAmount: latestYear.totalRevenue * 0.7, multiplier: 0.7, method: "Conservador" },
      { valuationAmount: latestYear.totalRevenue * 0.8, multiplier: 0.8, method: "Moderado" },
      { valuationAmount: latestYear.totalRevenue * 0.9, multiplier: 0.9, method: "Optimista" },
      { valuationAmount: latestYear.totalRevenue * 1.0, multiplier: 1.0, method: "Agresivo" },
      { valuationAmount: latestYear.totalRevenue * 1.1, multiplier: 1.1, method: "Premium" },
    ];

    // Ajustes basados en márgenes
    const adjustedValuations = valuationsByRevenue.map(valuation => {
      let adjustment = 1;
      
      // Ajuste por margen neto
      if (metrics.netMargin > 30) adjustment += 0.1;
      else if (metrics.netMargin < 10) adjustment -= 0.1;
      
      // Ajuste por tamaño
      if (latestYear.totalRevenue >= 1000000) adjustment += 0.05;
      
      return {
        ...valuation,
        valuationAmount: valuation.valuationAmount * adjustment
      };
    });

    setValuations(adjustedValuations);
  };

  useEffect(() => {
    calculateValuations();
  }, [data]);

  const metrics = calculateMetrics();

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
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Función para parsear números con separadores de miles
  const parseNumber = (value: string): number => {
    return parseFloat(value.replace(/\./g, '')) || 0;
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

  const addYear = () => {
    const latestYear = data.years[data.years.length - 1];
    const newYear = (parseInt(latestYear.year) + 1).toString();
    setData(prev => ({
      years: [...prev.years, { ...latestYear, year: newYear }]
    }));
  };

  const removeYear = (yearIndex: number) => {
    if (data.years.length > 2) {
      setData(prev => ({
        years: prev.years.filter((_, index) => index !== yearIndex)
      }));
    }
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

  const latestYear = data.years[data.years.length - 1];
  
  const revenueCompositionData = [
    { name: "Fiscal", value: (latestYear.totalRevenue * latestYear.fiscalRecurringPercent) / 100, fill: "hsl(var(--chart-1))" },
    { name: "Contable", value: (latestYear.totalRevenue * latestYear.accountingRecurringPercent) / 100, fill: "hsl(var(--chart-2))" },
    { name: "Laboral", value: (latestYear.totalRevenue * latestYear.laborRecurringPercent) / 100, fill: "hsl(var(--chart-3))" },
    { name: "Otros", value: (latestYear.totalRevenue * latestYear.otherRevenuePercent) / 100, fill: "hsl(var(--chart-4))" },
  ].filter(item => item.value > 0);

  const yearComparisonData = data.years.map(year => ({
    year: year.year,
    revenue: year.totalRevenue
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <TooltipProvider>
        <div className="container mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Valoración Empresarial</h1>
            <p className="text-muted-foreground">Herramienta especializada para valoración de consultorías</p>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Valoración Básica
              </TabsTrigger>
              <TabsTrigger value="dcf" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                DCF Avanzado
              </TabsTrigger>
              <TabsTrigger value="multiples" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Múltiplos Sector
              </TabsTrigger>
              <TabsTrigger value="duediligence" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Due Diligence
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Integraciones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <div className="space-y-6 max-w-[95vw] mx-auto px-4">
                {/* Validation Alerts */}
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

                {/* P&L Comparativo */}
                <Card className="shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Euro className="h-5 w-5" />
                        P&L Comparativo Multi-año
                      </CardTitle>
                      <Button onClick={addYear} size="sm" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Añadir Año
                      </Button>
                    </div>
                    <CardDescription>
                      Análisis comparativo de ingresos, costes y márgenes por año
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-3 font-medium text-sm border-r">Concepto</th>
                            {data.years.map((year, index) => (
                              <th key={year.year} className="text-right p-3 font-medium text-sm border-r">
                                <div className="flex items-center justify-between gap-2">
                                  <span>{year.year}</span>
                                  {data.years.length > 2 && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeYear(index)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </th>
                            ))}
                            {data.years.length > 1 && (
                              <th className="text-right p-3 font-medium text-sm">Var %</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {/* INGRESOS */}
                          <tr className="bg-muted/30">
                            <td colSpan={data.years.length + 2} className="p-2 font-bold text-sm">
                              INGRESOS
                            </td>
                          </tr>
                          <tr className="border-t">
                            <td className="p-3 text-sm border-r">Facturación Total</td>
                            {data.years.map((year, index) => (
                              <td key={year.year} className="p-2 text-right border-r">
                                <Input
                                  type="text"
                                  value={formatNumber(year.totalRevenue)}
                                  onChange={(e) => handleInputChange(index, 'totalRevenue', e.target.value)}
                                  className="font-mono h-8 text-right"
                                />
                              </td>
                            ))}
                            {data.years.length > 1 && (
                              <td className="p-3 text-right font-mono text-sm">
                                {(() => {
                                  const last = data.years[data.years.length - 1];
                                  const prev = data.years[data.years.length - 2];
                                  const variation = calculateVariation(last.totalRevenue, prev.totalRevenue);
                                  return (
                                    <span className={variation >= 0 ? 'text-success' : 'text-destructive'}>
                                      {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                                    </span>
                                  );
                                })()}
                              </td>
                            )}
                          </tr>

                          {/* Servicios Recurrentes */}
                          <tr className="border-t bg-muted/10">
                            <td className="p-3 text-sm pl-6 border-r">Servicios Fiscales</td>
                            {data.years.map((year, index) => {
                              const amount = (year.totalRevenue * year.fiscalRecurringPercent) / 100;
                              return (
                                <td key={year.year} className="p-2 text-right border-r">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Input
                                      type="text"
                                      value={year.fiscalRecurringPercent || ''}
                                      onChange={(e) => handlePercentageChange(index, 'fiscalRecurringPercent', e.target.value)}
                                      className="font-mono h-8 w-16 text-right"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-muted-foreground">%</span>
                                    <span className="font-mono text-sm ml-2">{formatNumber(amount)}</span>
                                  </div>
                                </td>
                              );
                            })}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t bg-muted/10">
                            <td className="p-3 text-sm pl-6 border-r">Servicios Contables</td>
                            {data.years.map((year, index) => {
                              const amount = (year.totalRevenue * year.accountingRecurringPercent) / 100;
                              return (
                                <td key={year.year} className="p-2 text-right border-r">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Input
                                      type="text"
                                      value={year.accountingRecurringPercent || ''}
                                      onChange={(e) => handlePercentageChange(index, 'accountingRecurringPercent', e.target.value)}
                                      className="font-mono h-8 w-16 text-right"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-muted-foreground">%</span>
                                    <span className="font-mono text-sm ml-2">{formatNumber(amount)}</span>
                                  </div>
                                </td>
                              );
                            })}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t bg-muted/10">
                            <td className="p-3 text-sm pl-6 border-r">Servicios Laborales</td>
                            {data.years.map((year, index) => {
                              const amount = (year.totalRevenue * year.laborRecurringPercent) / 100;
                              return (
                                <td key={year.year} className="p-2 text-right border-r">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Input
                                      type="text"
                                      value={year.laborRecurringPercent || ''}
                                      onChange={(e) => handlePercentageChange(index, 'laborRecurringPercent', e.target.value)}
                                      className="font-mono h-8 w-16 text-right"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-muted-foreground">%</span>
                                    <span className="font-mono text-sm ml-2">{formatNumber(amount)}</span>
                                  </div>
                                </td>
                              );
                            })}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t bg-muted/10">
                            <td className="p-3 text-sm pl-6 border-r">Otros Servicios</td>
                            {data.years.map((year, index) => {
                              const amount = (year.totalRevenue * year.otherRevenuePercent) / 100;
                              return (
                                <td key={year.year} className="p-2 text-right border-r">
                                  <div className="flex items-center gap-1 justify-end">
                                    <Input
                                      type="text"
                                      value={year.otherRevenuePercent || ''}
                                      onChange={(e) => handlePercentageChange(index, 'otherRevenuePercent', e.target.value)}
                                      className="font-mono h-8 w-16 text-right"
                                      placeholder="0"
                                    />
                                    <span className="text-xs text-muted-foreground">%</span>
                                    <span className="font-mono text-sm ml-2">{formatNumber(amount)}</span>
                                  </div>
                                </td>
                              );
                            })}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t bg-muted/30 font-semibold">
                            <td className="p-3 text-sm pl-6 border-r">Total Ingresos Recurrentes</td>
                            {data.years.map((year) => {
                              const metrics = calculateMetricsForYear(year);
                              return (
                                <td key={year.year} className="p-3 text-right font-mono text-sm border-r">
                                  {formatNumber(metrics.totalRecurring)}
                                </td>
                              );
                            })}
                            {data.years.length > 1 && (
                              <td className="p-3 text-right font-mono text-sm">
                                {(() => {
                                  const lastMetrics = calculateMetricsForYear(data.years[data.years.length - 1]);
                                  const prevMetrics = calculateMetricsForYear(data.years[data.years.length - 2]);
                                  const variation = calculateVariation(lastMetrics.totalRecurring, prevMetrics.totalRecurring);
                                  return (
                                    <span className={variation >= 0 ? 'text-success' : 'text-destructive'}>
                                      {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                                    </span>
                                  );
                                })()}
                              </td>
                            )}
                          </tr>

                          <tr className="border-t bg-muted/10">
                            <td className="p-3 text-sm pl-6 border-r">Otros Ingresos</td>
                            {data.years.map((year) => {
                              const metrics = calculateMetricsForYear(year);
                              return (
                                <td key={year.year} className="p-3 text-right font-mono text-sm border-r">
                                  {formatNumber(metrics.otherIncome)}
                                </td>
                              );
                            })}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          {/* COSTES */}
                          <tr className="bg-muted/30 border-t">
                            <td colSpan={data.years.length + 2} className="p-2 font-bold text-sm">
                              COSTES
                            </td>
                          </tr>

                          <tr className="border-t">
                            <td className="p-3 text-sm pl-6 border-r">Costes de Personal</td>
                            {data.years.map((year, index) => (
                              <td key={year.year} className="p-2 text-right border-r">
                                <Input
                                  type="text"
                                  value={formatNumber(year.personnelCosts)}
                                  onChange={(e) => handleInputChange(index, 'personnelCosts', e.target.value)}
                                  className="font-mono h-8 text-right"
                                />
                              </td>
                            ))}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t">
                            <td className="p-3 text-sm pl-6 border-r">Otros Costes Operativos</td>
                            {data.years.map((year, index) => (
                              <td key={year.year} className="p-2 text-right border-r">
                                <Input
                                  type="text"
                                  value={formatNumber(year.otherCosts)}
                                  onChange={(e) => handleInputChange(index, 'otherCosts', e.target.value)}
                                  className="font-mono h-8 text-right"
                                />
                              </td>
                            ))}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t">
                            <td className="p-3 text-sm pl-6 border-r">Sueldo Propiedad</td>
                            {data.years.map((year, index) => (
                              <td key={year.year} className="p-2 text-right border-r">
                                <Input
                                  type="text"
                                  value={formatNumber(year.ownerSalary)}
                                  onChange={(e) => handleInputChange(index, 'ownerSalary', e.target.value)}
                                  className="font-mono h-8 text-right"
                                />
                              </td>
                            ))}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t bg-muted/30 font-semibold">
                            <td className="p-3 text-sm pl-6 border-r">Total Costes</td>
                            {data.years.map((year) => {
                              const metrics = calculateMetricsForYear(year);
                              return (
                                <td key={year.year} className="p-3 text-right font-mono text-sm border-r">
                                  {formatNumber(metrics.totalCosts)}
                                </td>
                              );
                            })}
                            {data.years.length > 1 && (
                              <td className="p-3 text-right font-mono text-sm">
                                {(() => {
                                  const lastMetrics = calculateMetricsForYear(data.years[data.years.length - 1]);
                                  const prevMetrics = calculateMetricsForYear(data.years[data.years.length - 2]);
                                  const variation = calculateVariation(lastMetrics.totalCosts, prevMetrics.totalCosts);
                                  return (
                                    <span className={variation >= 0 ? 'text-destructive' : 'text-success'}>
                                      {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                                    </span>
                                  );
                                })()}
                              </td>
                            )}
                          </tr>

                          {/* RESULTADOS */}
                          <tr className="bg-muted/30 border-t">
                            <td colSpan={data.years.length + 2} className="p-2 font-bold text-sm">
                              RESULTADOS
                            </td>
                          </tr>

                          <tr className="border-t bg-primary/10 font-bold">
                            <td className="p-3 text-sm pl-6 border-r">EBITDA</td>
                            {data.years.map((year) => {
                              const metrics = calculateMetricsForYear(year);
                              return (
                                <td key={year.year} className="p-3 text-right font-mono text-sm text-primary border-r">
                                  {formatNumber(metrics.ebitda)}
                                </td>
                              );
                            })}
                            {data.years.length > 1 && (
                              <td className="p-3 text-right font-mono text-sm">
                                {(() => {
                                  const lastMetrics = calculateMetricsForYear(data.years[data.years.length - 1]);
                                  const prevMetrics = calculateMetricsForYear(data.years[data.years.length - 2]);
                                  const variation = calculateVariation(lastMetrics.ebitda, prevMetrics.ebitda);
                                  return (
                                    <span className={variation >= 0 ? 'text-success' : 'text-destructive'}>
                                      {variation >= 0 ? '+' : ''}{variation.toFixed(1)}%
                                    </span>
                                  );
                                })()}
                              </td>
                            )}
                          </tr>

                          <tr className="border-t">
                            <td className="p-3 text-sm pl-6 border-r">Margen EBITDA %</td>
                            {data.years.map((year) => {
                              const metrics = calculateMetricsForYear(year);
                              const ebitdaMargin = (metrics.ebitda / year.totalRevenue) * 100;
                              return (
                                <td key={year.year} className="p-3 text-right font-mono text-sm border-r">
                                  {ebitdaMargin.toFixed(1)}%
                                </td>
                              );
                            })}
                            {data.years.length > 1 && <td></td>}
                          </tr>

                          <tr className="border-t">
                            <td className="p-3 text-sm pl-6 border-r">Nº Trabajadores</td>
                            {data.years.map((year, index) => (
                              <td key={year.year} className="p-2 text-right border-r">
                                <Input
                                  type="text"
                                  value={formatNumber(year.numberOfEmployees)}
                                  onChange={(e) => handleInputChange(index, 'numberOfEmployees', e.target.value)}
                                  className="font-mono h-8 text-right"
                                />
                              </td>
                            ))}
                            {data.years.length > 1 && <td></td>}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Métricas Clave y Gráficos */}
                <div className="grid lg:grid-cols-2 gap-6">
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
                            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Valuation Results */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Valoraciones por Múltiplos
                    </CardTitle>
                    <CardDescription>
                      Diferentes escenarios de valoración basados en múltiplos del sector
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {valuations.map((valuation, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border"
                        >
                          <div>
                            <div className="font-medium">{valuation.method}</div>
                            <div className="text-sm text-muted-foreground">
                              Múltiplo: {valuation.multiplier}x
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
                    
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Valoración Media Ponderada</div>
                      <div className="text-2xl font-bold text-primary">
                        {formatNumber(valuations.reduce((sum, v) => sum + v.valuationAmount, 0) / valuations.length)}€
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="dcf">
              <DCFCalculator />
            </TabsContent>

            <TabsContent value="multiples">
              <ComparableMultiples />
            </TabsContent>

            <TabsContent value="duediligence">
              <DueDiligenceChecklist />
            </TabsContent>

            <TabsContent value="integrations">
              <Tabs defaultValue="data-integrator" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="data-integrator">APIs Financieras</TabsTrigger>
                  <TabsTrigger value="data-importer">Importar Datos</TabsTrigger>
                  <TabsTrigger value="alerts">Alertas</TabsTrigger>
                  <TabsTrigger value="zapier">Zapier</TabsTrigger>
                </TabsList>

                <TabsContent value="data-integrator">
                  <FinancialDataIntegrator />
                </TabsContent>

                <TabsContent value="data-importer">
                  <DataImporter />
                </TabsContent>

                <TabsContent value="alerts">
                  <AlertSystem />
                </TabsContent>

                <TabsContent value="zapier">
                  <ZapierIntegration />
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </div>
      </TooltipProvider>
    </div>
  );
};

export default ValuationCalculator;