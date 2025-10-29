import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { Valuation } from '@/hooks/useValuations';

interface ValuationMethodsConfigProps {
  valuation: Valuation;
  onUpdate: (field: string, value: any) => void;
  onOpenMultiplesConfig: () => void;
}

export function ValuationMethodsConfig({ valuation, onUpdate, onOpenMultiplesConfig }: ValuationMethodsConfigProps) {
  const methods = valuation.metadata?.valuationMethods || {
    ebitda: { enabled: true, multiplier: 7.0 },
    revenue: { enabled: true, multiplier: 1.2 },
    netProfit: { enabled: false, multiplier: 15.0 }
  };

  const updateMethod = (method: 'ebitda' | 'revenue' | 'netProfit', field: 'enabled' | 'multiplier', value: boolean | number) => {
    const updatedMethods = {
      ...methods,
      [method]: {
        ...methods[method],
        [field]: value
      }
    };

    onUpdate('metadata', {
      ...valuation.metadata,
      valuationMethods: updatedMethods
    });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Métodos de Valoración</CardTitle>
        <CardDescription>
          Selecciona los métodos que deseas utilizar para valorar el negocio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* EBITDA Method */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="method-ebitda"
              checked={methods.ebitda?.enabled}
              onCheckedChange={(checked) => updateMethod('ebitda', 'enabled', checked as boolean)}
            />
            <Label htmlFor="method-ebitda" className="text-base font-medium cursor-pointer">
              Valoración por EBITDA
            </Label>
          </div>
          {methods.ebitda?.enabled && (
            <div className="ml-6 flex items-center gap-4">
              <Label htmlFor="multiplier-ebitda" className="text-sm text-muted-foreground">
                Múltiplo:
              </Label>
              <Input
                id="multiplier-ebitda"
                type="number"
                step="0.1"
                value={methods.ebitda?.multiplier || 7.0}
                onChange={(e) => updateMethod('ebitda', 'multiplier', parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                (Sugerido: 4-12)
              </span>
            </div>
          )}
        </div>

        {/* Revenue Method */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="method-revenue"
              checked={methods.revenue?.enabled}
              onCheckedChange={(checked) => updateMethod('revenue', 'enabled', checked as boolean)}
            />
            <Label htmlFor="method-revenue" className="text-base font-medium cursor-pointer">
              Valoración por Facturación
            </Label>
          </div>
          {methods.revenue?.enabled && (
            <div className="ml-6 flex items-center gap-4">
              <Label htmlFor="multiplier-revenue" className="text-sm text-muted-foreground">
                Múltiplo:
              </Label>
              <Input
                id="multiplier-revenue"
                type="number"
                step="0.1"
                value={methods.revenue?.multiplier || 1.2}
                onChange={(e) => updateMethod('revenue', 'multiplier', parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                (Sugerido: 0.6-2.0)
              </span>
            </div>
          )}
        </div>

        {/* Net Profit Method */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="method-netprofit"
              checked={methods.netProfit?.enabled}
              onCheckedChange={(checked) => updateMethod('netProfit', 'enabled', checked as boolean)}
            />
            <Label htmlFor="method-netprofit" className="text-base font-medium cursor-pointer">
              Valoración por Beneficio Neto (P/E Ratio)
            </Label>
          </div>
          {methods.netProfit?.enabled && (
            <div className="ml-6 flex items-center gap-4">
              <Label htmlFor="multiplier-netprofit" className="text-sm text-muted-foreground">
                Múltiplo:
              </Label>
              <Input
                id="multiplier-netprofit"
                type="number"
                step="0.1"
                value={methods.netProfit?.multiplier || 15.0}
                onChange={(e) => updateMethod('netProfit', 'multiplier', parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                (Sugerido: 8-25)
              </span>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onOpenMultiplesConfig}
          className="w-full"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Ver Múltiplos por Sector
        </Button>
      </CardContent>
    </Card>
  );
}
