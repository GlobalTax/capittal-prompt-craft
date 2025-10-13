import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";

export default function FeeCalculator() {
  const [companyValue, setCompanyValue] = useState<number>(1000000);
  const [commissionRate, setCommissionRate] = useState<number>(3);
  const [estimatedCosts, setEstimatedCosts] = useState<number>(5000);
  const [valuationType, setValuationType] = useState<string>("complete");

  const calculateFees = () => {
    const grossFees = (companyValue * commissionRate) / 100;
    const netFees = grossFees - estimatedCosts;
    const roi = estimatedCosts > 0 ? ((netFees / estimatedCosts) * 100) : 0;

    return { grossFees, netFees, roi };
  };

  const { grossFees, netFees, roi } = calculateFees();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const valuationTypes = [
    { value: "complete", label: "Valoración Completa", baseRate: 3 },
    { value: "simplified", label: "Valoración Simplificada", baseRate: 1.5 },
    { value: "due-diligence", label: "Due Diligence", baseRate: 2 },
    { value: "consulting", label: "Consultoría M&A", baseRate: 4 }
  ];

  const handleValuationTypeChange = (value: string) => {
    setValuationType(value);
    const type = valuationTypes.find(t => t.value === value);
    if (type) {
      setCommissionRate(type.baseRate);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calculadora de Honorarios</h1>
        <p className="text-muted-foreground mt-2">
          Estima tus honorarios potenciales según el valor de la empresa y tipo de servicio
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Parámetros de Cálculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="valuationType">Tipo de Servicio</Label>
                <Select value={valuationType} onValueChange={handleValuationTypeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {valuationTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyValue">Valor de la Empresa</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="companyValue"
                    type="number"
                    value={companyValue}
                    onChange={(e) => setCompanyValue(Number(e.target.value))}
                    className="pl-9"
                  />
                </div>
                <p className="text-sm text-muted-foreground">{formatCurrency(companyValue)}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Porcentaje de Comisión</Label>
                  <span className="text-sm font-medium">{commissionRate}%</span>
                </div>
                <Slider
                  value={[commissionRate]}
                  onValueChange={([value]) => setCommissionRate(value)}
                  min={0.5}
                  max={10}
                  step={0.5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="costs">Costes Estimados</Label>
                <Input
                  id="costs"
                  type="number"
                  value={estimatedCosts}
                  onChange={(e) => setEstimatedCosts(Number(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">{formatCurrency(estimatedCosts)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <TrendingUp className="h-5 w-5" />
                Honorarios Brutos
              </CardTitle>
              <CardDescription>Ingresos totales antes de gastos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">{formatCurrency(grossFees)}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {commissionRate}% de {formatCurrency(companyValue)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="text-green-700 dark:text-green-400">
                Honorarios Netos
              </CardTitle>
              <CardDescription>Beneficio después de costes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-700 dark:text-green-400">
                {formatCurrency(netFees)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Margen de beneficio
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ROI del Proyecto</CardTitle>
              <CardDescription>Retorno sobre inversión</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {roi > 0 ? `${roi.toFixed(0)}%` : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Basado en costes de {formatCurrency(estimatedCosts)}
              </p>
            </CardContent>
          </Card>

          <div className="p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold mb-2 text-sm">Desglose</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ingresos:</span>
                <span className="font-medium">{formatCurrency(grossFees)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costes:</span>
                <span className="font-medium text-destructive">-{formatCurrency(estimatedCosts)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Beneficio Neto:</span>
                <span className="text-green-700 dark:text-green-400">{formatCurrency(netFees)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
