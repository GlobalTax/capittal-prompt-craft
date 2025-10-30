import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface FunnelStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface AdvisorPerformance {
  advisor_id: string;
  advisor_email: string;
  total_events: number;
  valuations_created: number;
  sell_clicks: number;
  forms_submitted: number;
  deals_won: number;
  conversion_rate: number;
}

const FUNNEL_STAGES = [
  { event: 'valuation_created', label: 'Valoraciones Creadas', color: 'hsl(var(--primary))' },
  { event: 'sell_button_clicked', label: 'Click "Vender"', color: 'hsl(var(--chart-2))' },
  { event: 'form_started', label: 'Formulario Iniciado', color: 'hsl(var(--chart-3))' },
  { event: 'form_submitted', label: 'Formulario Enviado', color: 'hsl(var(--chart-4))' },
  { event: 'lead_qualified', label: 'Lead Cualificado', color: 'hsl(var(--chart-5))' },
  { event: 'deal_won', label: 'Deal Cerrado', color: 'hsl(var(--success))' },
];

export default function FunnelAnalytics() {
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [advisorData, setAdvisorData] = useState<AdvisorPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchFunnelData();
    fetchAdvisorPerformance();
  }, [dateRange]);

  const fetchFunnelData = async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('lead_funnel_analytics')
        .select('event_type')
        .gte('created_at', daysAgo.toISOString());

      if (error) throw error;

      // Contar eventos por tipo
      const eventCounts: Record<string, number> = {};
      data?.forEach(event => {
        eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
      });

      // Construir funnel
      const total = eventCounts['valuation_created'] || 1;
      const funnelStages: FunnelStage[] = FUNNEL_STAGES.map(stage => ({
        stage: stage.label,
        count: eventCounts[stage.event] || 0,
        percentage: ((eventCounts[stage.event] || 0) / total) * 100,
        color: stage.color,
      }));

      setFunnelData(funnelStages);
    } catch (error: any) {
      toast({
        title: 'Error al cargar datos',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvisorPerformance = async () => {
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));

      const { data, error } = await supabase
        .from('lead_funnel_analytics')
        .select('advisor_user_id, event_type')
        .gte('created_at', daysAgo.toISOString())
        .not('advisor_user_id', 'is', null);

      if (error) throw error;

      // Obtener emails de asesores
      const advisorIds = Array.from(new Set(data?.map(d => d.advisor_user_id).filter(Boolean)));
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', advisorIds);

      // Agrupar por asesor
      const advisorStats: Record<string, any> = {};
      data?.forEach(event => {
        const advisorId = event.advisor_user_id;
        if (!advisorId) return;

        if (!advisorStats[advisorId]) {
          advisorStats[advisorId] = {
            advisor_id: advisorId,
            total_events: 0,
            valuations_created: 0,
            sell_clicks: 0,
            forms_submitted: 0,
            deals_won: 0,
          };
        }

        advisorStats[advisorId].total_events++;
        if (event.event_type === 'valuation_created') advisorStats[advisorId].valuations_created++;
        if (event.event_type === 'sell_button_clicked') advisorStats[advisorId].sell_clicks++;
        if (event.event_type === 'form_submitted') advisorStats[advisorId].forms_submitted++;
        if (event.event_type === 'deal_won') advisorStats[advisorId].deals_won++;
      });

      // Calcular conversión y agregar emails
      const performanceData: AdvisorPerformance[] = Object.values(advisorStats).map((stat: any) => {
        const profile = profiles?.find(p => p.id === stat.advisor_id);
        
        // Mejorar fallback de nombres
        let fullName = 'Usuario';
        if (profile) {
          const firstName = profile.first_name?.trim() || '';
          const lastName = profile.last_name?.trim() || '';
          if (firstName || lastName) {
            fullName = `${firstName} ${lastName}`.trim();
          }
        }
        
        return {
          ...stat,
          advisor_email: fullName,
          conversion_rate: stat.valuations_created > 0 
            ? (stat.deals_won / stat.valuations_created) * 100 
            : 0,
        };
      });

      // Ordenar por deals ganados
      performanceData.sort((a, b) => b.deals_won - a.deals_won);
      setAdvisorData(performanceData);
    } catch (error: any) {
      console.error('Error fetching advisor performance:', error);
    }
  };

  const conversionRate = funnelData[0]?.count > 0 
    ? ((funnelData[funnelData.length - 1]?.count || 0) / funnelData[0].count) * 100 
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics del Funnel</h1>
          <p className="text-muted-foreground">Métricas de conversión y performance</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
            <SelectItem value="365">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Conversión Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Valoraciones → Deals</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Valoraciones Creadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData[0]?.count || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Forms Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funnelData[3]?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {funnelData[0]?.count > 0 
                ? ((funnelData[3]?.count / funnelData[0]?.count) * 100).toFixed(1) 
                : 0}% de valoraciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Deals Cerrados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{funnelData[5]?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Embudo de Conversión</CardTitle>
          <CardDescription>Visualización del recorrido completo del lead</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando...</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="stage" width={150} className="text-xs" />
                <RechartsTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{payload[0].payload.stage}</p>
                          <p className="text-sm text-muted-foreground">
                            {payload[0].value} leads ({payload[0].payload.percentage.toFixed(1)}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla de performance por asesor */}
      <Card>
        <CardHeader>
          <CardTitle>Performance por Asesor</CardTitle>
          <CardDescription>Ranking de asesores por conversión</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asesor</TableHead>
                  <TableHead className="text-right">Valoraciones</TableHead>
                  <TableHead className="text-right">Clicks Vender</TableHead>
                  <TableHead className="text-right">Forms Enviados</TableHead>
                  <TableHead className="text-right">Deals Ganados</TableHead>
                  <TableHead className="text-right">Conversión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {advisorData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay datos de asesores en el periodo seleccionado
                    </TableCell>
                  </TableRow>
                ) : (
                  advisorData.map(advisor => (
                    <TableRow key={advisor.advisor_id}>
                      <TableCell className="font-medium">{advisor.advisor_email}</TableCell>
                      <TableCell className="text-right">{advisor.valuations_created}</TableCell>
                      <TableCell className="text-right">{advisor.sell_clicks}</TableCell>
                      <TableCell className="text-right">{advisor.forms_submitted}</TableCell>
                      <TableCell className="text-right font-bold text-success">{advisor.deals_won}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={advisor.conversion_rate >= 10 ? 'default' : 'secondary'}>
                          {advisor.conversion_rate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
