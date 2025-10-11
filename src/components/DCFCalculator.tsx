import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Info, Save, History } from 'lucide-react';
import { Tooltip as TooltipUI, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { valuationRepository } from '@/repositories/ValuationRepository';
import { useToast } from '@/hooks/use-toast';

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

interface DCFCalculatorProps {
  valuationId?: string;
  onResultsChange?: (results: DCFResult) => void;
}

export const DCFCalculator = React.memo(function DCFCalculator({ valuationId, onResultsChange }: DCFCalculatorProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<DCFResult[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const [inputs, setInputs] = useState<DCFInputs>({
    initialCashFlow: 527500,
    growthRate: 15,
    discountRate: 12,
    terminalGrowthRate: 2.5,
    projectionYears: 5,
  });

  const [result, setResult] = useState<DCFResult | null>(null);

  const calculateDCF = () => {
    const projections: CashFlowProjection[] = [];
    let currentCashFlow = inputs.initialCashFlow;

    for (let year = 1; year <= inputs.projectionYears; year++) {
      currentCashFlow = currentCashFlow * (1 + inputs.growthRate / 100);
      const presentValue = currentCashFlow / Math.pow(1 + inputs.discountRate / 100, year);
      
      projections.push({
        year,
        cashFlow: currentCashFlow,
        presentValue,
      });
    }

    const finalCashFlow = projections[projections.length - 1].cashFlow;
    const terminalValue = (finalCashFlow * (1 + inputs.terminalGrowthRate / 100)) / 
                          (inputs.discountRate / 100 - inputs.terminalGrowthRate / 100);
    
    const terminalPresentValue = terminalValue / Math.pow(1 + inputs.discountRate / 100, inputs.projectionYears);
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

  useEffect(() => {
    if (valuationId) {
      loadHistory();
    }
  }, [valuationId]);

  const loadHistory = async () => {
    if (!valuationId) return;
    
    try {
      const valuation = await valuationRepository.findById(valuationId);
      if (valuation?.dcf_results) {
        setHistory(Array.isArray(valuation.dcf_results) ? valuation.dcf_results : [valuation.dcf_results]);
      }
    } catch (error) {
      console.error('Error loading DCF history:', error);
    }
  };

  const saveResults = async () => {
    if (!valuationId || !result) return;
    
    setIsSaving(true);
    try {
      const valuation = await valuationRepository.findById(valuationId);
      const existingResults = Array.isArray(valuation?.dcf_results) ? valuation.dcf_results : [];
      
      const newResults = [...existingResults, { ...result, savedAt: new Date().toISOString() }];
      
      await valuationRepository.update(valuationId, {
        dcf_results: newResults as any,
        last_dcf_calculation: new Date().toISOString()
      });
      
      setHistory(newResults);
      onResultsChange?.(result);
      
      toast({
        title: 'Cálculo guardado',
        description: 'Los resultados del DCF se han guardado correctamente',
      });
    } catch (error) {
      console.error('Error saving DCF results:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los resultados',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calculadora DCF</CardTitle>
              <CardDescription>
                Valoración por Flujo de Caja Descontado
              </CardDescription>
            </div>
            {valuationId && (
              <Button onClick={saveResults} disabled={isSaving || !result}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Cálculo'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="initialCashFlow" className="flex items-center gap-1">
                Flujo de Caja Inicial (€)
                <TooltipProvider>
                  <TooltipUI>
                    <TooltipTrigger>
                      <Info className="h-3 w-3" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>EBITDA o flujo de caja libre del año base</p>
                    </TooltipContent>
                  </TooltipUI>
                </TooltipProvider>
              </Label>
              <Input
                id="initialCashFlow"
                type="number"
                value={inputs.initialCashFlow}
                onChange={(e) => handleInputChange('initialCashFlow', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="growthRate">Tasa de Crecimiento (%)</Label>
              <Input
                id="growthRate"
                type="number"
                step="0.1"
                value={inputs.growthRate}
                onChange={(e) => handleInputChange('growthRate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discountRate">Tasa de Descuento (%)</Label>
              <Input
                id="discountRate"
                type="number"
                step="0.1"
                value={inputs.discountRate}
                onChange={(e) => handleInputChange('discountRate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminalGrowthRate">Crecimiento Terminal (%)</Label>
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

              {/* Gráficos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Proyecciones de Flujo de Caja</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => `${formatNumber(value)}€`} />
                    <Legend />
                    <Bar dataKey="Flujo de Caja" fill="hsl(var(--primary))" />
                    <Bar dataKey="Valor Presente" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Análisis de sensibilidad */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Análisis de Sensibilidad</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sensitivityData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="scenario" />
                    <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: number) => `${formatNumber(value)}€`} />
                    <Bar dataKey="value" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Cálculos DCF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.slice().reverse().map((calc: any, idx) => (
                <div key={idx} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">
                      {new Date(calc.savedAt || Date.now()).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Badge>
                    <span className="font-semibold text-lg">
                      {formatNumber(calc.enterpriseValue)} €
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">VP Flujos:</span>
                      <p className="font-medium">{formatNumber(calc.totalPresentValue)} €</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valor Terminal:</span>
                      <p className="font-medium">{formatNumber(calc.terminalValue)} €</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Años:</span>
                      <p className="font-medium">{calc.projections.length}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default DCFCalculator;
