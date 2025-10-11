import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Valuation } from '@/hooks/useValuations';
import { useAutoSave } from '@/hooks/useAutoSave';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export function ValuationEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [valuation, setValuation] = useState<Valuation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchValuation();
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
    } catch (error: any) {
      toast({
        title: 'Error al cargar',
        description: error.message,
        variant: 'destructive',
      });
      navigate('/valuation');
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
      navigate('/valuation');
    } catch (error: any) {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        variant: 'destructive',
      });
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/valuation')}>
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
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="h-5 w-5 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-7xl py-6 px-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos Financieros - {valuation.year_1}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Ingresos</label>
              <Input
                type="number"
                value={valuation.revenue_1}
                onChange={(e) => updateField('revenue_1', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Costes de Personal</label>
              <Input
                type="number"
                value={valuation.personnel_costs_1}
                onChange={(e) => updateField('personnel_costs_1', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Datos Financieros - {valuation.year_2}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground">Ingresos</label>
              <Input
                type="number"
                value={valuation.revenue_2}
                onChange={(e) => updateField('revenue_2', Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Costes de Personal</label>
              <Input
                type="number"
                value={valuation.personnel_costs_2}
                onChange={(e) => updateField('personnel_costs_2', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
