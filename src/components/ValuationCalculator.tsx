import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, TrendingUp, Users, Euro, AlertTriangle, Info, PieChart, BarChart3, ClipboardCheck } from "lucide-react";
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

interface FinancialData {
  totalRevenue2023: number;
  totalRevenue2024: number;
  fiscalRecurringPercent: number;
  accountingRecurringPercent: number;
  laborRecurringPercent: number;
  otherRevenuePercent: number;
  totalCosts: number;
  personnelCosts: number;
  otherCosts: number;
  ownerSalary: number;
  numberOfEmployees: number;
}

interface ValuationResult {
  valuationAmount: number;
  multiplier: number;
  method: string;
}

const ValuationCalculator = () => {
  const [data, setData] = useState<FinancialData>({
    totalRevenue2023: 625000,
    totalRevenue2024: 1040000,
    fiscalRecurringPercent: 28.85,
    accountingRecurringPercent: 19.23,
    laborRecurringPercent: 11.54,
    otherRevenuePercent: 0.48,
    totalCosts: 512500,
    personnelCosts: 450000,
    otherCosts: 62500,
    ownerSalary: 50000,
    numberOfEmployees: 9,
  });

  const [valuations, setValuations] = useState<ValuationResult[]>([]);

  const calculateMetrics = () => {
    const fiscalRecurring = (data.totalRevenue2024 * data.fiscalRecurringPercent) / 100;
    const accountingRecurring = (data.totalRevenue2024 * data.accountingRecurringPercent) / 100;
    const laborRecurring = (data.totalRevenue2024 * data.laborRecurringPercent) / 100;
    const otherRevenue = (data.totalRevenue2024 * data.otherRevenuePercent) / 100;
    const totalRecurring = fiscalRecurring + accountingRecurring + laborRecurring + otherRevenue;
    const netMargin = ((data.totalRevenue2024 - data.totalCosts) / data.totalRevenue2024) * 100;
    const contributionMargin = ((data.totalRevenue2024 - data.personnelCosts) / data.totalRevenue2024) * 100;
    const ownerMargin = (data.ownerSalary / data.totalRevenue2024) * 100;
    const revenuePerEmployee = data.totalRevenue2024 / data.numberOfEmployees;
    const profitBeforeTaxes = data.totalRevenue2024 - data.totalCosts;
    const revenueGrowth = ((data.totalRevenue2024 - data.totalRevenue2023) / data.totalRevenue2023) * 100;
    const ebitda = profitBeforeTaxes + data.ownerSalary; // Simplified EBITDA approximation
    const recurringPercentage = (totalRecurring / data.totalRevenue2024) * 100;
    const costEfficiency = (data.totalCosts / data.totalRevenue2024) * 100;

    return {
      netMargin,
      contributionMargin,
      ownerMargin,
      revenuePerEmployee,
      profitBeforeTaxes,
      revenueGrowth,
      ebitda,
      recurringPercentage,
      totalRecurring,
      costEfficiency
    };
  };

  const calculateValuations = () => {
    const metrics = calculateMetrics();
    
    // Valoración por múltiplos basada en los datos del Excel
    const valuationsByRevenue: ValuationResult[] = [
      { valuationAmount: data.totalRevenue2024 * 0.7, multiplier: 0.7, method: "Conservador" },
      { valuationAmount: data.totalRevenue2024 * 0.8, multiplier: 0.8, method: "Moderado" },
      { valuationAmount: data.totalRevenue2024 * 0.9, multiplier: 0.9, method: "Optimista" },
      { valuationAmount: data.totalRevenue2024 * 1.0, multiplier: 1.0, method: "Agresivo" },
      { valuationAmount: data.totalRevenue2024 * 1.1, multiplier: 1.1, method: "Premium" },
    ];

    // Ajustes basados en márgenes
    const adjustedValuations = valuationsByRevenue.map(valuation => {
      let adjustment = 1;
      
      // Ajuste por margen neto
      if (metrics.netMargin > 30) adjustment += 0.1;
      else if (metrics.netMargin < 10) adjustment -= 0.1;
      
      // Ajuste por tamaño
      if (data.totalRevenue2024 >= 1000000) adjustment += 0.05;
      
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

  const handleInputChange = (field: keyof FinancialData, value: string) => {
    // Solo permitir números y puntos
    const cleanValue = value.replace(/[^\d.]/g, '');
    const numValue = parseNumber(cleanValue);
    setData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handlePercentageChange = (field: keyof FinancialData, value: string) => {
    // Permitir campo vacío
    if (value === '') {
      setData(prev => ({ ...prev, [field]: 0 }));
      return;
    }
    
    // Limpiar entrada y validar
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const numValue = parseFloat(cleanValue);
    
    if (!isNaN(numValue)) {
      // Limitar entre 0-100
      const cappedValue = Math.min(Math.max(numValue, 0), 100);
      setData(prev => ({ ...prev, [field]: cappedValue }));
    }
  };

  // Data validation
  const validateData = () => {
    const issues = [];
    const totalRecurringPercent = data.fiscalRecurringPercent + data.accountingRecurringPercent + 
                                   data.laborRecurringPercent + data.otherRevenuePercent;
    const metrics = calculateMetrics();
    
    if (data.totalCosts >= data.totalRevenue2024) {
      issues.push("Los costes superan los ingresos - revisar datos");
    }
    if (totalRecurringPercent > 100) {
      issues.push("Los porcentajes de facturación recurrente superan el 100%");
    }
    if (metrics.revenueGrowth < -20) {
      issues.push("Decrecimiento muy alto - revisar cifras");
    }
    if (data.numberOfEmployees === 0) {
      issues.push("Número de empleados no puede ser cero");
    }
    
    return issues;
  };

  // Chart data
  const chartConfig = {
    fiscal: { label: "Fiscal", color: "hsl(var(--chart-1))" },
    accounting: { label: "Contable", color: "hsl(var(--chart-2))" },
    labor: { label: "Laboral", color: "hsl(var(--chart-3))" },
    other: { label: "Otros", color: "hsl(var(--chart-4))" },
  };

  const revenueCompositionData = [
    { name: "Fiscal", value: (data.totalRevenue2024 * data.fiscalRecurringPercent) / 100, fill: "hsl(var(--chart-1))" },
    { name: "Contable", value: (data.totalRevenue2024 * data.accountingRecurringPercent) / 100, fill: "hsl(var(--chart-2))" },
    { name: "Laboral", value: (data.totalRevenue2024 * data.laborRecurringPercent) / 100, fill: "hsl(var(--chart-3))" },
    { name: "Otros", value: (data.totalRevenue2024 * data.otherRevenuePercent) / 100, fill: "hsl(var(--chart-4))" },
  ].filter(item => item.value > 0);

  const yearComparisonData = [
    { year: "2023", revenue: data.totalRevenue2023 },
    { year: "2024", revenue: data.totalRevenue2024 },
  ];

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
                <h4 className="font-medium">Facturación Recurrente (%)</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal">Fiscal (%)</Label>
                    <div className="relative">
                      <Input
                        id="fiscal"
                        type="text"
                        value={data.fiscalRecurringPercent || ''}
                        onChange={(e) => handlePercentageChange('fiscalRecurringPercent', e.target.value)}
                        placeholder="0"
                        className="font-mono text-sm pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber((data.totalRevenue2024 * data.fiscalRecurringPercent) / 100)} €
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accounting">Contable (%)</Label>
                    <div className="relative">
                      <Input
                        id="accounting"
                        type="text"
                        value={data.accountingRecurringPercent || ''}
                        onChange={(e) => handlePercentageChange('accountingRecurringPercent', e.target.value)}
                        placeholder="0"
                        className="font-mono text-sm pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber((data.totalRevenue2024 * data.accountingRecurringPercent) / 100)} €
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labor">Laboral (%)</Label>
                    <div className="relative">
                      <Input
                        id="labor"
                        type="text"
                        value={data.laborRecurringPercent || ''}
                        onChange={(e) => handlePercentageChange('laborRecurringPercent', e.target.value)}
                        placeholder="0"
                        className="font-mono text-sm pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber((data.totalRevenue2024 * data.laborRecurringPercent) / 100)} €
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other">Otros (%)</Label>
                    <div className="relative">
                      <Input
                        id="other"
                        type="text"
                        value={data.otherRevenuePercent || ''}
                        onChange={(e) => handlePercentageChange('otherRevenuePercent', e.target.value)}
                        placeholder="0"
                        className="font-mono text-sm pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber((data.totalRevenue2024 * data.otherRevenuePercent) / 100)} €
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="personnelCosts">Costes Personal (€)</Label>
                  <Input
                    id="personnelCosts"
                    type="text"
                    value={formatNumber(data.personnelCosts)}
                    onChange={(e) => handleInputChange('personnelCosts', e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otherCosts">Otros Costes (€)</Label>
                  <Input
                    id="otherCosts"
                    type="text"
                    value={formatNumber(data.otherCosts)}
                    onChange={(e) => handleInputChange('otherCosts', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ownerSalary">Sueldo Propiedad (€)</Label>
                  <Input
                    id="ownerSalary"
                    type="text"
                    value={formatNumber(data.ownerSalary)}
                    onChange={(e) => handleInputChange('ownerSalary', e.target.value)}
                    className="font-mono"
                  />
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