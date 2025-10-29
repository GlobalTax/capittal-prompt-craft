import { Valuation } from '@/hooks/useValuations';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ValuationTableRow } from './ValuationTableRow';

interface ValuationTableProps {
  valuations: Valuation[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
  onGeneratePDF: (valuation: Valuation) => void;
  onDelete: (id: string) => void;
  generatingPDF: string | null;
}

export function ValuationTable({
  valuations,
  onToggleComplete,
  onEdit,
  onGeneratePDF,
  onDelete,
  generatingPDF,
}: ValuationTableProps) {
  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[140px]">Tipo</TableHead>
            <TableHead className="min-w-[200px]">Título</TableHead>
            <TableHead className="min-w-[180px]">Cliente/Empresa</TableHead>
            <TableHead className="text-right w-[130px]">Ingresos</TableHead>
            <TableHead className="text-right w-[130px]">EBITDA</TableHead>
            <TableHead className="w-[140px]">Estado</TableHead>
            <TableHead className="w-[160px]">Actualización</TableHead>
            <TableHead className="w-[80px] text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {valuations.length === 0 ? (
            <TableRow>
              <td colSpan={8} className="text-center py-12 text-muted-foreground">
                No hay valoraciones que mostrar
              </td>
            </TableRow>
          ) : (
            valuations.map((valuation) => (
              <ValuationTableRow
                key={valuation.id}
                valuation={valuation}
                onToggleComplete={onToggleComplete}
                onEdit={onEdit}
                onGeneratePDF={onGeneratePDF}
                onDelete={onDelete}
                isGeneratingPDF={generatingPDF === valuation.id}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
