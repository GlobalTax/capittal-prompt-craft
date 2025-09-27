import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, AlertCircle, Target, Zap } from "lucide-react";

const ExecutiveDashboard = () => {
  // Mock data for dashboard
  const kpiData = [
    {
      title: "Valoraciones Totales",
      value: "€2.4M",
      change: "+12%",
      trend: "up",
      icon: DollarSign,
      description: "Valor total de empresas valoradas"
    },
    {
      title: "Múltiplo Promedio",
      value: "4.2x",
      change: "-3%",
      trend: "down", 
      icon: BarChart3,
      description: "Múltiplo promedio EBITDA aplicado"
    },
    {
      title: "Proyectos Activos",
      value: "18",
      change: "+5",
      trend: "up",
      icon: Users,
      description: "Valoraciones en curso"
    },
    {
      title: "Precisión Predictiva",
      value: "94%",
      change: "+2%",
      trend: "up",
      icon: Target,
      description: "Precisión de modelos predictivos"
    }
  ];

  const monthlyData = [
    { month: 'Ene', valoraciones: 12, valor: 850 },
    { month: 'Feb', valoraciones: 15, valor: 920 },
    { month: 'Mar', valoraciones: 18, valor: 1100 },
    { month: 'Abr', valoraciones: 22, valor: 1300 },
    { month: 'May', valoraciones: 19, valor: 1150 },
    { month: 'Jun', valoraciones: 25, valor: 1450 }
  ];

  const sectorData = [
    { name: 'Consultoría', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Tecnología', value: 28, color: 'hsl(var(--secondary))' },
    { name: 'Marketing', value: 20, color: 'hsl(var(--accent))' },
    { name: 'Legal', value: 10, color: 'hsl(var(--muted))' },
    { name: 'Otros', value: 7, color: 'hsl(var(--border))' }
  ];

  const alertsData = [
    {
      type: "warning",
      title: "Múltiplo de Sector Actualizado",
      description: "El múltiplo promedio para consultoría ha aumentado a 4.8x",
      time: "hace 2 horas"
    },
    {
      type: "info",
      title: "Nueva Valoración Completada",
      description: "Consultora ABC - Valoración final: €1.2M",
      time: "hace 4 horas"
    },
    {
      type: "success",
      title: "Predicción Confirmada",
      description: "El modelo predictivo tuvo 98% de precisión en la última valoración",
      time: "hace 1 día"
    }
  ];

  const renderKPICard = (kpi: any) => (
    <Card key={kpi.title} className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
        <kpi.icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {kpi.trend === "up" ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={kpi.trend === "up" ? "text-green-600" : "text-red-600"}>
            {kpi.change}
          </span>
          <span>vs mes anterior</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Ejecutivo</h1>
          <p className="text-muted-foreground">
            Resumen general de valoraciones y análisis predictivo
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Zap className="h-3 w-3 mr-1" />
          Tiempo Real
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map(renderKPICard)}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
          <TabsTrigger value="trends">Tendencias</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento Mensual</CardTitle>
                <CardDescription>
                  Valoraciones completadas y valor total por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <BarChart width={400} height={300} data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="valor" fill="hsl(var(--primary))" name="Valor (€K)" />
                  </BarChart>
                </div>
              </CardContent>
            </Card>

            {/* Sector Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Sector</CardTitle>
                <CardDescription>
                  Porcentaje de valoraciones por sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px] flex justify-center">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={sectorData}
                      cx={200}
                      cy={150}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sectorData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Valoraciones</CardTitle>
              <CardDescription>
                Evolución temporal del número de valoraciones y valor promedio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px]">
                <LineChart width={600} height={400} data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="valoraciones" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Nº Valoraciones"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    name="Valor Promedio (€K)"
                  />
                </LineChart>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alertsData.map((alert, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-4">
                    <AlertCircle className={`h-5 w-5 mt-0.5 ${
                      alert.type === 'warning' ? 'text-yellow-500' :
                      alert.type === 'info' ? 'text-blue-500' : 'text-green-500'
                    }`} />
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
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

export default ExecutiveDashboard;