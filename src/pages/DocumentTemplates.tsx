import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, FileSpreadsheet } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Template {
  id: string;
  name: string;
  description: string;
  format: string;
  icon: typeof FileText;
  path: string;
  category: string;
}

export default function DocumentTemplates() {
  const { t } = useTranslation();

  const templates: Template[] = [
    {
      id: "1",
      name: "Modelo de Valoración",
      description: "Plantilla Excel completa para valoración de empresas",
      format: "XLSX",
      icon: FileSpreadsheet,
      path: "/templates/modelo-valoracion.xlsx",
      category: "Valoración"
    },
    {
      id: "2",
      name: "Due Diligence Checklist",
      description: "Lista de verificación para due diligence financiera",
      format: "PDF",
      icon: FileText,
      path: "/templates/due-diligence-checklist.pdf",
      category: "Due Diligence"
    },
    {
      id: "3",
      name: "Informe Financiero",
      description: "Plantilla Word para informe financiero profesional",
      format: "DOCX",
      icon: FileText,
      path: "/templates/informe-financiero.docx",
      category: "Informes"
    }
  ];

  const handleDownload = (template: Template) => {
    const link = document.createElement('a');
    link.href = template.path;
    link.download = template.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Modelos de Documentos</h1>
        <p className="text-muted-foreground mt-2">
          Descarga plantillas profesionales para tus valoraciones y análisis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Icon className="h-8 w-8 text-primary" />
                  <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                    {template.format}
                  </span>
                </div>
                <CardTitle className="mt-4">{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{template.category}</span>
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
