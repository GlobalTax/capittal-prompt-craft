import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calculator, TrendingUp, Users, Euro, AlertTriangle, Info, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface FinancialData {
  totalRevenue2023: number;
  totalRevenue2024: number;
  fiscalRecurring: number;
  accountingRecurring: number;
  laborRecurring: number;
  otherRevenue: number;
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
    fiscalRecurring: 300000,
    accountingRecurring: 200000,
    laborRecurring: 120000,
    otherRevenue: 5000,
    totalCosts: 512500,
    personnelCosts: 450000,
    otherCosts: 62500,
    ownerSalary: 50000,
    numberOfEmployees: 9,
  });

  const [valuations, setValuations] = useState<ValuationResult[]>([]);

  const calculateMetrics = () => {
    const totalRecurring = data.fiscalRecurring + data.accountingRecurring + data.laborRecurring + data.otherRevenue;
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

  // Data validation
  const validateData = () => {
    const issues = [];
    const totalRecurring = data.fiscalRecurring + data.accountingRecurring + data.laborRecurring + data.otherRevenue;
    const metrics = calculateMetrics();
    
    if (data.totalCosts >= data.totalRevenue2024) {
      issues.push("Los costes superan los ingresos - revisar datos");
    }
    if (totalRecurring > data.totalRevenue2024) {
      issues.push("La facturación recurrente supera el total anual");
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
    { name: "Fiscal", value: data.fiscalRecurring, fill: "hsl(var(--chart-1))" },
    { name: "Contable", value: data.accountingRecurring, fill: "hsl(var(--chart-2))" },
    { name: "Laboral", value: data.laborRecurring, fill: "hsl(var(--chart-3))" },
    { name: "Otros", value: data.otherRevenue, fill: "hsl(var(--chart-4))" },
  ];

  const yearComparisonData = [
    { year: "2023", revenue: data.totalRevenue2023 },
    { year: "2024", revenue: data.totalRevenue2024 },
  ];

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Valoración de Despachos de Asesoría
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Herramienta profesional para la valoración de empresas de asesoría basada en múltiplos del sector
        </p>
      </div>

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

      <div className="grid lg:grid-cols-2 gap-6">
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
                <h4 className="font-medium">Facturación Recurrente</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal">Fiscal (€)</Label>
                    <Input
                      id="fiscal"
                      type="text"
                      value={formatNumber(data.fiscalRecurring)}
                      onChange={(e) => handleInputChange('fiscalRecurring', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accounting">Contable (€)</Label>
                    <Input
                      id="accounting"
                      type="text"
                      value={formatNumber(data.accountingRecurring)}
                      onChange={(e) => handleInputChange('accountingRecurring', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labor">Laboral (€)</Label>
                    <Input
                      id="labor"
                      type="text"
                      value={formatNumber(data.laborRecurring)}
                      onChange={(e) => handleInputChange('laborRecurring', e.target.value)}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="other">Otros (€)</Label>
                    <Input
                      id="other"
                      type="text"
                      value={formatNumber(data.otherRevenue)}
                      onChange={(e) => handleInputChange('otherRevenue', e.target.value)}
                      className="font-mono text-sm"
                    />
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
                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          Margen Neto <Info className="h-3 w-3" />
                        </span>
                        <Badge className={getMarginStatus(metrics.netMargin, 'net').color}>
                          {getMarginStatus(metrics.netMargin, 'net').label}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Beneficio después de todos los gastos (&gt;20% es óptimo)</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-2xl font-bold text-primary">
                    {metrics.netMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          Margen Socio <Info className="h-3 w-3" />
                        </span>
                        <Badge className={getMarginStatus(metrics.ownerMargin, 'owner').color}>
                          {getMarginStatus(metrics.ownerMargin, 'owner').label}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Porcentaje de los ingresos destinado al sueldo del socio</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-2xl font-bold text-primary">
                    {metrics.ownerMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium flex items-center gap-1">
                        Crecimiento <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Crecimiento interanual de la facturación (2023 vs 2024)</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className={`text-2xl font-bold ${metrics.revenueGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium flex items-center gap-1">
                        EBITDA <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Beneficio antes de impuestos + sueldo del socio</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-xl font-bold text-success">
                    {metrics.ebitda.toLocaleString('es-ES')}€
                  </div>
                </div>

                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium flex items-center gap-1">
                        Facturación/Empleado <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Productividad por empleado (&gt;100k€ es excelente)</p>
                    </TooltipContent>
                  </Tooltip>
                  <div className="text-xl font-bold">
                    {metrics.revenuePerEmployee.toLocaleString('es-ES')}€
                  </div>
                </div>

                <div className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium flex items-center gap-1">
                        Recurrencia <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
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
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Análisis Visual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Revenue Composition */}
                <div className="space-y-3">
                  <h4 className="font-medium text-center">Composición de Ingresos Recurrentes</h4>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => [`${Number(value).toLocaleString('es-ES')}€`, '']}
                          />} 
                        />
                        <Pie
                          data={revenueCompositionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                        >
                          {revenueCompositionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </div>

                {/* Year Comparison */}
                <div className="space-y-3">
                  <h4 className="font-medium text-center">Comparativa Anual</h4>
                  <ChartContainer config={{}} className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={yearComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => [`${Number(value).toLocaleString('es-ES')}€`, 'Facturación']}
                          />} 
                        />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
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
              
              <div className="text-center p-4 bg-primary-light rounded-lg">
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
    </TooltipProvider>
  );
};

export default ValuationCalculator;