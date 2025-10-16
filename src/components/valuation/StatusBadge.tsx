import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'draft' | 'in_progress' | 'completed';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const variants = {
    draft: { label: 'Borrador', variant: 'outline' as const, className: 'bg-muted' },
    in_progress: { label: 'En Progreso', variant: 'default' as const, className: 'bg-primary' },
    completed: { label: 'Completada', variant: 'default' as const, className: 'bg-success' },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
