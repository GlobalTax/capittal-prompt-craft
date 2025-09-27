import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, Brain, Lightbulb, AlertTriangle, Target, Zap, BarChart3, Calculator } from "lucide-react";

const PredictiveAnalytics = () => {
  const [scenarioType, setScenarioType] = useState("conservador");
  const [growthRate, setGrowthRate] = useState([15]);
  const [riskFactor, setRiskFactor] = useState([3]);

  // Mock predictive data
  const projectionData = [
    { year: '2024', conservador: 1200, realista: 1350, optimista: 1500, actual: 1200 },
    { year: '2025', conservador: 1320, realista: 1485, optimista: 1725, actual: null },
    { year: '2026', conservador: 1452, realista: 1634, optimista: 1983, actual: null },
    { year: '2027', conservador: 1597, realista: 1798, optimista: 2281, actual: null },
    { year: '2028', conservador: 1757, realista: 1978, optimista: 2623, actual: null }
  ];

  const riskAssessment = [
    { factor: 'Mercado', valor: 85, max: 100 },
    { factor: 'Competencia', valor: 70, max: 100 },
    { factor: 'Financiero', valor: 90, max: 100 },
    { factor: 'Operacional', valor: 75, max: 100 },
    { factor: 'Regulatorio', valor: 80, max: 100 },
    { factor: 'Tecnológico', valor: 65, max: 100 }
  ];

  const mlInsights = [
    {
      type: "prediction",
      title: "Crecimiento Proyectado",
      content: "El modelo ML predice un crecimiento del 22% anual basado en tendencias históricas y factores macroeconómicos.",
      confidence: 94,
      icon: TrendingUp
    },
    {
      type: "opportunity",
      title: "Oportunidad de Mejora",
      content: "Optimizando la eficiencia operacional, la valoración podría aumentar un 15% adicional.",
      confidence: 87,
      icon: Lightbulb
    },
    {
      type: "risk",
      title: "Factor de Riesgo",
      content: "Incremento en competencia sectorial detectado. Recomendable diversificación de servicios.",
      confidence: 76,
      icon: AlertTriangle
    },
    {
      type: "benchmark",
      title: "Comparativa Sectorial",
      content: "La empresa supera en 18% el promedio sectorial en métricas de rentabilidad.",
      confidence: 91,
      icon: BarChart3
    }
  ];

  const scenarioAnalysis = {
    conservador: {
      valoracion: "€1.45M",
      multiple: "3.8x",
      probabilidad: "85%",
      descripcion: "Escenario basado en crecimiento mínimo esperado"
    },
    realista: {
      valoracion: "€1.68M", 
      multiple: "4.2x",
      probabilidad: "70%",
      descripcion: "Escenario más probable según tendencias actuales"
    },
    optimista: {
      valoracion: "€2.15M",
      multiple: "5.1x", 
      probabilidad: "45%",
      descripcion: "Escenario con condiciones de mercado favorables"
    }
  };

  const recommendations = [
    {
      category: "Crecimiento",
      title: "Expansión de Servicios",
      impact: "Alto",
      effort: "Medio",
      description: "Diversificar hacia consultoría digital para capturar nuevos segmentos"
    },
    {
      category: "Eficiencia",
      title: "Automatización de Procesos",
      impact: "Medio",
      effort: "Bajo", 
      description: "Implementar herramientas de automatización para reducir costos operativos"
    },
    {
      category: "Retención",
      title: "Programa de Fidelización",
      impact: "Alto",
      effort: "Alto",
      description: "Desarrollar programa para aumentar retención de clientes clave"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análisis Predictivo</h1>
          <p className="text-muted-foreground">
            Proyecciones inteligentes y recomendaciones basadas en ML
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Brain className="h-3 w-3 mr-1" />
          IA Activa
        </Badge>
      </div>

      <Tabs defaultValue="projections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projections">Proyecciones</TabsTrigger>
          <TabsTrigger value="scenarios">Escenarios</TabsTrigger>
          <TabsTrigger value="insights">Insights ML</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="projections" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configurar Modelo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="growth">Tasa Crecimiento Esperada (%)</Label>
                  <Slider
                    id="growth"
                    min={0}
                    max={50}
                    step={1}
                    value={growthRate}
                    onValueChange={setGrowthRate}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {growthRate[0]}% anual
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="risk">Factor de Riesgo</Label>
                  <Slider
                    id="risk"
                    min={1}
                    max={5}
                    step={1}
                    value={riskFactor}
                    onValueChange={setRiskFactor}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    Nivel {riskFactor[0]} de 5
                  </div>
                </div>

                <Button className="w-full">
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalcular Proyección
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Proyección 5 Años</CardTitle>
                <CardDescription>
                  Valoración proyectada en diferentes escenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`€${value}K`, '']} />
                    <Line 
                      type="monotone" 
                      dataKey="conservador" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Conservador"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="realista" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Realista"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="optimista" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      name="Optimista"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Histórico"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Escenarios</CardTitle>
                <CardDescription>
                  Selecciona un escenario para ver detalles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={scenarioType} onValueChange={setScenarioType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservador">Conservador</SelectItem>
                    <SelectItem value="realista">Realista</SelectItem>
                    <SelectItem value="optimista">Optimista</SelectItem>
                  </SelectContent>
                </Select>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Valoración Estimada:</span>
                    <span className="font-bold">{scenarioAnalysis[scenarioType as keyof typeof scenarioAnalysis].valoracion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Múltiplo EBITDA:</span>
                    <span className="font-bold">{scenarioAnalysis[scenarioType as keyof typeof scenarioAnalysis].multiple}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Probabilidad:</span>
                    <Badge variant="outline">{scenarioAnalysis[scenarioType as keyof typeof scenarioAnalysis].probabilidad}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {scenarioAnalysis[scenarioType as keyof typeof scenarioAnalysis].descripcion}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Análisis de Riesgo</CardTitle>
                <CardDescription>
                  Evaluación de factores de riesgo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={riskAssessment}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="factor" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Puntuación"
                      dataKey="valor"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mlInsights.map((insight, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <insight.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{insight.title}</CardTitle>
                    <Badge variant="secondary" className="ml-auto">
                      {insight.confidence}% confianza
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{insight.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{rec.category}</Badge>
                        <h3 className="font-semibold">{rec.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-xs text-muted-foreground">Impacto</div>
                      <Badge variant={rec.impact === "Alto" ? "default" : "secondary"}>
                        {rec.impact}
                      </Badge>
                      <div className="text-xs text-muted-foreground">Esfuerzo</div>
                      <Badge variant="outline">{rec.effort}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;