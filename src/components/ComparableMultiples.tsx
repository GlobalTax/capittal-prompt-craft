import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { Save, History } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSectorMultiples } from '@/hooks/useSectorMultiples';
import { valuationRepository } from '@/repositories/ValuationRepository';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  revenue: number;
  ebitda: number;
  netIncome: number;
  employees: number;
  sector: string;
}

interface SectorMultiples {
  sector: string;
  revenueMultiple: { min: number; avg: number; max: number };
  ebitdaMultiple: { min: number; avg: number; max: number };
  peRatio: { min: number; avg: number; max: number };
  description: string;
}

interface ValuationResult {
  method: string;
  multiple: number;
  value: number;
  benchmark: string;
}

interface ComparableMultiplesProps {
  valuationId?: string;
  onResultsChange?: (results: any) => void;
}

export const ComparableMultiples = React.memo(function ComparableMultiples({ valuationId, onResultsChange }: ComparableMultiplesProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { sectorMultiples: sectorData, loading } = useSectorMultiples();
  const [companyData, setCompanyData] = useState<CompanyData>({
    revenue: 1040000,
    ebitda: 527500,
    netIncome: 477500,
    employees: 9,
    sector: "consulting",
  });

  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("avg");
  const [valuations, setValuations] = useState<ValuationResult[]>([]);

  const sectorMultiples: SectorMultiples[] = sectorData.map(sector => ({
    sector: sector.sector_code,
    revenueMultiple: { 
      min: sector.revenue_multiple_min, 
      avg: sector.revenue_multiple_avg, 
      max: sector.revenue_multiple_max 
    },
    ebitdaMultiple: { 
      min: sector.ebitda_multiple_min, 
      avg: sector.ebitda_multiple_avg, 
      max: sector.ebitda_multiple_max 
    },
    peRatio: { 
      min: sector.pe_ratio_min, 
      avg: sector.pe_ratio_avg, 
      max: sector.pe_ratio_max 
    },
    description: sector.sector_name
  }));

  const calculateValuations = () => {
    const currentSector = sectorMultiples.find(s => s.sector === companyData.sector);
    if (!currentSector) return;

    const results: ValuationResult[] = [];
    
    const revenueMultiples = [
      { key: "min", label: "Conservador", value: currentSector.revenueMultiple.min },
      { key: "avg", label: "Promedio", value: currentSector.revenueMultiple.avg },
      { key: "max", label: "Optimista", value: currentSector.revenueMultiple.max }
    ];

    revenueMultiples.forEach(mult => {
      results.push({
        method: `Ingresos (${mult.label})`,
        multiple: mult.value,
        value: companyData.revenue * mult.value,
        benchmark: mult.key
      });
    });

    const ebitdaMultiples = [
      { key: "min", label: "Conservador", value: currentSector.ebitdaMultiple.min },
      { key: "avg", label: "Promedio", value: currentSector.ebitdaMultiple.avg },
      { key: "max", label: "Optimista", value: currentSector.ebitdaMultiple.max }
    ];

    ebitdaMultiples.forEach(mult => {
      results.push({
        method: `EBITDA (${mult.label})`,
        multiple: mult.value,
        value: companyData.ebitda * mult.value,
        benchmark: mult.key
      });
    });

    const peRatios = [
      { key: "min", label: "Conservador", value: currentSector.peRatio.min },
      { key: "avg", label: "Promedio", value: currentSector.peRatio.avg },
      { key: "max", label: "Optimista", value: currentSector.peRatio.max }
    ];

    peRatios.forEach(pe => {
      results.push({
        method: `P/E (${pe.label})`,
        multiple: pe.value,
        value: companyData.netIncome * pe.value,
        benchmark: pe.key
      });
    });

    setValuations(results);
  };

  useEffect(() => {
    if (companyData.revenue && companyData.sector && sectorMultiples.length > 0) {
      calculateValuations();
    }
  }, [companyData, selectedBenchmark, sectorMultiples]);

  useEffect(() => {
    if (valuationId) {
      loadHistory();
    }
  }, [valuationId]);

  const loadHistory = async () => {
    if (!valuationId) return;
    
    try {
      const valuation = await valuationRepository.findById(valuationId);
      if (valuation?.comparable_multiples_results) {
        setHistory(Array.isArray(valuation.comparable_multiples_results) 
          ? valuation.comparable_multiples_results 
          : [valuation.comparable_multiples_results]);
      }
    } catch (error) {
      console.error('Error loading multiples history:', error);
    }
  };

  const saveResults = async () => {
    if (!valuationId || valuations.length === 0) return;
    
    setIsSaving(true);
    try {
      const valuation = await valuationRepository.findById(valuationId);
      const existingResults = Array.isArray(valuation?.comparable_multiples_results) 
        ? valuation.comparable_multiples_results 
        : [];
      
      const filteredValuations = selectedBenchmark === "all" 
        ? valuations 
        : valuations.filter(v => v.benchmark === selectedBenchmark);
      
      const newResult = {
        companyData,
        valuations: filteredValuations,
        weightedAverage: filteredValuations.reduce((sum, v) => sum + v.value, 0) / filteredValuations.length,
        savedAt: new Date().toISOString()
      };
      
      const newResults = [...existingResults, newResult];
      
      await valuationRepository.update(valuationId, {
        comparable_multiples_results: newResults as any,
        last_multiples_calculation: new Date().toISOString()
      });
      
      setHistory(newResults);
      onResultsChange?.(newResult);
      
      toast({
        title: 'Análisis guardado',
        description: 'Los resultados de múltiplos comparables se han guardado correctamente',
      });
    } catch (error) {
      console.error('Error saving multiples results:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los resultados',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof CompanyData, value: string | number) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  };

  const getBenchmarkColor = (benchmark: string) => {
    switch (benchmark) {
      case "min": return "text-destructive";
      case "avg": return "text-primary";
      case "max": return "text-green-600";
      default: return "text-muted-foreground";
    }
  };

  const filteredValuations = selectedBenchmark === "all" 
    ? valuations 
    : valuations.filter(v => v.benchmark === selectedBenchmark);

  const chartData = filteredValuations.map(v => ({
    method: v.method.replace(/\s\([^)]*\)/, ''),
    value: v.value,
    multiple: v.multiple
  }));

  const currentSector = sectorMultiples.find(s => s.sector === companyData.sector);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cargando múltiplos de sector...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Múltiplos Comparables</CardTitle>
              <CardDescription>
                Valoración por comparación con empresas del sector
              </CardDescription>
            </div>
            {valuationId && (
              <Button onClick={saveResults} disabled={isSaving || valuations.length === 0}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? 'Guardando...' : 'Guardar Análisis'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={companyData.sector} onValueChange={(value) => handleInputChange('sector', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sectorMultiples.map(sector => (
                    <SelectItem key={sector.sector} value={sector.sector}>
                      {sector.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="revenue">Ingresos Anuales (€)</Label>
              <Input
                id="revenue"
                type="number"
                value={companyData.revenue}
                onChange={(e) => handleInputChange('revenue', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ebitda">EBITDA (€)</Label>
              <Input
                id="ebitda"
                type="number"
                value={companyData.ebitda}
                onChange={(e) => handleInputChange('ebitda', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="netIncome">Beneficio Neto (€)</Label>
              <Input
                id="netIncome"
                type="number"
                value={companyData.netIncome}
                onChange={(e) => handleInputChange('netIncome', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employees">Número de Empleados</Label>
              <Input
                id="employees"
                type="number"
                value={companyData.employees}
                onChange={(e) => handleInputChange('employees', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="benchmark">Benchmark</Label>
              <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="min">Conservador</SelectItem>
                  <SelectItem value="avg">Promedio</SelectItem>
                  <SelectItem value="max">Optimista</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {filteredValuations.length > 0 && (
            <>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Valoraciones por Múltiplos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredValuations.map((valuation, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-sm text-muted-foreground">{valuation.method}</div>
                          <Badge 
                            variant="outline" 
                            className={getBenchmarkColor(valuation.benchmark)}
                          >
                            {valuation.multiple.toFixed(1)}x
                          </Badge>
                        </div>
                        <div className="text-xl font-bold text-primary">
                          {formatNumber(valuation.value)}€
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Comparación de Valoraciones</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <YAxis dataKey="method" type="category" width={100} />
                    <Tooltip formatter={(value: number) => `${formatNumber(value)}€`} />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Card className="bg-primary/5">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">Valoración Promedio Ponderada</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatNumber(filteredValuations.reduce((sum, v) => sum + v.value, 0) / filteredValuations.length)}€
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Basado en {filteredValuations.length} múltiplos del sector {currentSector?.description}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Análisis de Múltiplos
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
                      {formatNumber(calc.weightedAverage)} €
                    </span>
                  </div>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Sector:</span>
                      <p className="font-medium">{calc.companyData?.sector || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Valoraciones:</span>
                      <p className="font-medium">{calc.valuations?.length || 0}</p>
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

export default ComparableMultiples;
