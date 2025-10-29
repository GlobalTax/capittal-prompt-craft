import { useState } from 'react';
import { useSectorMultiples } from '@/hooks/useSectorMultiples';
import { useSectorMultiplesManagement } from '@/hooks/useSectorMultiplesManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, TrendingUp } from 'lucide-react';
import { SectorMultiples } from '@/repositories/SectorDataRepository';
import { Skeleton } from '@/components/ui/skeleton';

interface SectorFormData extends Omit<SectorMultiples, 'id'> {}

export default function SectorMultiplesManagement() {
  const { sectorMultiples, loading, refetch } = useSectorMultiples();
  const { createMutation, updateMutation, deleteMutation } = useSectorMultiplesManagement();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorMultiples | null>(null);
  const [deletingSectorId, setDeletingSectorId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<SectorFormData>({
    sector_code: '',
    sector_name: '',
    revenue_multiple_min: 0,
    revenue_multiple_avg: 0,
    revenue_multiple_max: 0,
    ebitda_multiple_min: 0,
    ebitda_multiple_avg: 0,
    ebitda_multiple_max: 0,
    pe_ratio_min: 0,
    pe_ratio_avg: 0,
    pe_ratio_max: 0,
  });

  const resetForm = () => {
    setFormData({
      sector_code: '',
      sector_name: '',
      revenue_multiple_min: 0,
      revenue_multiple_avg: 0,
      revenue_multiple_max: 0,
      ebitda_multiple_min: 0,
      ebitda_multiple_avg: 0,
      ebitda_multiple_max: 0,
      pe_ratio_min: 0,
      pe_ratio_avg: 0,
      pe_ratio_max: 0,
    });
    setEditingSector(null);
  };

  const handleOpenDialog = (sector?: SectorMultiples) => {
    if (sector) {
      setEditingSector(sector);
      setFormData({
        sector_code: sector.sector_code,
        sector_name: sector.sector_name,
        revenue_multiple_min: sector.revenue_multiple_min,
        revenue_multiple_avg: sector.revenue_multiple_avg,
        revenue_multiple_max: sector.revenue_multiple_max,
        ebitda_multiple_min: sector.ebitda_multiple_min,
        ebitda_multiple_avg: sector.ebitda_multiple_avg,
        ebitda_multiple_max: sector.ebitda_multiple_max,
        pe_ratio_min: sector.pe_ratio_min,
        pe_ratio_avg: sector.pe_ratio_avg,
        pe_ratio_max: sector.pe_ratio_max,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (editingSector) {
      await updateMutation.mutateAsync({ id: editingSector.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    handleCloseDialog();
    refetch();
  };

  const handleDeleteClick = (id: string) => {
    setDeletingSectorId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingSectorId) {
      await deleteMutation.mutateAsync(deletingSectorId);
      setDeleteDialogOpen(false);
      setDeletingSectorId(null);
      refetch();
    }
  };

  const filteredSectors = sectorMultiples.filter(sector =>
    sector.sector_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sector.sector_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8" />
            Gestión de Múltiplos por Sector
          </h1>
          <p className="text-muted-foreground mt-2">
            Administra los múltiplos de valoración para cada sector de actividad
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Sector
        </Button>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar por nombre o código de sector..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead className="text-center">EBITDA (Min/Avg/Max)</TableHead>
              <TableHead className="text-center">Revenue (Min/Avg/Max)</TableHead>
              <TableHead className="text-center">P/E (Min/Avg/Max)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))}
              </>
            ) : filteredSectors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No se encontraron sectores
                </TableCell>
              </TableRow>
            ) : (
              filteredSectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="font-mono text-xs">{sector.sector_code}</TableCell>
                  <TableCell className="font-medium">{sector.sector_name}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs">
                      {sector.ebitda_multiple_min.toFixed(1)}x / 
                      <span className="font-bold mx-1">{sector.ebitda_multiple_avg.toFixed(1)}x</span> / 
                      {sector.ebitda_multiple_max.toFixed(1)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs">
                      {sector.revenue_multiple_min.toFixed(1)}x / 
                      <span className="font-bold mx-1">{sector.revenue_multiple_avg.toFixed(1)}x</span> / 
                      {sector.revenue_multiple_max.toFixed(1)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs">
                      {sector.pe_ratio_min.toFixed(1)}x / 
                      <span className="font-bold mx-1">{sector.pe_ratio_avg.toFixed(1)}x</span> / 
                      {sector.pe_ratio_max.toFixed(1)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(sector)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(sector.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSector ? 'Editar Sector' : 'Nuevo Sector'}
            </DialogTitle>
            <DialogDescription>
              {editingSector
                ? 'Modifica los múltiplos de valoración para este sector'
                : 'Agrega un nuevo sector con sus múltiplos de valoración'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sector_code">Código del Sector</Label>
                <Input
                  id="sector_code"
                  value={formData.sector_code}
                  onChange={(e) => setFormData({ ...formData, sector_code: e.target.value.toLowerCase() })}
                  placeholder="tech, retail, manufacturing..."
                  disabled={!!editingSector}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sector_name">Nombre del Sector</Label>
                <Input
                  id="sector_name"
                  value={formData.sector_name}
                  onChange={(e) => setFormData({ ...formData, sector_name: e.target.value })}
                  placeholder="Tecnología, Retail..."
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Múltiplos de EBITDA</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ebitda_min">Mínimo</Label>
                  <Input
                    id="ebitda_min"
                    type="number"
                    step="0.1"
                    value={formData.ebitda_multiple_min}
                    onChange={(e) => setFormData({ ...formData, ebitda_multiple_min: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ebitda_avg">Promedio</Label>
                  <Input
                    id="ebitda_avg"
                    type="number"
                    step="0.1"
                    value={formData.ebitda_multiple_avg}
                    onChange={(e) => setFormData({ ...formData, ebitda_multiple_avg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ebitda_max">Máximo</Label>
                  <Input
                    id="ebitda_max"
                    type="number"
                    step="0.1"
                    value={formData.ebitda_multiple_max}
                    onChange={(e) => setFormData({ ...formData, ebitda_multiple_max: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">Múltiplos de Revenue</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="revenue_min">Mínimo</Label>
                  <Input
                    id="revenue_min"
                    type="number"
                    step="0.1"
                    value={formData.revenue_multiple_min}
                    onChange={(e) => setFormData({ ...formData, revenue_multiple_min: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue_avg">Promedio</Label>
                  <Input
                    id="revenue_avg"
                    type="number"
                    step="0.1"
                    value={formData.revenue_multiple_avg}
                    onChange={(e) => setFormData({ ...formData, revenue_multiple_avg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="revenue_max">Máximo</Label>
                  <Input
                    id="revenue_max"
                    type="number"
                    step="0.1"
                    value={formData.revenue_multiple_max}
                    onChange={(e) => setFormData({ ...formData, revenue_multiple_max: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">P/E Ratio</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pe_min">Mínimo</Label>
                  <Input
                    id="pe_min"
                    type="number"
                    step="0.1"
                    value={formData.pe_ratio_min}
                    onChange={(e) => setFormData({ ...formData, pe_ratio_min: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pe_avg">Promedio</Label>
                  <Input
                    id="pe_avg"
                    type="number"
                    step="0.1"
                    value={formData.pe_ratio_avg}
                    onChange={(e) => setFormData({ ...formData, pe_ratio_avg: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pe_max">Máximo</Label>
                  <Input
                    id="pe_max"
                    type="number"
                    step="0.1"
                    value={formData.pe_ratio_max}
                    onChange={(e) => setFormData({ ...formData, pe_ratio_max: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingSector ? 'Guardar Cambios' : 'Crear Sector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente este sector
              y sus múltiplos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
