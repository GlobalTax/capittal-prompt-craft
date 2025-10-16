import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'draft' | 'in_progress' | 'completed';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    draft: { 
      label: 'Borrador', 
      variant: 'outline' as const, 
      className: 'bg-muted border-border text-muted-foreground' 
    },
    in_progress: { 
      label: 'En Progreso', 
      variant: 'default' as const, 
      className: 'bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-shadow' 
    },
    completed: { 
      label: 'Completada', 
      variant: 'default' as const, 
      className: 'bg-success text-success-foreground shadow-md hover:shadow-lg transition-shadow' 
    },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={`${config.className} px-3 py-1`}>
      {config.label}
    </Badge>
  );
}
