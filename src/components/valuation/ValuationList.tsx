import { useState, useMemo } from 'react';
import { useValuations } from '@/hooks/useValuations';
import { ValuationCard } from './ValuationCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
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

export function ValuationList() {
  const { valuations, loading, createValuation, updateValuation } = useValuations();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  const filteredValuations = useMemo(() => {
    return valuations.filter((v) => {
      const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [valuations, searchQuery, statusFilter]);

  const handleCreateNew = async () => {
    if (!newTitle.trim()) return;
    const newValuation = await createValuation(newTitle);
    if (newValuation) {
      setShowNewDialog(false);
      setNewTitle('');
      navigate(`/valuation/${newValuation.id}`);
    }
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    updateValuation(id, { 
      completed,
      status: completed ? 'completed' : 'in_progress'
    });
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
              placeholder="Buscar valoraciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
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
              <ValuationCard
                key={valuation.id}
                valuation={valuation}
                onToggleComplete={handleToggleComplete}
                style={{ animationDelay: `${index * 50}ms` }}
                className="animate-fade-in"
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog Nueva Valoración */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Valoración</DialogTitle>
            <DialogDescription>
              Crea una nueva valoración para tu empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
