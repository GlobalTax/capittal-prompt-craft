import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSectorMultiples } from '@/hooks/useSectorMultiples';
import { Valuation } from '@/hooks/useValuations';
import { Loader2 } from 'lucide-react';

interface SectorMultiplesConfigProps {
  valuation: Valuation;
  onUpdate: (field: string, value: any) => void;
  onClose: () => void;
}

export function SectorMultiplesConfig({ valuation, onUpdate, onClose }: SectorMultiplesConfigProps) {
  const { sectorMultiples, loading } = useSectorMultiples();
  const [selectedSectorCode, setSelectedSectorCode] = useState<string>(
    valuation.metadata?.sectorCode || ''
  );

  const applyMultiples = (useAverage: boolean) => {
    const sector = sectorMultiples.find(s => s.sector_code === selectedSectorCode);
    if (!sector) return;

    const updatedMethods = {
      ebitda: {
        enabled: valuation.metadata?.valuationMethods?.ebitda?.enabled ?? true,
        multiplier: useAverage ? sector.ebitda_multiple_avg : sector.ebitda_multiple_min
      },
      revenue: {
        enabled: valuation.metadata?.valuationMethods?.revenue?.enabled ?? true,
        multiplier: useAverage ? sector.revenue_multiple_avg : sector.revenue_multiple_min
      },
      netProfit: {
        enabled: valuation.metadata?.valuationMethods?.netProfit?.enabled ?? false,
        multiplier: useAverage ? sector.pe_ratio_avg : sector.pe_ratio_min
      }
    };

    onUpdate('metadata', {
      ...valuation.metadata,
      valuationMethods: updatedMethods,
      sectorCode: selectedSectorCode
    });

    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Múltiplos por Sector</DialogTitle>
          <DialogDescription>
            Selecciona tu sector para aplicar múltiplos sugeridos
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <RadioGroup value={selectedSectorCode} onValueChange={setSelectedSectorCode}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead className="text-right">EBITDA</TableHead>
                    <TableHead className="text-right">Facturación</TableHead>
                    <TableHead className="text-right">P/E Ratio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectorMultiples.map((sector) => (
                    <TableRow key={sector.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <RadioGroupItem value={sector.sector_code} id={sector.sector_code} />
                      </TableCell>
                      <TableCell>
                        <Label htmlFor={sector.sector_code} className="cursor-pointer">
                          {sector.sector_name}
                        </Label>
                      </TableCell>
                      <TableCell className="text-right">
                        {sector.ebitda_multiple_min.toFixed(1)}-{sector.ebitda_multiple_max.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {sector.revenue_multiple_min.toFixed(1)}-{sector.revenue_multiple_max.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {sector.pe_ratio_min.toFixed(0)}-{sector.pe_ratio_max.toFixed(0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </RadioGroup>

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                variant="outline"
                onClick={() => applyMultiples(false)}
                disabled={!selectedSectorCode}
              >
                Aplicar Múltiplos Conservadores
              </Button>
              <Button
                onClick={() => applyMultiples(true)}
                disabled={!selectedSectorCode}
              >
                Aplicar Múltiplos Promedio
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
