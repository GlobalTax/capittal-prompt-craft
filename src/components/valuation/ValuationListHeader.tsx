import { Calculator, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ValuationListHeaderProps {
  totalCount: number;
  inProgressCount: number;
  completedCount: number;
  totalEBITDA: number;
  onNewClick: () => void;
}

export function ValuationListHeader({
  totalCount,
  inProgressCount,
  completedCount,
  totalEBITDA,
  onNewClick,
}: ValuationListHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-white border-b">
      {/* Header con gradient unificado */}
      <div className="bg-white">
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-primary">
                <Calculator className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-semibold text-primary">
                Todas las Valoraciones
              </h1>
            </div>
            <Button onClick={onNewClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Valoración
            </Button>
          </div>

          {/* Mini KPIs Consolidados */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">En Progreso</p>
              <p className="text-2xl font-bold text-primary">{inProgressCount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Completadas</p>
              <p className="text-2xl font-bold text-success">{completedCount}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">EBITDA Total</p>
              <p className="text-2xl font-bold">{totalEBITDA.toLocaleString()}€</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
