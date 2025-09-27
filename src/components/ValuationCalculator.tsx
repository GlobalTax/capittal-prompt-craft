import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, Users, Euro } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    const netMargin = ((data.totalRevenue2024 - data.totalCosts) / data.totalRevenue2024) * 100;
    const contributionMargin = ((data.totalRevenue2024 - data.personnelCosts) / data.totalRevenue2024) * 100;
    const ownerMargin = (data.ownerSalary / data.totalRevenue2024) * 100;
    const revenuePerEmployee = data.totalRevenue2024 / data.numberOfEmployees;
    const profitBeforeTaxes = data.totalRevenue2024 - data.totalCosts;

    return {
      netMargin,
      contributionMargin,
      ownerMargin,
      revenuePerEmployee,
      profitBeforeTaxes
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

  return (
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
                  <Label htmlFor="revenue2024">Facturación 2024 (€)</Label>
                  <Input
                    id="revenue2024"
                    type="text"
                    value={formatNumber(data.totalRevenue2024)}
                    onChange={(e) => handleInputChange('totalRevenue2024', e.target.value)}
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue2023">Facturación 2023 (€)</Label>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Margen Neto</span>
                    <Badge className={getMarginStatus(metrics.netMargin, 'net').color}>
                      {getMarginStatus(metrics.netMargin, 'net').label}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {metrics.netMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Margen Socio</span>
                    <Badge className={getMarginStatus(metrics.ownerMargin, 'owner').color}>
                      {getMarginStatus(metrics.ownerMargin, 'owner').label}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {metrics.ownerMargin.toFixed(1)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Facturación por Empleado</span>
                  <div className="text-xl font-bold">
                    {metrics.revenuePerEmployee.toLocaleString('es-ES')}€
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-sm font-medium">Beneficio antes Impuestos</span>
                  <div className="text-xl font-bold text-success">
                    {metrics.profitBeforeTaxes.toLocaleString('es-ES')}€
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
  );
};

export default ValuationCalculator;