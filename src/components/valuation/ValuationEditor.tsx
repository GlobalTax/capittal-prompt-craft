import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Valuation } from '@/hooks/useValuations';
import { useAutoSave } from '@/hooks/useAutoSave';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
import { useValuationYears } from '@/hooks/useValuationYears';
import { trackFunnelEvent } from '@/lib/analytics';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { ValuationTypeSelector } from './ValuationTypeSelector';
import { ClientInfoForm } from './ClientInfoForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Trash2, StickyNote, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ValuationCalculator from '@/components/ValuationCalculator';
import { generateValuationPDF } from '@/components/reports/ValuationPDFExporter';
import { isUuid } from '@/utils/isUuid';

export function ValuationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(true);
  const { profile: advisorProfile, loading: profileLoading } = useAdvisorProfile();
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const { years: valuationYears, loading: yearsLoading } = useValuationYears(id || '');

  useEffect(() => {
    // Validar UUID antes de cualquier fetch
    if (!id || !isUuid(id)) {
      toast({
        title: 'ID inválido',
        description: 'El identificador de valoración no es válido',
        variant: 'destructive',
      });
      navigate('/valuations');
      return;
    }
    fetchValuation();
  }, [id]);

  const fetchValuation = async () => {
    try {
      const { data, error } = await supabase
        .from('valuations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setValuation(data as Valuation);
      
      // Track valuation viewed
      await trackFunnelEvent('valuation_viewed', id);
    } catch (error: any) {
      toast({
        title: 'Error al cargar',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/valuations');
    } finally {
      setLoading(false);
    }
  };

  const saveValuation = async (data: Valuation | null) => {
    if (!data) return;
    const { error } = await supabase
      .from('valuations')
      .update(data)
      .eq('id', data.id);

    if (error) throw error;
  };

  const { isSaving, lastSaved } = useAutoSave(valuation, saveValuation);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar esta valoración?')) return;
    
    try {
      const { error } = await supabase
        .from('valuations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Valoración eliminada' });
      navigate('/valuations');
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePDF = async () => {
    if (!valuation) return;

    // Verificar perfil del asesor
    if (!advisorProfile?.business_name) {
      toast({
        title: 'Perfil incompleto',
        description: 'Configura tu perfil en Ajustes > Branding antes de generar PDFs',
        variant: 'destructive',
      });
      navigate('/settings?tab=branding');
      return;
    }

    // Verificar que los datos de años estén cargados
    if (!valuationYears || valuationYears.length < 2) {
      toast({
        title: 'Datos incompletos',
        description: 'Esperando a que se carguen los datos de la valoración. Por favor intenta de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingPDF(true);
      await generateValuationPDF(valuation, advisorProfile, valuationYears);
      toast({
        title: 'PDF generado',
        description: 'El informe se ha descargado correctamente',
      });
    } catch (error: any) {
      toast({
        title: 'Error al generar PDF',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-7xl py-6 space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!valuation) return null;

  const updateField = (field: keyof Valuation, value: any) => {
    setValuation({ ...valuation, [field]: value });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container max-w-7xl flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/valuations')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Input
              value={valuation.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0"
            />
          </div>
          <div className="flex items-center gap-4">
            <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
            <Button 
              variant="default" 
              size="sm"
              onClick={handleGeneratePDF}
              disabled={generatingPDF || profileLoading || yearsLoading || !valuationYears || valuationYears.length < 2}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {generatingPDF ? 'Generando...' : 'Generar PDF'}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl py-6 px-4 space-y-6">
        {/* Formulario de Contexto */}
        <ClientInfoForm 
          valuation={valuation} 
          onUpdate={updateField} 
        />

        {/* Notas Privadas */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2">
              <StickyNote className="h-4 w-4" />
              Notas Privadas del Asesor
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <div className="space-y-2 p-4 border rounded-lg bg-card">
              <Label htmlFor="private_notes">
                Notas Privadas (no visibles para el cliente)
              </Label>
              <Textarea
                id="private_notes"
                value={valuation.private_notes || ''}
                onChange={(e) => updateField('private_notes', e.target.value)}
                placeholder="Añade aquí observaciones estratégicas, puntos clave para la negociación, etc."
                rows={6}
                className="resize-none"
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Calculadora de Valoración */}
        <ValuationCalculator valuation={valuation} onUpdate={updateField} />
      </div>
    </div>
  );
}
