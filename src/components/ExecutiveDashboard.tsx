import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, BarChart3, Users, Target, Zap, Loader2, FileText, TrendingUp, Calendar, CheckCircle2 } from "lucide-react";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useAuth } from "@/hooks/useAuth";
import { useValuations } from "@/hooks/useValuations";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/i18n/config";

const ExecutiveDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, trends, typeDistribution, financialSummary, recentValuations, loading, refetch } = useDashboardStats(user?.id);
  const { updateValuation } = useValuations();
  const { toast } = useToast();

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateValuation(id, { 
        completed,
        status: completed ? 'completed' : 'in_progress'
      });
      
      toast({
        title: completed ? t('dashboard.valuationCompleted') : t('dashboard.valuationInProgress'),
        description: t('dashboard.valuationUpdated'),
      });
      
      // Refrescar datos del dashboard
      refetch();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('dashboard.updateError'),
        variant: 'destructive',
      });
    }
  };

  // Type labels
  const typeLabels: Record<string, string> = {
    dcf: t('valuations.method.dcf'),
    multiples: t('valuations.method.multiples'),
    mixed: t('valuations.method.mixed')
  };

  // Valuation type labels for recent valuations
  const valuationTypeLabels: Record<string, string> = {
    own_business: t('valuations.type.ownBusiness'),
    client_business: t('valuations.type.clientBusiness'),
    potential_acquisition: t('valuations.type.potentialAcquisition'),
  };

  // Status labels and colors
  const statusLabels: Record<string, string> = {
    draft: t('dashboard.status.draft'),
    in_progress: t('dashboard.status.inProgress'),
    completed: t('dashboard.status.completed')
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-green-500'
  };

  // Colors for charts
  const chartColors = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              {t('dashboard.loading')}
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

  // Prepare data for charts
  const statusData = [
    { name: t('dashboard.statusPlural.draft'), value: stats?.draft || 0, color: chartColors[0] },
    { name: t('dashboard.statusPlural.inProgress'), value: stats?.in_progress || 0, color: chartColors[1] },
    { name: t('dashboard.statusPlural.completed'), value: stats?.completed || 0, color: chartColors[2] },
  ].filter(item => item.value > 0);

  const typeData = (typeDistribution || []).map((item, index) => ({
    name: valuationTypeLabels[item.type] || typeLabels[item.type] || item.type,
    value: item.count,
    color: chartColors[index % chartColors.length]
  }));

  return (
    <TooltipProvider>
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
          {t('dashboard.realtimeData')}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalValuations')}</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.completed || 0} {t('dashboard.statusPlural.completed').toLowerCase()}, {stats?.in_progress || 0} {t('dashboard.statusPlural.inProgress').toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.totalValued')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{((stats?.totalValue || 0) / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.totalValuedDesc')}
            </p>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => navigate('/my-referrals')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.myReferences')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{t('dashboard.viewLeads')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.myReferencesDesc')}
            </p>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="activity" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activity">{t('dashboard.activityTab')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('dashboard.analyticsTab')}</TabsTrigger>
          <TabsTrigger value="financial">{t('dashboard.financialTab')}</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Activity */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.monthlyActivity')}</CardTitle>
                <CardDescription>
                  {t('dashboard.monthlyActivityDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trends && trends.length > 0 ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(var(--primary))" name={t('dashboard.numValuations')} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {t('dashboard.noActivityData')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
                <CardDescription>
                  {t('dashboard.recentActivityDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recentValuations && recentValuations.length > 0 ? (
                  <div className="space-y-3">
                    {recentValuations.map((valuation) => (
                      <div
                        key={valuation.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/valuation/${valuation.id}`)}
                      >
                          <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{valuation.client_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {valuationTypeLabels[valuation.valuation_type] || valuation.valuation_type}
                            </Badge>
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <Badge 
                                  className={`text-xs ${statusColors[valuation.status]} cursor-pointer hover:scale-105 transition-all hover:shadow-md`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleComplete(valuation.id, valuation.status !== 'completed');
                                  }}
                                >
                                  {statusLabels[valuation.status]}
                                  {valuation.status === 'completed' && <CheckCircle2 className="h-3 w-3 ml-1 inline" />}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('common.clickToChange')}</p>
                              </TooltipContent>
                            </UITooltip>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-medium">
                            {(() => {
                              const dcfValue = (valuation.dcf_results as any)?.enterpriseValue || 0;
                              const multiplesValue = (valuation.comparable_multiples_results as any)?.enterpriseValue || 0;
                              const value = Math.max(dcfValue, multiplesValue);
                              return value > 0 ? `€${(value / 1000000).toFixed(1)}M` : '-';
                            })()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(valuation.updated_at), { 
                              addSuffix: true, 
                              locale: getDateLocale()
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {t('dashboard.noRecentValuations')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
                <CardDescription>
                  Valoraciones según metodología aplicada
                </CardDescription>
              </CardHeader>
              <CardContent>
                {typeData.length > 0 ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent, x, y, cx }) => {
                            return (
                              <text 
                                x={x} 
                                y={y} 
                                fill="hsl(var(--foreground))"
                                textAnchor={x > cx ? 'start' : 'end'}
                                dominantBaseline="central"
                                className="text-sm font-semibold"
                              >
                                {name} {(percent * 100).toFixed(0)}%
                              </text>
                            );
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos de distribución aún
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Estado</CardTitle>
                <CardDescription>
                  Valoraciones según su estado actual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statusData.length > 0 ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={statusData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="hsl(var(--primary))" name="Cantidad">
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No hay datos de estado aún
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.financialSummary')}</CardTitle>
                <CardDescription>
                  {t('dashboard.financialSummaryDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('dashboard.avgEbitda')}</span>
                    <span className="font-medium">
                      €{((financialSummary?.avgEbitda || 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('dashboard.avgMultiple')}</span>
                    <span className="font-medium">
                      {(financialSummary?.avgMultiple || 0).toFixed(1)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t('dashboard.avgValue')}</span>
                    <span className="font-medium">
                      €{((financialSummary?.avgEnterpriseValue || 0) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-sm text-muted-foreground">{t('dashboard.valueRange')}</span>
                    <span className="font-medium">
                      €{((financialSummary?.minValue || 0) / 1000000).toFixed(1)}M - 
                      €{((financialSummary?.maxValue || 0) / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>{t('dashboard.valueTrend')}</CardTitle>
                <CardDescription>
                  {t('dashboard.valueTrendDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {trends && trends.length > 0 ? (
                  <div className="w-full h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name={t('dashboard.totalAmount') + ' (€K)'}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {t('dashboard.noFinancialData')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default ExecutiveDashboard;