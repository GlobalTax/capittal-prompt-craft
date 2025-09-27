import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, Calculator, Info } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";

interface DCFInputs {
  initialCashFlow: number;
  growthRate: number;
  discountRate: number;
  terminalGrowthRate: number;
  projectionYears: number;
}

interface CashFlowProjection {
  year: number;
  cashFlow: number;
  presentValue: number;
}

interface DCFResult {
  projections: CashFlowProjection[];
  terminalValue: number;
  terminalPresentValue: number;
  totalPresentValue: number;
  enterpriseValue: number;
}

const DCFCalculator = () => {
  const [inputs, setInputs] = useState<DCFInputs>({
    initialCashFlow: 527500, // EBITDA aproximado del ejemplo
    growthRate: 15,
    discountRate: 12,
    terminalGrowthRate: 2.5,
    projectionYears: 5,
  });

  const [result, setResult] = useState<DCFResult | null>(null);

  const calculateDCF = () => {
    const projections: CashFlowProjection[] = [];
    let currentCashFlow = inputs.initialCashFlow;

    // Proyecciones de flujo de caja
    for (let year = 1; year <= inputs.projectionYears; year++) {
      currentCashFlow = currentCashFlow * (1 + inputs.growthRate / 100);
      const presentValue = currentCashFlow / Math.pow(1 + inputs.discountRate / 100, year);
      
      projections.push({
        year,
        cashFlow: currentCashFlow,
        presentValue,
      });
    }

    // Valor terminal
    const finalCashFlow = projections[projections.length - 1].cashFlow;
    const terminalValue = (finalCashFlow * (1 + inputs.terminalGrowthRate / 100)) / 
                          (inputs.discountRate / 100 - inputs.terminalGrowthRate / 100);
    
    const terminalPresentValue = terminalValue / Math.pow(1 + inputs.discountRate / 100, inputs.projectionYears);
    
    // Valor total
    const totalPresentValue = projections.reduce((sum, p) => sum + p.presentValue, 0);
    const enterpriseValue = totalPresentValue + terminalPresentValue;

    setResult({
      projections,
      terminalValue,
      terminalPresentValue,
      totalPresentValue,
      enterpriseValue,
    });
  };

  useEffect(() => {
    calculateDCF();
  }, [inputs]);

  const handleInputChange = (field: keyof DCFInputs, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: numericValue }));
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  const chartData = result?.projections.map(p => ({
    year: `Año ${p.year}`,
    "Flujo de Caja": p.cashFlow,
    "Valor Presente": p.presentValue,
  })) || [];

  const sensitivityData = [
    { scenario: "Pesimista", discountRate: inputs.discountRate + 2, value: 0 },
    { scenario: "Base", discountRate: inputs.discountRate, value: 0 },
    { scenario: "Optimista", discountRate: inputs.discountRate - 2, value: 0 },
  ].map(scenario => {
    // Cálculo rápido para análisis de sensibilidad
    const adjustedProjections = [];
    let cashFlow = inputs.initialCashFlow;
    
    for (let year = 1; year <= inputs.projectionYears; year++) {
      cashFlow = cashFlow * (1 + inputs.growthRate / 100);
      const pv = cashFlow / Math.pow(1 + scenario.discountRate / 100, year);
      adjustedProjections.push(pv);
    }
    
    const finalCashFlow = cashFlow;
    const terminalValue = (finalCashFlow * (1 + inputs.terminalGrowthRate / 100)) / 
                          (scenario.discountRate / 100 - inputs.terminalGrowthRate / 100);
    const terminalPV = terminalValue / Math.pow(1 + scenario.discountRate / 100, inputs.projectionYears);
    
    scenario.value = adjustedProjections.reduce((sum, pv) => sum + pv, 0) + terminalPV;
    return scenario;
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Calculadora DCF (Flujo de Caja Descontado)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="initialCashFlow" className="flex items-center gap-1">
              Flujo de Caja Inicial (€)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>EBITDA o flujo de caja libre del año base</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="initialCashFlow"
              type="number"
              value={inputs.initialCashFlow}
              onChange={(e) => handleInputChange('initialCashFlow', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="growthRate" className="flex items-center gap-1">
              Tasa de Crecimiento (%)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Crecimiento anual esperado del flujo de caja</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="growthRate"
              type="number"
              step="0.1"
              value={inputs.growthRate}
              onChange={(e) => handleInputChange('growthRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="discountRate" className="flex items-center gap-1">
              Tasa de Descuento (%)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>WACC o tasa de retorno requerida</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="discountRate"
              type="number"
              step="0.1"
              value={inputs.discountRate}
              onChange={(e) => handleInputChange('discountRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terminalGrowthRate" className="flex items-center gap-1">
              Crecimiento Terminal (%)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Crecimiento perpetuo después del período de proyección</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="terminalGrowthRate"
              type="number"
              step="0.1"
              value={inputs.terminalGrowthRate}
              onChange={(e) => handleInputChange('terminalGrowthRate', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectionYears">Años de Proyección</Label>
            <Input
              id="projectionYears"
              type="number"
              min="3"
              max="10"
              value={inputs.projectionYears}
              onChange={(e) => handleInputChange('projectionYears', e.target.value)}
            />
          </div>
        </div>

        {result && (
          <>
            <Separator />
            
            {/* Resultados principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Valor Presente Proyecciones</div>
                  <div className="text-xl font-bold text-primary">
                    {formatNumber(result.totalPresentValue)}€
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Valor Terminal</div>
                  <div className="text-xl font-bold text-primary">
                    {formatNumber(result.terminalPresentValue)}€
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">Valor de Empresa</div>
                  <div className="text-2xl font-bold text-primary">
                    {formatNumber(result.enterpriseValue)}€
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-sm text-muted-foreground">% Valor Terminal</div>
                  <div className="text-xl font-bold">
                    {((result.terminalPresentValue / result.enterpriseValue) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de proyecciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Proyecciones de Flujo de Caja</h3>
              <ChartContainer config={{
                "Flujo de Caja": { label: "Flujo de Caja", color: "hsl(var(--chart-1))" },
                "Valor Presente": { label: "Valor Presente", color: "hsl(var(--chart-2))" },
              }} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${formatNumber(value)}€`, ""]}
                    />
                    <Bar dataKey="Flujo de Caja" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="Valor Presente" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Análisis de sensibilidad */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Análisis de Sensibilidad - Tasa de Descuento</h3>
              <ChartContainer config={{
                value: { label: "Valoración", color: "hsl(var(--chart-3))" },
              }} className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${formatNumber(value)}€`, "Valoración"]}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Tabla de proyecciones detallada */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Detalle de Proyecciones</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-2 text-left">Año</th>
                      <th className="border border-border p-2 text-right">Flujo de Caja</th>
                      <th className="border border-border p-2 text-right">Factor Descuento</th>
                      <th className="border border-border p-2 text-right">Valor Presente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.projections.map((projection) => (
                      <tr key={projection.year}>
                        <td className="border border-border p-2">{projection.year}</td>
                        <td className="border border-border p-2 text-right">
                          {formatNumber(projection.cashFlow)}€
                        </td>
                        <td className="border border-border p-2 text-right">
                          {(1 / Math.pow(1 + inputs.discountRate / 100, projection.year)).toFixed(4)}
                        </td>
                        <td className="border border-border p-2 text-right">
                          {formatNumber(projection.presentValue)}€
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-muted font-semibold">
                      <td className="border border-border p-2">Terminal</td>
                      <td className="border border-border p-2 text-right">
                        {formatNumber(result.terminalValue)}€
                      </td>
                      <td className="border border-border p-2 text-right">
                        {(1 / Math.pow(1 + inputs.discountRate / 100, inputs.projectionYears)).toFixed(4)}
                      </td>
                      <td className="border border-border p-2 text-right">
                        {formatNumber(result.terminalPresentValue)}€
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DCFCalculator;