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

  // Función para formatear números con separadores de miles
  const formatNumber = (value: number): string => {
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
              <div className="space-y-8 max-w-7xl mx-auto px-4">
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

      <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {/* Input Panel */}
        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Datos Financieros
              </CardTitle>
              <CardDescription>
                Introduce los datos financieros del despacho para calcular la valoración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="revenue2024" className="flex items-center gap-1">
                        Facturación 2024 (€) <Info className="h-3 w-3" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ingresos totales del año 2024, incluyendo todos los servicios</p>
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    id="revenue2024"
                    type="text"
                    value={formatNumber(data.totalRevenue2024)}
                    onChange={(e) => handleInputChange('totalRevenue2024', e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="revenue2023" className="flex items-center gap-1">
                        Facturación 2023 (€) <Info className="h-3 w-3" />
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ingresos del año anterior para calcular el crecimiento</p>
                    </TooltipContent>
                  </Tooltip>
                  <Input
                    id="revenue2023"
                    type="text"
                    value={formatNumber(data.totalRevenue2023)}
                    onChange={(e) => handleInputChange('totalRevenue2023', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Composición Facturación Recurrente</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Concepto</th>
                        <th className="text-right p-3 font-medium text-sm">%</th>
                        <th className="text-right p-3 font-medium text-sm">Importe (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 text-sm">Servicios Fiscales</td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block w-24">
                            <Input
                              id="fiscal"
                              type="text"
                              value={data.fiscalRecurringPercent || ''}
                              onChange={(e) => handlePercentageChange('fiscalRecurringPercent', e.target.value)}
                              placeholder="0"
                              className="font-mono text-sm pr-6 h-8 text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatNumber((data.totalRevenue2024 * data.fiscalRecurringPercent) / 100)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm">Servicios Contables</td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block w-24">
                            <Input
                              id="accounting"
                              type="text"
                              value={data.accountingRecurringPercent || ''}
                              onChange={(e) => handlePercentageChange('accountingRecurringPercent', e.target.value)}
                              placeholder="0"
                              className="font-mono text-sm pr-6 h-8 text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatNumber((data.totalRevenue2024 * data.accountingRecurringPercent) / 100)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm">Servicios Laborales</td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block w-24">
                            <Input
                              id="labor"
                              type="text"
                              value={data.laborRecurringPercent || ''}
                              onChange={(e) => handlePercentageChange('laborRecurringPercent', e.target.value)}
                              placeholder="0"
                              className="font-mono text-sm pr-6 h-8 text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatNumber((data.totalRevenue2024 * data.laborRecurringPercent) / 100)}
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm">Otros Servicios</td>
                        <td className="p-3 text-right">
                          <div className="relative inline-block w-24">
                            <Input
                              id="other"
                              type="text"
                              value={data.otherRevenuePercent || ''}
                              onChange={(e) => handlePercentageChange('otherRevenuePercent', e.target.value)}
                              placeholder="0"
                              className="font-mono text-sm pr-6 h-8 text-right"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatNumber((data.totalRevenue2024 * data.otherRevenuePercent) / 100)}
                        </td>
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="p-3 text-sm">Total Facturación Recurrente</td>
                        <td className="p-3 text-right font-mono text-sm">
                          {(data.fiscalRecurringPercent + data.accountingRecurringPercent + data.laborRecurringPercent + data.otherRevenuePercent).toFixed(1)}%
                        </td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatNumber(
                            (data.totalRevenue2024 * (data.fiscalRecurringPercent + data.accountingRecurringPercent + data.laborRecurringPercent + data.otherRevenuePercent)) / 100
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium">Estructura de Costes</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm">Concepto</th>
                        <th className="text-right p-3 font-medium text-sm">Importe (€)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-3 text-sm">Costes de Personal</td>
                        <td className="p-3 text-right">
                          <Input
                            id="personnelCosts"
                            type="text"
                            value={formatNumber(data.personnelCosts)}
                            onChange={(e) => handleInputChange('personnelCosts', e.target.value)}
                            className="font-mono h-8 w-40 ml-auto text-right"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm">Otros Costes Operativos</td>
                        <td className="p-3 text-right">
                          <Input
                            id="otherCosts"
                            type="text"
                            value={formatNumber(data.otherCosts)}
                            onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                            className="font-mono h-8 w-40 ml-auto text-right"
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 text-sm">Sueldo Propiedad</td>
                        <td className="p-3 text-right">
                          <Input
                            id="ownerSalary"
                            type="text"
                            value={formatNumber(data.ownerSalary)}
                            onChange={(e) => handleInputChange('ownerSalary', e.target.value)}
                            className="font-mono h-8 w-40 ml-auto text-right"
                          />
                        </td>
                      </tr>
                      <tr className="bg-muted/30 font-semibold">
                        <td className="p-3 text-sm">Total Costes</td>
                        <td className="p-3 text-right font-mono text-sm">
                          {formatNumber(data.personnelCosts + data.otherCosts + data.ownerSalary)}
                        </td>
                      </tr>
                      <tr className="bg-primary/10 font-bold">
                        <td className="p-3 text-sm">EBITDA</td>
                        <td className="p-3 text-right font-mono text-sm text-primary">
                          {formatNumber(data.totalRevenue2024 - (data.personnelCosts + data.otherCosts + data.ownerSalary))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employees">Nº Trabajadores</Label>
                <Input
                  id="employees"
                  type="text"
                  value={formatNumber(data.numberOfEmployees)}
                  onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
                  className="font-mono"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Métricas Clave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                          Margen Socio <Info className="h-3 w-3" />
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p>Porcentaje de los ingresos destinado al sueldo del socio</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-2xl font-bold text-primary">
                    {metrics.ownerMargin.toFixed(1)}%
                  </div>
                  <Badge className={`${getMarginStatus(metrics.ownerMargin, 'owner').color} justify-center`}>
                    {getMarginStatus(metrics.ownerMargin, 'owner').label}
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
                      <p>Crecimiento interanual de la facturación (2023 vs 2024)</p>
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
                    {metrics.ebitda.toLocaleString('es-ES')}€
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
                    {metrics.revenuePerEmployee.toLocaleString('es-ES')}€
                  </div>
                </div>

                <div className="space-y-2 text-center">
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
                <PieChart className="h-5 w-5" />
                Análisis Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Revenue Composition */}
                <div className="space-y-4">
                  <h4 className="font-medium text-center">Composición de Ingresos Recurrentes</h4>
                  <div className="flex justify-center">
                    <div className="w-full h-[250px]">
                      <ChartContainer config={chartConfig}>
                        <RechartsPieChart width={400} height={250} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              formatter={(value) => [`${Number(value).toLocaleString('es-ES')}€`, '']}
                            />}
                            wrapperStyle={{ 
                              zIndex: 1000,
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '6px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                          <Pie
                            data={revenueCompositionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {revenueCompositionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ChartContainer>
                    </div>
                  </div>
                </div>

                {/* Year Comparison */}
                <div className="space-y-4">
                  <h4 className="font-medium text-center">Comparativa Anual</h4>
                  <div className="flex justify-center">
                    <div className="w-full h-[250px]">
                      <ChartContainer config={{ revenue: { label: "Facturación", color: "hsl(var(--primary))" } }}>
                        <BarChart data={yearComparisonData} width={400} height={250} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                        {valuation.valuationAmount.toLocaleString('es-ES')}€
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Valoración Media Ponderada</div>
                <div className="text-2xl font-bold text-primary">
                  {(valuations.reduce((sum, v) => sum + v.valuationAmount, 0) / valuations.length).toLocaleString('es-ES')}€
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
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