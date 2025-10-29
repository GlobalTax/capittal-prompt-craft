import { Building2, Users, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ValuationType } from '@/hooks/useValuations';

interface ValuationTypeBadgeProps {
  type: ValuationType;
  showIcon?: boolean;
  showLabel?: boolean;
}

const typeBadges = {
  own_business: {
    label: 'Mi Negocio',
    variant: 'default' as const,
    icon: Building2,
    className: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
    description: 'Valoración de mi negocio/despacho',
  },
  client_business: {
    label: 'Cliente',
    variant: 'success' as const,
    icon: Users,
    className: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    description: 'Valoración de cliente',
  },
  potential_acquisition: {
    label: 'Objetivo',
    variant: 'warning' as const,
    icon: Target,
    className: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20',
    description: 'Objetivo de adquisición',
  },
};

export function ValuationTypeBadge({
  type,
  showIcon = true,
  showLabel = true,
}: ValuationTypeBadgeProps) {
  const config = typeBadges[type];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex">
            <Badge variant={config.variant} className={config.className}>
              {showIcon && <Icon className="w-3 h-3 mr-1" />}
              {showLabel && config.label}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
