import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Eye, Settings, Palette, BarChart3, PieChart, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReportGenerator = () => {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("ejecutivo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const reportTemplates = [
    {
      id: "ejecutivo",
      name: "Reporte Ejecutivo",
      description: "Resumen completo para directivos y stakeholders",
      pages: "8-12 páginas",
      sections: ["Resumen Ejecutivo", "Metodología", "Análisis Financiero", "Valoración", "Conclusiones"]
    },
    {
      id: "due-diligence",
      name: "Due Diligence Completo",
      description: "Análisis detallado para procesos de inversión",
      pages: "15-25 páginas", 
      sections: ["Análisis de Negocio", "Financiero", "Legal", "Operacional", "Riesgos", "Recomendaciones"]
    },
    {
      id: "comparativo",
      name: "Análisis Comparativo",
      description: "Comparación con empresas similares del sector",
      pages: "6-10 páginas",
      sections: ["Benchmarking", "Múltiplos", "Posicionamiento", "Ventajas Competitivas"]
    },
    {
      id: "valoracion-rapida",
      name: "Valoración Rápida",
      description: "Resumen conciso para decisiones rápidas",
      pages: "3-5 páginas",
      sections: ["Datos Clave", "Valoración", "Recomendación"]
    }
  ];

  const brandingOptions = {
    logo: "",
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
    companyName: "Capittal Consulting",
    footer: "© 2024 Capittal Consulting. Todos los derechos reservados."
  };

  const includeOptions = [
    { id: "charts", label: "Gráficos Financieros", checked: true },
    { id: "multiples", label: "Tabla de Múltiplos", checked: true },
    { id: "projections", label: "Proyecciones 5 años", checked: true },
    { id: "risks", label: "Análisis de Riesgos", checked: false },
    { id: "benchmark", label: "Benchmarking Sectorial", checked: true },
    { id: "appendix", label: "Anexos Técnicos", checked: false }
  ];

  const [selectedSections, setSelectedSections] = useState(includeOptions);

  const handleSectionChange = (id: string, checked: boolean) => {
    setSelectedSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, checked } : section
      )
    );
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setProgress(0);

    // Simulate report generation process
    const steps = [
      "Recopilando datos financieros...",
      "Generando gráficos y visualizaciones...", 
      "Calculando múltiplos y benchmarks...",
      "Redactando análisis ejecutivo...",
      "Aplicando formato y branding...",
      "Compilando documento final..."
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress((i + 1) / steps.length * 100);
      
      toast({
        title: "Generando Reporte",
        description: steps[i],
      });
    }

    setIsGenerating(false);
    
    toast({
      title: "¡Reporte Generado!",
      description: "El reporte ha sido generado exitosamente y está listo para descargar.",
    });
  };

  const previewReport = () => {
    toast({
      title: "Vista Previa",
      description: "Abriendo vista previa del reporte...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generador de Reportes</h1>
          <p className="text-muted-foreground">
            Crea reportes profesionales personalizados en PDF
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <FileText className="h-3 w-3 mr-1" />
          PDF Pro
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Configuration Panel */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Reporte</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {reportTemplates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Título del Reporte</Label>
                <Input placeholder="Valoración Empresa XYZ" />
              </div>

              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input placeholder="Nombre del cliente" />
              </div>

              <div className="space-y-2">
                <Label>Comentarios Adicionales</Label>
                <Textarea 
                  placeholder="Notas especiales para incluir en el reporte..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Branding</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre de la Empresa</Label>
                <Input defaultValue={brandingOptions.companyName} />
              </div>
              
              <div className="space-y-2">
                <Label>Color Primario</Label>
                <div className="flex space-x-2">
                  <Input type="color" defaultValue={brandingOptions.primaryColor} className="w-12 h-10" />
                  <Input defaultValue={brandingOptions.primaryColor} className="flex-1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Pie de Página</Label>
                <Textarea 
                  defaultValue={brandingOptions.footer}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="md:col-span-2 space-y-4">
          <Tabs defaultValue="template" className="space-y-4">
            <TabsList>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="sections">Secciones</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <div className="grid gap-4">
                {reportTemplates.map(template => (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-colors ${
                      reportType === template.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => setReportType(template.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="outline">{template.pages}</Badge>
                      </div>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Secciones incluidas:</Label>
                        <div className="flex flex-wrap gap-1">
                          {template.sections.map(section => (
                            <Badge key={section} variant="secondary" className="text-xs">
                              {section}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="sections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personalizar Contenido</CardTitle>
                  <CardDescription>
                    Selecciona las secciones a incluir en el reporte
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedSections.map(section => (
                    <div key={section.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={section.id}
                        checked={section.checked}
                        onCheckedChange={(checked) => handleSectionChange(section.id, !!checked)}
                      />
                      <Label htmlFor={section.id} className="flex-1 cursor-pointer">
                        {section.label}
                      </Label>
                      {section.id === 'charts' && <BarChart3 className="h-4 w-4 text-muted-foreground" />}
                      {section.id === 'multiples' && <PieChart className="h-4 w-4 text-muted-foreground" />}
                      {section.id === 'projections' && <TrendingUp className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa del Reporte</CardTitle>
                  <CardDescription>
                    Muestra cómo se verá el reporte final
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 bg-white text-black min-h-[400px]">
                    <div className="text-center mb-6">
                      <h1 className="text-2xl font-bold mb-2">Valoración Empresa XYZ</h1>
                      <p className="text-gray-600">{brandingOptions.companyName}</p>
                      <p className="text-sm text-gray-500">Fecha: {new Date().toLocaleDateString()}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <section>
                        <h2 className="text-lg font-semibold mb-2">Resumen Ejecutivo</h2>
                        <p className="text-sm text-gray-700">
                          Esta valoración presenta un análisis integral de la empresa XYZ...
                        </p>
                      </section>
                      
                      <section>
                        <h2 className="text-lg font-semibold mb-2">Datos Financieros Clave</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>Ingresos: €400.000</div>
                          <div>EBITDA: €120.000</div>
                          <div>Margen EBITDA: 30%</div>
                          <div>Empleados: 8</div>
                        </div>
                      </section>
                      
                      <section>
                        <h2 className="text-lg font-semibold mb-2">Valoración Final</h2>
                        <div className="bg-blue-50 p-4 rounded">
                          <p className="font-semibold">Valoración Estimada: €1.68M</p>
                          <p className="text-sm">Múltiplo EBITDA: 4.2x</p>
                        </div>
                      </section>
                    </div>
                    
                    <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                      {brandingOptions.footer}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generation Controls */}
          <Card>
            <CardContent className="pt-6">
              {isGenerating ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Generando reporte...</span>
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Button onClick={previewReport} variant="outline" className="flex-1">
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                  <Button onClick={generateReport} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Generar PDF
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;