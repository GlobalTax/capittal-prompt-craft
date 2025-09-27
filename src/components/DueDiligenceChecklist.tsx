import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ClipboardCheck, 
  Shield, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Info,
  Star
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";

interface DueDiligenceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  checked: boolean;
  notes?: string;
}

interface DueDiligenceCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  items: DueDiligenceItem[];
}

interface RiskAssessment {
  category: string;
  score: number;
  maxScore: number;
  riskLevel: "low" | "medium" | "high";
}

const DueDiligenceChecklist = () => {
  const [categories, setCategories] = useState<DueDiligenceCategory[]>([
    {
      name: "Financiero",
      icon: TrendingUp,
      color: "hsl(var(--chart-1))",
      items: [
        {
          id: "fin-1",
          category: "financial",
          title: "Estados financieros auditados últimos 3 años",
          description: "Verificar la precisión y consistencia de los reportes financieros",
          impact: "high",
          checked: false
        },
        {
          id: "fin-2",
          category: "financial",
          title: "Análisis de flujo de caja",
          description: "Evaluar la capacidad de generación de efectivo",
          impact: "high",
          checked: false
        },
        {
          id: "fin-3",
          category: "financial",
          title: "Cartera de clientes y concentración",
          description: "Analizar dependencia de clientes principales",
          impact: "high",
          checked: false
        },
        {
          id: "fin-4",
          category: "financial",
          title: "Contratos recurrentes validados",
          description: "Verificar la estabilidad de ingresos recurrentes",
          impact: "medium",
          checked: false
        },
        {
          id: "fin-5",
          category: "financial",
          title: "Análisis de márgenes por servicio",
          description: "Evaluar rentabilidad por línea de negocio",
          impact: "medium",
          checked: false
        }
      ]
    },
    {
      name: "Legal",
      icon: Shield,
      color: "hsl(var(--chart-2))",
      items: [
        {
          id: "leg-1",
          category: "legal",
          title: "Constitución y estatutos actualizados",
          description: "Verificar estructura legal y governance",
          impact: "high",
          checked: false
        },
        {
          id: "leg-2",
          category: "legal",
          title: "Licencias y permisos vigentes",
          description: "Confirmar cumplimiento regulatorio",
          impact: "high",
          checked: false
        },
        {
          id: "leg-3",
          category: "legal",
          title: "Contratos con empleados clave",
          description: "Revisar términos y cláusulas de retención",
          impact: "medium",
          checked: false
        },
        {
          id: "leg-4",
          category: "legal",
          title: "Seguros y coberturas",
          description: "Evaluar protección contra riesgos operacionales",
          impact: "medium",
          checked: false
        },
        {
          id: "leg-5",
          category: "legal",
          title: "Litigios pendientes",
          description: "Identificar exposición legal actual",
          impact: "high",
          checked: false
        }
      ]
    },
    {
      name: "Operacional",
      icon: Users,
      color: "hsl(var(--chart-3))",
      items: [
        {
          id: "op-1",
          category: "operational",
          title: "Estructura organizacional definida",
          description: "Evaluar roles, responsabilidades y jerarquías",
          impact: "medium",
          checked: false
        },
        {
          id: "op-2",
          category: "operational",
          title: "Procesos documentados",
          description: "Verificar estandarización de metodologías",
          impact: "high",
          checked: false
        },
        {
          id: "op-3",
          category: "operational",
          title: "Sistemas IT y tecnología",
          description: "Analizar infraestructura tecnológica",
          impact: "medium",
          checked: false
        },
        {
          id: "op-4",
          category: "operational",
          title: "Plan de sucesión ejecutiva",
          description: "Evaluar continuidad del liderazgo",
          impact: "high",
          checked: false
        },
        {
          id: "op-5",
          category: "operational",
          title: "Métricas de calidad y satisfacción",
          description: "Revisar KPIs de performance operacional",
          impact: "medium",
          checked: false
        }
      ]
    },
    {
      name: "Mercado",
      icon: FileText,
      color: "hsl(var(--chart-4))",
      items: [
        {
          id: "mkt-1",
          category: "market",
          title: "Análisis competitivo actualizado",
          description: "Posicionamiento vs competencia directa",
          impact: "medium",
          checked: false
        },
        {
          id: "mkt-2",
          category: "market",
          title: "Tendencias del sector",
          description: "Evaluar crecimiento y outlook del mercado",
          impact: "medium",
          checked: false
        },
        {
          id: "mkt-3",
          category: "market",
          title: "Propuesta de valor diferenciada",
          description: "Identificar ventajas competitivas sostenibles",
          impact: "high",
          checked: false
        },
        {
          id: "mkt-4",
          category: "market",
          title: "Pipeline comercial documentado",
          description: "Verificar oportunidades futuras",
          impact: "high",
          checked: false
        },
        {
          id: "mkt-5",
          category: "market",
          title: "Estrategia de marketing y ventas",
          description: "Evaluar capacidad de generación de demanda",
          impact: "medium",
          checked: false
        }
      ]
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [overallNotes, setOverallNotes] = useState<string>("");

  const handleItemCheck = (categoryIndex: number, itemIndex: number, checked: boolean) => {
    setCategories(prev => {
      const newCategories = [...prev];
      newCategories[categoryIndex].items[itemIndex].checked = checked;
      return newCategories;
    });
  };

  const handleItemNotes = (categoryIndex: number, itemIndex: number, notes: string) => {
    setCategories(prev => {
      const newCategories = [...prev];
      newCategories[categoryIndex].items[itemIndex].notes = notes;
      return newCategories;
    });
  };

  const calculateCategoryScore = (category: DueDiligenceCategory) => {
    const totalItems = category.items.length;
    const completedItems = category.items.filter(item => item.checked).length;
    return (completedItems / totalItems) * 100;
  };

  const calculateRiskAssessment = (): RiskAssessment[] => {
    return categories.map(category => {
      const totalScore = category.items.length;
      const currentScore = category.items.filter(item => item.checked).length;
      const percentage = (currentScore / totalScore) * 100;
      
      let riskLevel: "low" | "medium" | "high" = "high";
      if (percentage >= 80) riskLevel = "low";
      else if (percentage >= 60) riskLevel = "medium";

      return {
        category: category.name,
        score: currentScore,
        maxScore: totalScore,
        riskLevel
      };
    });
  };

  const getOverallScore = () => {
    const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
    const completedItems = categories.reduce((sum, cat) => 
      sum + cat.items.filter(item => item.checked).length, 0);
    return (completedItems / totalItems) * 100;
  };

  const getOverallRisk = () => {
    const score = getOverallScore();
    if (score >= 80) return { level: "low", color: "text-green-600", bg: "bg-green-100" };
    if (score >= 60) return { level: "medium", color: "text-yellow-600", bg: "bg-yellow-100" };
    return { level: "high", color: "text-red-600", bg: "bg-red-100" };
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case "high": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "medium": return <Info className="h-4 w-4 text-yellow-500" />;
      case "low": return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  const radarData = calculateRiskAssessment().map(assessment => ({
    category: assessment.category,
    score: (assessment.score / assessment.maxScore) * 100,
    fullMark: 100
  }));

  const filteredCategories = selectedCategory === "all" 
    ? categories 
    : categories.filter(cat => cat.name.toLowerCase() === selectedCategory);

  const overallRisk = getOverallRisk();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Due Diligence Automatizada
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumen general */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Progreso General</div>
              <div className="text-2xl font-bold text-primary">
                {getOverallScore().toFixed(0)}%
              </div>
              <Progress value={getOverallScore()} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Nivel de Riesgo</div>
              <Badge className={`${overallRisk.bg} ${overallRisk.color} mt-1`}>
                {overallRisk.level.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Items Completados</div>
              <div className="text-xl font-bold">
                {categories.reduce((sum, cat) => sum + cat.items.filter(item => item.checked).length, 0)} / {categories.reduce((sum, cat) => sum + cat.items.length, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Puntuación DD</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < (getOverallScore() / 20) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico radar de riesgo */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Análisis de Riesgo por Área</h3>
          <ChartContainer config={{
            score: { label: "Puntuación", color: "hsl(var(--chart-1))" },
          }} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis domain={[0, 100]} />
                <Radar
                  dataKey="score"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <Separator />

        {/* Filtros por categoría */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
          >
            Todas las Áreas
          </Button>
          {categories.map(category => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name.toLowerCase() ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
              className="flex items-center gap-2"
            >
              <category.icon className="h-3 w-3" />
              {category.name}
              <Badge variant="secondary" className="ml-1">
                {calculateCategoryScore(category).toFixed(0)}%
              </Badge>
            </Button>
          ))}
        </div>

        {/* Lista de verificación */}
        <div className="space-y-6">
          {filteredCategories.map((category, categoryIndex) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className="h-5 w-5" />
                  {category.name}
                  <Badge variant="outline">
                    {category.items.filter(item => item.checked).length} / {category.items.length}
                  </Badge>
                  <Progress 
                    value={calculateCategoryScore(category)} 
                    className="flex-1 ml-4" 
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {category.items.map((item, itemIndex) => (
                  <div key={item.id} className="space-y-3 p-4 border border-border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) => 
                          handleItemCheck(categoryIndex, itemIndex, checked as boolean)
                        }
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={item.id} className="font-medium cursor-pointer">
                            {item.title}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger>
                              {getImpactIcon(item.impact)}
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Impacto {item.impact}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                        <Textarea
                          placeholder="Notas adicionales..."
                          value={item.notes || ""}
                          onChange={(e) => handleItemNotes(categoryIndex, itemIndex, e.target.value)}
                          className="mt-2"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recomendaciones basadas en puntuación */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Recomendaciones de Due Diligence</CardTitle>
          </CardHeader>
          <CardContent>
            {getOverallScore() < 60 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Riesgo Alto:</strong> Se recomienda completar los items críticos antes de proceder con la valoración. 
                  Focus especial en aspectos financieros y legales.
                </AlertDescription>
              </Alert>
            )}
            
            {getOverallScore() >= 60 && getOverallScore() < 80 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Riesgo Moderado:</strong> La empresa presenta un perfil de riesgo aceptable, pero se sugiere 
                  completar la documentación faltante para reducir incertidumbres.
                </AlertDescription>
              </Alert>
            )}

            {getOverallScore() >= 80 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Riesgo Bajo:</strong> Excelente nivel de documentación y transparencia. 
                  La empresa está bien preparada para el proceso de valoración.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Notas generales */}
        <div className="space-y-3">
          <Label htmlFor="overallNotes" className="text-base font-semibold">
            Observaciones Generales
          </Label>
          <Textarea
            id="overallNotes"
            placeholder="Incluye aquí cualquier observación adicional sobre el proceso de due diligence..."
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            rows={4}
          />
        </div>

        {/* Resumen ejecutivo */}
        <Card className="bg-primary/5">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Puntuación de Due Diligence</div>
              <div className="text-3xl font-bold text-primary mb-2">
                {getOverallScore().toFixed(0)}/100
              </div>
              <div className="text-sm text-muted-foreground">
                {getOverallScore() >= 80 && "Empresa lista para valoración - Riesgo bajo"}
                {getOverallScore() >= 60 && getOverallScore() < 80 && "Documentación adicional recomendada - Riesgo moderado"}
                {getOverallScore() < 60 && "Completar items críticos antes de proceder - Riesgo alto"}
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default DueDiligenceChecklist;