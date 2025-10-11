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
import { ChartContainer } from "@/components/ui/chart";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { useDueDiligence } from "@/hooks/useDueDiligence";
import { DueDiligenceItem } from "@/repositories/DueDiligenceRepository";

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

interface DueDiligenceChecklistProps {
  valuationId?: string;
}

const DueDiligenceChecklist = ({ valuationId }: DueDiligenceChecklistProps) => {
  const { items, loading, toggleCheck, updateNotes } = useDueDiligence(valuationId);
  const [categories, setCategories] = useState<DueDiligenceCategory[]>([
    {
      name: "Financiero",
      icon: TrendingUp,
      color: "hsl(var(--chart-1))",
      items: []
    },
    {
      name: "Legal",
      icon: Shield,
      color: "hsl(var(--chart-2))",
      items: []
    },
    {
      name: "Operacional",
      icon: Users,
      color: "hsl(var(--chart-3))",
      items: []
    },
    {
      name: "Mercado",
      icon: FileText,
      color: "hsl(var(--chart-4))",
      items: []
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  // Update categories when items load
  useEffect(() => {
    if (items.length > 0) {
      setCategories(prev => prev.map(cat => ({
        ...cat,
        items: items.filter(item => {
          const catMap: Record<string, string> = {
            'Financiero': 'financial',
            'Legal': 'legal',
            'Operacional': 'operational',
            'Mercado': 'market'
          };
          return item.category === catMap[cat.name];
        })
      })));
    }
  }, [items]);

  const handleItemCheck = (itemId: string, checked: boolean) => {
    toggleCheck(itemId, checked);
  };

  const handleItemNotes = (itemId: string, notes: string) => {
    updateNotes(itemId, notes);
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

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Cargando checklist...</div>
        </CardContent>
      </Card>
    );
  }

  if (!valuationId) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Selecciona una valoración para ver el checklist de due diligence
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

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
                {category.items.map((item) => (
                  <div key={item.id} className="space-y-3 p-4 border border-border rounded-lg">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={item.id}
                        checked={item.checked}
                        onCheckedChange={(checked) => 
                          handleItemCheck(item.id, checked as boolean)
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
                          onChange={(e) => handleItemNotes(item.id, e.target.value)}
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