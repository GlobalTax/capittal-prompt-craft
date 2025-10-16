import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Users, AlertCircle, Target, Zap, Loader2 } from "lucide-react";
import { useDashboardKPIs } from "@/hooks/useDashboardKPIs";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";

const ExecutiveDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { kpis, loading } = useDashboardKPIs(user?.id);

  // Transform KPIs from database to display format
  const kpiData = [
    {
      title: t('dashboard.totalValuations'),
      value: kpis.find(k => k.metric_type === 'total_valuations')?.value.toLocaleString('es-ES') || "0",
      change: kpis.find(k => k.metric_type === 'total_valuations')?.change_percentage 
        ? `${kpis.find(k => k.metric_type === 'total_valuations')?.change_percentage}%` 
        : "+0%",
      trend: (kpis.find(k => k.metric_type === 'total_valuations')?.change_percentage || 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      description: t('dashboard.totalValuationsDesc')
    },
    {
      title: t('dashboard.averageValue'),
      value: `${kpis.find(k => k.metric_type === 'avg_multiple')?.value.toFixed(1) || "0.0"}x`,
      change: kpis.find(k => k.metric_type === 'avg_multiple')?.change_percentage 
        ? `${kpis.find(k => k.metric_type === 'avg_multiple')?.change_percentage}%` 
        : "0%",
      trend: (kpis.find(k => k.metric_type === 'avg_multiple')?.change_percentage || 0) >= 0 ? "up" : "down",
      icon: BarChart3,
      description: t('dashboard.averageValueDesc')
    },
    {
      title: t('dashboard.activeClients'),
      value: kpis.find(k => k.metric_type === 'active_projects')?.value.toString() || "0",
      change: kpis.find(k => k.metric_type === 'active_projects')?.change_percentage 
        ? `${kpis.find(k => k.metric_type === 'active_projects')?.change_percentage > 0 ? '+' : ''}${kpis.find(k => k.metric_type === 'active_projects')?.change_percentage}` 
        : "+0",
      trend: (kpis.find(k => k.metric_type === 'active_projects')?.change_percentage || 0) >= 0 ? "up" : "down",
      icon: Users,
      description: t('dashboard.activeClientsDesc')
    },
    {
      title: t('dashboard.completionRate'),
      value: `${kpis.find(k => k.metric_type === 'prediction_accuracy')?.value.toFixed(0) || "0"}%`,
      change: kpis.find(k => k.metric_type === 'prediction_accuracy')?.change_percentage 
        ? `${kpis.find(k => k.metric_type === 'prediction_accuracy')?.change_percentage}%` 
        : "+0%",
      trend: (kpis.find(k => k.metric_type === 'prediction_accuracy')?.change_percentage || 0) >= 0 ? "up" : "down",
      icon: Target,
      description: t('dashboard.completionRateDesc')
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

  const renderKPICard = (kpi: any) => {
    const iconColors = {
      [DollarSign.name]: 'text-primary',
      [BarChart3.name]: 'text-accent',
      [Users.name]: 'text-success',
      [Target.name]: 'text-warning'
    };
    const iconColor = iconColors[kpi.icon.name] || 'text-primary';
    
    return (
      <Card key={kpi.title} className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5 border-l-4 border-primary hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
          <div className={`p-2 rounded-full bg-background/50 ${iconColor}`}>
            <kpi.icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpi.value}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {kpi.trend === "up" ? (
              <TrendingUp className="h-3 w-3 text-success" />
            ) : (
              <TrendingDown className="h-3 w-3 text-critical" />
            )}
            <span className={kpi.trend === "up" ? "text-success font-semibold" : "text-critical font-semibold"}>
              {kpi.change}
            </span>
            <span>vs mes anterior</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              Cargando Dashboard...
            </h1>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')}
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
          <TabsTrigger value="analytics">{t('dashboard.analyticsTab')}</TabsTrigger>
          <TabsTrigger value="trends">{t('dashboard.trendsTab')}</TabsTrigger>
          <TabsTrigger value="alerts">{t('dashboard.alertsTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Performance */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.monthlyPerformance')}</CardTitle>
                <CardDescription>
                  Valoraciones completadas y valor total por mes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Bar dataKey="valor" fill="hsl(var(--chart-1))" name="Valor (€K)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sector Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.sectorDistribution')}</CardTitle>
                <CardDescription>
                  Porcentaje de valoraciones por sector
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sectorData}
                        cx="50%"
                        cy="50%"
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
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.temporalTrend')}</CardTitle>
              <CardDescription>
                Evolución temporal del número de valoraciones y valor promedio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valoraciones" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={3}
                        name="Nº Valoraciones"
                        dot={{ fill: 'hsl(var(--chart-1))', r: 5 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={3}
                        name="Valor Promedio (€K)"
                        dot={{ fill: 'hsl(var(--chart-2))', r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alertsData.map((alert, index) => {
              const alertStyles = {
                warning: 'bg-warning/10 border-l-4 border-warning',
                info: 'bg-primary/10 border-l-4 border-primary',
                success: 'bg-success/10 border-l-4 border-success'
              };
              const iconColors = {
                warning: 'text-warning',
                info: 'text-primary',
                success: 'text-success'
              };
              return (
                <Card key={index} className={`${alertStyles[alert.type as keyof typeof alertStyles]} hover:shadow-lg transition-shadow duration-300`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full bg-background ${iconColors[alert.type as keyof typeof iconColors]}`}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold leading-none">{alert.title}</p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;