import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Users, CheckCircle2, Euro, Building2, Calendar, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface SellBusinessLead {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  sector: string;
  annual_revenue: number;
  status: string;
  created_at: string;
  valuation_id: string | null;
  estimated_commission: number | null;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  contacted: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  qualified: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
  negotiating: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  won: 'bg-green-500/10 text-green-700 dark:text-green-400',
  lost: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Cualificado',
  negotiating: 'En Negociación',
  won: 'Cerrado',
  lost: 'Perdido',
};

export default function MyReferredLeads() {
  const [leads, setLeads] = useState<SellBusinessLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyLeads();
    fetchMonthlyTrend();
  }, []);

  const fetchMyLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('sell_business_leads')
        .select('*')
        .eq('advisor_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error: any) {
      toast({
        title: 'Error al cargar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTrend = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sell_business_leads')
        .select('created_at')
        .eq('advisor_user_id', user.id)
        .gte('created_at', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Agrupar por mes
      const monthCounts: Record<string, number> = {};
      data?.forEach(lead => {
        const month = new Date(lead.created_at).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      });

      const chartData = Object.entries(monthCounts).map(([month, count]) => ({
        month,
        leads: count,
      }));

      setMonthlyData(chartData);
    } catch (error) {
      console.error('Error fetching trend:', error);
    }
  };

  const activeLeads = leads.filter(l => !['won', 'lost'].includes(l.status));
  const wonLeads = leads.filter(l => l.status === 'won');
  const totalCommissions = leads
    .filter(l => l.status === 'won' && l.estimated_commission)
    .reduce((sum, l) => sum + (l.estimated_commission || 0), 0);
  const pendingCommissions = leads
    .filter(l => !['won', 'lost'].includes(l.status) && l.estimated_commission)
    .reduce((sum, l) => sum + (l.estimated_commission || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mis Referencias</h1>
          <p className="text-muted-foreground">Leads generados y comisiones</p>
        </div>
        <Button onClick={() => navigate('/valuations')}>
          <TrendingUp className="mr-2 h-4 w-4" />
          Nueva Valoración
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Leads Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leads.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4 text-yellow-600" />
              En Gestión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLeads.length}</div>
            <p className="text-xs text-muted-foreground">Activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Deals Cerrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonLeads.length}</div>
            <p className="text-xs text-muted-foreground">
              {leads.length > 0 ? ((wonLeads.length / leads.length) * 100).toFixed(1) : 0}% conversión
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-success" />
              Comisiones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalCommissions.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">
              {pendingCommissions.toLocaleString()}€ pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de tendencia */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución Mensual de Leads</CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Tabla de leads */}
      <Card>
        <CardHeader>
          <CardTitle>Tus Leads Referidos</CardTitle>
          <CardDescription>Histórico completo de leads generados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Cargando...</p>
          ) : leads.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Aún no has generado leads</p>
              <p className="text-sm text-muted-foreground mb-4">
                Crea valoraciones y recomienda a tus clientes vender con Capittal
              </p>
              <Button onClick={() => navigate('/valuations')}>
                Crear Primera Valoración
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Facturación</TableHead>
                    <TableHead>Comisión Est.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {lead.company_name}
                        <div className="text-xs text-muted-foreground">{lead.sector}</div>
                      </TableCell>
                      <TableCell>
                        {lead.contact_name}
                        <div className="text-xs text-muted-foreground">{lead.contact_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[lead.status] || ''}>
                          {statusLabels[lead.status] || lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{lead.annual_revenue?.toLocaleString()}€</TableCell>
                      <TableCell className="text-success font-medium">
                        {lead.estimated_commission ? `${lead.estimated_commission.toLocaleString()}€` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true, locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lead.valuation_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/valuation/${lead.valuation_id}`)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
