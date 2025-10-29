import { Valuation } from '@/hooks/useValuations';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Users, Target, MoreVertical, Edit, FileText, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatusBadge } from './StatusBadge';

interface ValuationTableRowProps {
  valuation: Valuation;
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
  onGeneratePDF: (valuation: Valuation) => void;
  onDelete: (id: string) => void;
  isGeneratingPDF: boolean;
}

export function ValuationTableRow({
  valuation,
  onToggleComplete,
  onEdit,
  onGeneratePDF,
  onDelete,
  isGeneratingPDF,
}: ValuationTableRowProps) {
  // Calcular métricas usando año 2 (proyectado)
  const totalRevenue = (valuation.revenue_2 || 0) + (valuation.other_revenue_2 || 0);
  const totalCosts = (valuation.personnel_costs_2 || 0) + (valuation.other_costs_2 || 0);
  const ebitda = totalRevenue - totalCosts;

  // Configuración de tipo
  const typeConfig = {
    own_business: { icon: Building2, label: 'Mi Negocio', color: 'bg-primary/10 text-primary' },
    client_business: { icon: Users, label: 'Cliente', color: 'bg-success/10 text-success' },
    potential_acquisition: { icon: Target, label: 'Objetivo', color: 'bg-accent/10 text-accent' },
  }[valuation.valuation_type || 'own_business'];

  const TypeIcon = typeConfig.icon;

  // Nombre de cliente/empresa
  const clientName =
    valuation.valuation_type === 'client_business'
      ? valuation.client_company || valuation.client_name || '—'
      : valuation.valuation_type === 'potential_acquisition'
      ? valuation.target_company_name || '—'
      : '—';

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => onEdit(valuation.id)}
    >
      {/* Checkbox */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={valuation.completed}
          onCheckedChange={(checked) =>
            onToggleComplete(valuation.id, checked as boolean)
          }
        />
      </TableCell>

      {/* Tipo */}
      <TableCell>
        <Badge variant="outline" className={`gap-1 ${typeConfig.color}`}>
          <TypeIcon className="h-3 w-3" />
          {typeConfig.label}
        </Badge>
      </TableCell>

      {/* Título */}
      <TableCell>
        <div className="font-medium">{valuation.title}</div>
        {valuation.tags && valuation.tags.length > 0 && (
          <div className="flex gap-1 mt-1">
            {valuation.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </TableCell>

      {/* Cliente/Empresa */}
      <TableCell className="text-muted-foreground">{clientName}</TableCell>

      {/* Ingresos */}
      <TableCell className="text-right font-medium">
        {totalRevenue.toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}
      </TableCell>

      {/* EBITDA */}
      <TableCell className="text-right">
        <span className={ebitda >= 0 ? 'text-success font-semibold' : 'text-destructive font-semibold'}>
          {ebitda.toLocaleString('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </span>
      </TableCell>

      {/* Estado */}
      <TableCell>
        <StatusBadge status={valuation.status as 'draft' | 'in_progress' | 'completed'} />
      </TableCell>

      {/* Última actualización */}
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(valuation.updated_at || valuation.created_at), {
          addSuffix: true,
          locale: es,
        })}
      </TableCell>

      {/* Acciones */}
      <TableCell onClick={(e) => e.stopPropagation()} className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(valuation.id)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onGeneratePDF(valuation)}
              disabled={isGeneratingPDF}
            >
              <FileText className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? 'Generando...' : 'Generar PDF'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(valuation.id)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
