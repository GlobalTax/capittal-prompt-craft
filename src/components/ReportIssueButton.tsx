import { useState } from 'react';
import { Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useReportIssue } from '@/hooks/useReportIssue';

interface ReportIssueButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  prefilled?: {
    issueType?: 'error' | 'bug' | 'feedback' | 'other';
    title?: string;
    description?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    errorStack?: string;
  };
}

export function ReportIssueButton({ 
  variant = 'ghost', 
  size = 'sm',
  className = '',
  prefilled 
}: ReportIssueButtonProps) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<'error' | 'bug' | 'feedback' | 'other'>(
    prefilled?.issueType || 'bug'
  );
  const [title, setTitle] = useState(prefilled?.title || '');
  const [description, setDescription] = useState(prefilled?.description || '');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>(
    prefilled?.severity || 'medium'
  );
  
  const { reportIssue, isSubmitting } = useReportIssue();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await reportIssue({
      issueType,
      title,
      description,
      severity,
      errorStack: prefilled?.errorStack,
    });

    if (result) {
      setOpen(false);
      // Reset form
      setIssueType('bug');
      setTitle('');
      setDescription('');
      setSeverity('medium');
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
        title="Reportar un problema"
      >
        <Bug className="h-4 w-4" />
        {size !== 'icon' && <span className="ml-2">Reportar problema</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Reportar un problema</DialogTitle>
              <DialogDescription>
                Describe el problema que encontraste y te responderemos pronto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="issueType">Tipo de problema</Label>
                <Select 
                  value={issueType} 
                  onValueChange={(value: any) => setIssueType(value)}
                  disabled={!!prefilled?.issueType}
                >
                  <SelectTrigger id="issueType">
                    <SelectValue placeholder="Selecciona el tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error técnico</SelectItem>
                    <SelectItem value="bug">Bug / Comportamiento inesperado</SelectItem>
                    <SelectItem value="feedback">Sugerencia / Feedback</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="severity">Severidad</Label>
                <Select 
                  value={severity} 
                  onValueChange={(value: any) => setSeverity(value)}
                  disabled={!!prefilled?.severity}
                >
                  <SelectTrigger id="severity">
                    <SelectValue placeholder="Selecciona la severidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">🔵 Baja - No afecta el trabajo</SelectItem>
                    <SelectItem value="medium">🟡 Media - Afecta algunas funciones</SelectItem>
                    <SelectItem value="high">🟠 Alta - Dificulta el trabajo</SelectItem>
                    <SelectItem value="critical">🔴 Crítica - Imposible trabajar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Resumen breve del problema..."
                  required
                  disabled={!!prefilled?.title}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción detallada</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe qué sucedió, qué esperabas que pasara, y cualquier información adicional..."
                  rows={5}
                  required
                />
              </div>

              {prefilled?.errorStack && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  ℹ️ Se incluirá información técnica del error automáticamente
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
