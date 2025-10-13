import { Building2, Target, Users } from 'lucide-react';
import { ValuationType } from '@/hooks/useValuations';
import { cn } from '@/lib/utils';

interface ValuationTypeSelectorProps {
  value: ValuationType;
  onChange: (type: ValuationType) => void;
  allowedTypes?: ValuationType[];
}

export function ValuationTypeSelector({ value, onChange, allowedTypes }: ValuationTypeSelectorProps) {
  const types = [
    {
      value: 'own_business' as ValuationType,
      label: 'Mi Negocio',
      icon: Building2,
      description: 'Valorar mi propia empresa',
      color: 'bg-primary/10 text-primary border-primary',
    },
    {
      value: 'client_business' as ValuationType,
      label: 'Cliente',
      icon: Users,
      description: 'Valorar empresa de un cliente',
      color: 'bg-success/10 text-success border-success',
    },
    {
      value: 'potential_acquisition' as ValuationType,
      label: 'Objetivo de Compra',
      icon: Target,
      description: 'Valorar posible adquisición',
      color: 'bg-warning/10 text-warning border-warning',
    },
  ];

  const filteredTypes = allowedTypes 
    ? types.filter(t => allowedTypes.includes(t.value))
    : types;

  return (
    <div className={cn(
      "grid grid-cols-1 gap-4",
      filteredTypes.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
    )}>
      {filteredTypes.map((type) => {
        const Icon = type.icon;
        const isSelected = value === type.value;

        return (
          <button
            key={type.value}
            onClick={() => onChange(type.value)}
            className={cn(
              'relative flex flex-col items-start p-4 rounded-lg border-2 transition-all',
              'hover:shadow-md',
              isSelected
                ? type.color + ' border-2'
                : 'bg-card border-border hover:border-muted-foreground/50'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <Icon className="h-5 w-5" />
              <span className="font-semibold">{type.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{type.description}</p>
            
            {isSelected && (
              <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-current" />
            )}
          </button>
        );
      })}
    </div>
  );
}
