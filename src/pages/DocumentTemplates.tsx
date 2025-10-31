import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, FileSpreadsheet, FileCode } from "lucide-react";
import { toast } from "sonner";

export default function DocumentTemplates() {
  // Fetch active templates from database
  const { data: templates, isLoading } = useQuery({
    queryKey: ['public-templates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      return data || [];
    }
  });

  const getIconForFormat = (format: string) => {
    switch (format?.toUpperCase()) {
      case 'XLSX':
      case 'XLS':
        return FileSpreadsheet;
      case 'PDF':
      case 'DOCX':
      case 'DOC':
        return FileText;
      default:
        return FileCode;
    }
  };

  const handleDownload = async (template: any) => {
    const content = template.content as any;
    
    // If it has file_url (physical file), download it
    if (content?.file_url) {
      try {
        window.open(content.file_url, '_blank');
        toast.success('Descargando documento...');
      } catch (error) {
        toast.error('Error al descargar');
      }
    } 
    // If it's HTML template, generate and download
    else if (content?.content) {
      try {
        const blob = new Blob([content.content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${template.name}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Documento descargado');
      } catch (error) {
        toast.error('Error al generar documento');
      }
    } else {
      toast.error('No hay contenido disponible para descargar');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modelos de Documentos</h1>
        <p className="text-muted-foreground mt-2">
          Descarga plantillas profesionales para tus valoraciones y análisis
        </p>
      </div>

      {templates && templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No hay documentos disponibles en este momento
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates?.map((template) => {
          const content = template.content as any;
          const format = content?.format || 'HTML';
          const Icon = getIconForFormat(format);
          
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                    {format}
                  </span>
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
                <CardDescription>
                  {template.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground capitalize">
                    {template.template_type}
                  </span>
                  <Button 
                    onClick={() => handleDownload(template)}
                    size="sm"
                    className="gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
