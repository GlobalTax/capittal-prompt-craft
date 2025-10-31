import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";

// Component with all the logic and hooks
function TemplateManagementContent() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Valoración",
    file: null as File | null
  });

  const { data: templates } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_templates')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const uploadTemplate = useMutation({
    mutationFn: async () => {
      if (!formData.file) throw new Error('No file selected');
      
      setIsUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${formData.name.replace(/\s+/g, '-')}.${fileExt}`;
      const filePath = `${formData.category}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('templates')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('document_templates')
        .insert({
          name: formData.name,
          description: formData.description,
          template_type: formData.category,
          content: {
            file_path: filePath,
            file_url: publicUrl,
            format: fileExt?.toUpperCase() || 'UNKNOWN',
            size_bytes: formData.file.size
          },
          created_by: user?.id
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Documento subido correctamente');
      setFormData({ name: "", description: "", category: "Valoración", file: null });
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error('Error al subir documento');
      console.error(error);
      setIsUploading(false);
    }
  });

  const toggleTemplate = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('document_templates')
        .update({ is_active: !isActive })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Estado actualizado');
    }
  });

  const deleteTemplate = useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Only attempt storage deletion if there's a valid file path
      if (filePath && filePath.trim() !== '') {
        const { error: storageError } = await supabase.storage
          .from('templates')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Storage deletion failed:', storageError);
          // Don't throw error, continue with DB deletion
        }
      }

      // Always delete from database
      const { error: dbError } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      toast.success('Documento eliminado');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Error al eliminar documento');
    }
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Documentos</h1>
          <p className="text-muted-foreground">Administrar plantillas y recursos</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Subir Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Subir Nuevo Documento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Modelo de Valoración..."
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del documento..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Categoría</Label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Valoración">Valoración</SelectItem>
                    <SelectItem value="Due Diligence">Due Diligence</SelectItem>
                    <SelectItem value="Informes">Informes</SelectItem>
                    <SelectItem value="Contratos">Contratos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Archivo</Label>
                <Input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Validate file size (max 20MB)
                      if (file.size > 20 * 1024 * 1024) {
                        toast.error('El archivo es demasiado grande (máx 20MB)');
                        return;
                      }
                      setFormData({ ...formData, file });
                    }
                  }}
                  accept=".xlsx,.xls,.pdf,.docx,.doc"
                />
                {formData.file && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.file.name} ({(formData.file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <Button 
                onClick={() => uploadTemplate.mutate()}
                disabled={!formData.name || !formData.file || isUploading}
                className="w-full"
              >
                {isUploading ? "Subiendo..." : "Subir Documento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentos Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Descargas</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates?.map((template) => {
                const content = template.content as any;
                return (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.template_type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{content?.format || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>0</TableCell>
                    <TableCell>
                      <Badge variant={template.is_active ? "default" : "secondary"}>
                        {template.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleTemplate.mutate({ id: template.id, isActive: template.is_active })}
                        >
                          {template.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTemplate.mutate({ id: template.id, filePath: content?.file_path || '' })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Wrapper component that handles authorization
export default function TemplateManagement() {
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Verificando permisos...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground">No tienes permisos para acceder a esta página.</p>
        </Card>
      </div>
    );
  }

  return <TemplateManagementContent />;
}
