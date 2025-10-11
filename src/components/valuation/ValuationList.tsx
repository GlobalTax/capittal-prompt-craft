import { useState, useMemo } from 'react';
import { useValuations, ValuationType, Valuation } from '@/hooks/useValuations';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
import { ValuationCard } from './ValuationCard';
import { ValuationTypeSelector } from './ValuationTypeSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreVertical, FileText, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateValuationPDF } from '@/components/reports/ValuationPDFExporter';

export function ValuationList() {
  const { valuations, loading, createValuation, updateValuation, deleteValuation } = useValuations();
  const { profile: advisorProfile, loading: profileLoading } = useAdvisorProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ValuationType>('own_business');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const filteredValuations = useMemo(() => {
    return valuations.filter((v) => {
      const matchesSearch = 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.client_company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.target_company_name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      const matchesType = typeFilter === 'all' || v.valuation_type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [valuations, searchQuery, statusFilter, typeFilter]);

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;
    const newValuation = await createValuation(newTitle, [], newType);
    if (newValuation) {
      setShowNewDialog(false);
      setNewTitle('');
      setNewType('own_business');
      navigate(`/valuation/${newValuation.id}`);
    }
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateValuation(id, { 
      completed,
      status: completed ? 'completed' : 'in_progress'
    });
  };

  const handleGeneratePDF = async (valuation: Valuation) => {
    // Verificar perfil del asesor
    if (!advisorProfile?.business_name) {
      toast({
        title: 'Perfil incompleto',
        description: 'Configura tu perfil en Ajustes > Branding antes de generar PDFs',
        variant: 'destructive',
      });
      navigate('/settings');
      return;
    }

    try {
      setGeneratingPDF(valuation.id);
      await generateValuationPDF(valuation, advisorProfile);
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
      setGeneratingPDF(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta valoración?')) return;
    await deleteValuation(id);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex items-center justify-between h-16 px-4">
          <h1 className="text-2xl font-semibold">Valoraciones</h1>
          <Button onClick={() => setShowNewDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Valoración
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="container px-4 py-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar valoraciones, clientes, empresas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Type Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-2">Tipo:</span>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'own_business', label: 'Mi Negocio' },
            { value: 'client_business', label: 'Clientes' },
            { value: 'potential_acquisition', label: 'Objetivos' }
          ].map((type) => (
            <Button
              key={type.value}
              variant={typeFilter === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
        
        {/* Status Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center mr-2">Estado:</span>
          {['all', 'draft', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Todas' : status === 'draft' ? 'Borradores' : status === 'in_progress' ? 'En Progreso' : 'Completadas'}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="container px-4 pb-20 md:pb-8">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        ) : filteredValuations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No hay valoraciones todavía</p>
            <Button onClick={() => setShowNewDialog(true)}>
              Crear tu primera valoración
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredValuations.map((valuation, index) => (
              <div key={valuation.id} className="relative group">
                <ValuationCard
                  valuation={valuation}
                  onToggleComplete={handleToggleComplete}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-card/80 backdrop-blur">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/valuation/${valuation.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGeneratePDF(valuation);
                        }}
                        disabled={generatingPDF === valuation.id || profileLoading}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {generatingPDF === valuation.id ? 'Generando...' : 'Generar PDF'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(valuation.id);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog Nueva Valoración */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva Valoración</DialogTitle>
            <DialogDescription>
              Crea una nueva valoración para tu empresa, un cliente o un objetivo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>Tipo de Valoración</Label>
              <ValuationTypeSelector value={newType} onChange={setNewType} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Nombre de la Valoración</Label>
              <Input
                id="title"
                placeholder="ej: Valoración Q1 2024"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateNew();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateNew} disabled={!newTitle.trim()}>
              Crear Valoración
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
