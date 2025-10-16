import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { Valuation } from "@/hooks/useValuations";
import { useNavigate } from "react-router-dom";
import { Building2, Target, Users } from "lucide-react";

interface ValuationCardProps {
  valuation: Valuation;
  onToggleComplete: (id: string, completed: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ValuationCard = React.memo(function ValuationCard({ valuation, onToggleComplete, className, style }: ValuationCardProps) {
  const navigate = useNavigate();

  const totalRevenue = Number(valuation.revenue_1) + Number(valuation.revenue_2);
  const totalCosts = Number(valuation.personnel_costs_1) + Number(valuation.other_costs_1) + 
                     Number(valuation.personnel_costs_2) + Number(valuation.other_costs_2);
  const ebitda = totalRevenue - totalCosts;

  const getTypeConfig = () => {
    switch (valuation.valuation_type) {
      case 'client_business':
        return {
          icon: Users,
          label: 'Cliente',
          color: 'text-success border-success bg-success/10',
          subtitle: valuation.client_company || valuation.client_name
        };
      case 'potential_acquisition':
        return {
          icon: Target,
          label: 'Objetivo',
          color: 'text-accent border-accent bg-accent/10',
          subtitle: valuation.target_company_name
        };
      default:
        return {
          icon: Building2,
          label: 'Mi Negocio',
          color: 'text-primary border-primary bg-primary/10',
          subtitle: null
        };
    }
  };

  const typeConfig = getTypeConfig();
  const TypeIcon = typeConfig.icon;

  return (
    <Card
      className={`group transition-all duration-300 cursor-pointer hover:shadow-2xl hover:scale-[1.02] border-l-4 ${typeConfig.color.split(' ')[1]} bg-gradient-to-br from-background to-muted/20 ${className}`}
      style={style}
      onClick={() => navigate(`/valuation/${valuation.id}`)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 bg-gradient-to-r from-primary/5 to-accent/5">
        <div className="flex items-center gap-3 flex-1">
          <Checkbox
            checked={valuation.completed}
            onCheckedChange={(checked) => {
              onToggleComplete(valuation.id, checked as boolean);
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={`${typeConfig.color} text-xs`}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConfig.label}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg mb-1">{valuation.title}</h3>
            {typeConfig.subtitle && (
              <p className="text-sm text-muted-foreground mb-2">{typeConfig.subtitle}</p>
            )}
            {valuation.tags && valuation.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {valuation.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
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
});

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
