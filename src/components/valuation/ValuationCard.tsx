import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Valuation } from "@/hooks/useValuations";
import { useNavigate } from "react-router-dom";

interface ValuationCardProps {
  valuation: Valuation;
  onToggleComplete: (id: string, completed: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ValuationCard({ valuation, onToggleComplete, className, style }: ValuationCardProps) {
  const navigate = useNavigate();

  const totalRevenue = Number(valuation.revenue_1) + Number(valuation.revenue_2);
  const totalCosts = Number(valuation.personnel_costs_1) + Number(valuation.other_costs_1) + 
                     Number(valuation.personnel_costs_2) + Number(valuation.other_costs_2);
  const ebitda = totalRevenue - totalCosts;

  return (
    <Card
      className={`group hover:scale-[1.02] transition-all duration-200 hover:shadow-lg cursor-pointer ${className}`}
      style={style}
      onClick={() => navigate(`/valuation/${valuation.id}`)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3 flex-1">
          <Checkbox
            checked={valuation.completed}
            onCheckedChange={(checked) => {
              onToggleComplete(valuation.id, checked as boolean);
            }}
            onClick={(e) => e.stopPropagation()}
            className="transition-transform group-hover:scale-110"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{valuation.title}</h3>
            <div className="flex gap-2 flex-wrap">
              {valuation.tags?.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <StatusBadge status={valuation.status} />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Ingresos Totales</p>
            <p className="font-semibold text-base">{formatCurrency(totalRevenue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">EBITDA</p>
            <p className="font-semibold text-base">{formatCurrency(ebitda)}</p>
          </div>
        </div>
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {new Date(valuation.updated_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
