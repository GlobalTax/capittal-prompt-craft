import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart3, TrendingUp, Building, Info } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

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

const ComparableMultiples = () => {
  const [companyData, setCompanyData] = useState<CompanyData>({
    revenue: 1040000,
    ebitda: 527500,
    netIncome: 477500,
    employees: 9,
    sector: "consulting",
  });

  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("avg");
  const [valuations, setValuations] = useState<ValuationResult[]>([]);

  // Base de datos de múltiplos por sector (datos aproximados del mercado español)
  const sectorMultiples: SectorMultiples[] = [
    {
      sector: "consulting",
      revenueMultiple: { min: 0.6, avg: 1.2, max: 2.0 },
      ebitdaMultiple: { min: 4.0, avg: 7.0, max: 12.0 },
      peRatio: { min: 8.0, avg: 15.0, max: 25.0 },
      description: "Consultoría y Servicios Profesionales"
    },
    {
      sector: "technology",
      revenueMultiple: { min: 1.5, avg: 3.0, max: 6.0 },
      ebitdaMultiple: { min: 8.0, avg: 15.0, max: 25.0 },
      peRatio: { min: 15.0, avg: 25.0, max: 40.0 },
      description: "Tecnología y Software"
    },
    {
      sector: "manufacturing",
      revenueMultiple: { min: 0.4, avg: 0.8, max: 1.5 },
      ebitdaMultiple: { min: 3.0, avg: 6.0, max: 10.0 },
      peRatio: { min: 6.0, avg: 12.0, max: 20.0 },
      description: "Manufactura e Industria"
    },
    {
      sector: "retail",
      revenueMultiple: { min: 0.3, avg: 0.7, max: 1.2 },
      ebitdaMultiple: { min: 4.0, avg: 8.0, max: 15.0 },
      peRatio: { min: 10.0, avg: 18.0, max: 30.0 },
      description: "Comercio y Retail"
    },
    {
      sector: "healthcare",
      revenueMultiple: { min: 1.0, avg: 2.0, max: 4.0 },
      ebitdaMultiple: { min: 6.0, avg: 12.0, max: 20.0 },
      peRatio: { min: 12.0, avg: 20.0, max: 35.0 },
      description: "Salud y Servicios Médicos"
    }
  ];

  const calculateValuations = () => {
    const currentSector = sectorMultiples.find(s => s.sector === companyData.sector);
    if (!currentSector) return;

    const results: ValuationResult[] = [];
    
    // Múltiplos de ingresos
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

    // Múltiplos de EBITDA
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

    // P/E Ratios
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
    calculateValuations();
  }, [companyData, selectedBenchmark]);

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

  const sectorComparison = sectorMultiples.map(sector => ({
    sector: sector.description,
    revenue: sector.revenueMultiple.avg,
    ebitda: sector.ebitdaMultiple.avg,
    pe: sector.peRatio.avg
  }));

  const currentSector = sectorMultiples.find(s => s.sector === companyData.sector);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Múltiplos Comparables del Sector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Inputs de la empresa */}
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
            <Label htmlFor="ebitda" className="flex items-center gap-1">
              EBITDA (€)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Beneficio antes de intereses, impuestos, depreciación y amortización</p>
                </TooltipContent>
              </Tooltip>
            </Label>
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

        {/* Información del sector */}
        {currentSector && (
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building className="h-4 w-4" />
                <h3 className="font-semibold">{currentSector.description}</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Múltiplo Ingresos</div>
                  <div className="font-medium">
                    {currentSector.revenueMultiple.min}x - {currentSector.revenueMultiple.max}x 
                    <span className="text-primary ml-1">(Avg: {currentSector.revenueMultiple.avg}x)</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Múltiplo EBITDA</div>
                  <div className="font-medium">
                    {currentSector.ebitdaMultiple.min}x - {currentSector.ebitdaMultiple.max}x 
                    <span className="text-primary ml-1">(Avg: {currentSector.ebitdaMultiple.avg}x)</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">P/E Ratio</div>
                  <div className="font-medium">
                    {currentSector.peRatio.min}x - {currentSector.peRatio.max}x 
                    <span className="text-primary ml-1">(Avg: {currentSector.peRatio.avg}x)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultados de valoración */}
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

            {/* Gráfico de valoraciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Comparación de Valoraciones</h3>
              <div className="w-full h-[300px]">
                <ChartContainer config={{
                  value: { label: "Valoración", color: "hsl(var(--chart-1))" },
                }}>
                  <BarChart data={chartData} layout="horizontal" width={800} height={300}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                    <YAxis dataKey="method" type="category" width={100} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value: number) => [`${formatNumber(value)}€`, "Valoración"]}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            {/* Comparación entre sectores */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Múltiplos por Sector</h3>
              <div className="w-full h-[300px]">
                <ChartContainer config={{
                  revenue: { label: "Múltiplo Ingresos", color: "hsl(var(--chart-2))" },
                  ebitda: { label: "Múltiplo EBITDA", color: "hsl(var(--chart-3))" },
                  pe: { label: "P/E Ratio", color: "hsl(var(--chart-4))" },
                }}>
                  <BarChart data={sectorComparison} width={800} height={300}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="sector" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="revenue" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="ebitda" fill="hsl(var(--chart-3))" />
                    <Bar dataKey="pe" fill="hsl(var(--chart-4))" />
                  </BarChart>
                </ChartContainer>
              </div>
            </div>

            {/* Resumen valoración promedio */}
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
  );
};

export default ComparableMultiples;