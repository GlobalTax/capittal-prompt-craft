import { useState, useMemo } from 'react';
import { useValuations, ValuationType, Valuation } from '@/hooks/useValuations';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
import { ValuationTable } from './ValuationTable';
import { ValuationListHeader } from './ValuationListHeader';
import { ValuationTypeSelector } from './ValuationTypeSelector';
import { ValuationTypeBadge } from './ValuationTypeBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Building2, Users, Target } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { generateValuationPDF } from '@/components/reports/ValuationPDFExporter';

export function ValuationList() {
  const { valuations, loading, createValuation, updateValuation, deleteValuation } = useValuations();
  const { profile: advisorProfile, loading: profileLoading } = useAdvisorProfile();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<ValuationType | 'all'>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<ValuationType>('own_business');
  const currentYear = new Date().getFullYear();
  const [closedYear, setClosedYear] = useState((currentYear - 1).toString());
  const [projectedYear, setProjectedYear] = useState(currentYear.toString());
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

  // Calcular estadísticas
  const stats = useMemo(() => {
    const total = filteredValuations.length;
    const inProgress = filteredValuations.filter(v => v.status === 'in_progress').length;
    const completed = filteredValuations.filter(v => v.status === 'completed').length;
    const totalEBITDA = filteredValuations.reduce((sum, v) => {
      // Usar año 2 (proyectado) para EBITDA
      const revenue = (v.revenue_2 || 0) + (v.other_revenue_2 || 0);
      const costs = (v.personnel_costs_2 || 0) + (v.other_costs_2 || 0);
      return sum + (revenue - costs);
    }, 0);
    return { total, inProgress, completed, totalEBITDA };
  }, [filteredValuations]);

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;
    
    // Validar años
    if (closedYear === projectedYear) {
      toast({
        title: 'Error en años',
        description: 'Los años comparativos deben ser distintos',
        variant: 'destructive',
      });
      return;
    }
    
    const newValuation = await createValuation(newTitle, [], newType, {
      closedYear,
      projectedYear,
    });
    
    if (newValuation) {
      setShowNewDialog(false);
      setNewTitle('');
      setNewType('own_business');
      setClosedYear((currentYear - 1).toString());
      setProjectedYear(currentYear.toString());
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
      navigate('/settings?tab=branding');
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

  // Calcular stats por tipo para los pills
  const typeStats = useMemo(() => {
    const ownBusiness = valuations.filter(v => v.valuation_type === 'own_business').length;
    const clientBusiness = valuations.filter(v => v.valuation_type === 'client_business').length;
    const acquisition = valuations.filter(v => v.valuation_type === 'potential_acquisition').length;
    return { ownBusiness, clientBusiness, acquisition };
  }, [valuations]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header unificado */}
      <ValuationListHeader
        totalCount={stats.total}
        inProgressCount={stats.inProgress}
        completedCount={stats.completed}
        totalEBITDA={stats.totalEBITDA}
        onNewClick={() => setShowNewDialog(true)}
      />

      {/* Filters */}
      <div className="container px-4 py-6 space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar valoraciones, clientes, empresas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Pills de filtro por tipo */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground mr-2">Filtrar por tipo:</span>
          <Badge
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer hover:bg-accent transition-colors"
            onClick={() => setTypeFilter('all')}
          >
            Todas: {valuations.length}
          </Badge>
          <Badge
            variant={typeFilter === 'own_business' ? 'default' : 'outline'}
            className="cursor-pointer bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors gap-1"
            onClick={() => setTypeFilter('own_business')}
          >
            <Building2 className="w-3 h-3" />
            Mi Negocio: {typeStats.ownBusiness}
          </Badge>
          <Badge
            variant={typeFilter === 'client_business' ? 'default' : 'outline'}
            className="cursor-pointer bg-success/10 text-success border-success/20 hover:bg-success/20 transition-colors gap-1"
            onClick={() => setTypeFilter('client_business')}
          >
            <Users className="w-3 h-3" />
            Clientes: {typeStats.clientBusiness}
          </Badge>
          <Badge
            variant={typeFilter === 'potential_acquisition' ? 'default' : 'outline'}
            className="cursor-pointer bg-warning/10 text-warning border-warning/20 hover:bg-warning/20 transition-colors gap-1"
            onClick={() => setTypeFilter('potential_acquisition')}
          >
            <Target className="w-3 h-3" />
            Objetivos: {typeStats.acquisition}
          </Badge>
        </div>
        
        {/* Pills de filtro por estado */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground mr-2">Filtrar por estado:</span>
          {[
            { value: 'all', label: 'Todas' },
            { value: 'draft', label: 'Borradores' },
            { value: 'in_progress', label: 'En Progreso' },
            { value: 'completed', label: 'Completadas' }
          ].map((status) => (
            <Badge
              key={status.value}
              variant={statusFilter === status.value ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setStatusFilter(status.value)}
            >
              {status.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="container px-4 pb-20 md:pb-8">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : filteredValuations.length === 0 ? (
          <div className="text-center py-12 border rounded-lg bg-white">
            <p className="text-muted-foreground mb-4">No hay valoraciones todavía</p>
            <Button onClick={() => setShowNewDialog(true)}>
              Crear tu primera valoración
            </Button>
          </div>
        ) : (
          <ValuationTable
            valuations={filteredValuations}
            onToggleComplete={handleToggleComplete}
            onEdit={(id) => navigate(`/valuation/${id}`)}
            onGeneratePDF={handleGeneratePDF}
            onDelete={handleDelete}
            generatingPDF={generatingPDF}
          />
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
              <ValuationTypeSelector 
                value={newType} 
                onChange={setNewType}
              />
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
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closedYear">Año Cerrado (Comparativo)</Label>
                <Input
                  id="closedYear"
                  type="number"
                  min="2000"
                  max={currentYear}
                  value={closedYear}
                  onChange={(e) => setClosedYear(e.target.value)}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectedYear">Año Estimado (En Curso)</Label>
                <Input
                  id="projectedYear"
                  type="number"
                  min="2000"
                  max={currentYear + 5}
                  value={projectedYear}
                  onChange={(e) => setProjectedYear(e.target.value)}
                  placeholder="2025"
                />
              </div>
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
