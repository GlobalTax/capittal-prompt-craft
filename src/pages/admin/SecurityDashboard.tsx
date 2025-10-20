import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Activity, Users, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

interface SecurityMetrics {
  overview: {
    failed_logins_24h: number;
    suspicious_ips_24h: number;
    active_sessions: number;
    critical_events_7d: number;
    high_events_7d: number;
  };
  mfa_adoption: {
    total_users: number;
    mfa_enabled: number;
    adoption_rate: number;
  };
  recent_critical_events: Array<{
    id: string;
    event_type: string;
    severity: string;
    description: string;
    user_email: string | null;
    created_at: string;
    metadata: any;
  }>;
  top_event_types: Array<{
    event_type: string;
    count: number;
    severity: string;
  }>;
  timestamp: string;
}

interface TimelineData {
  date: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export default function SecurityDashboard() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [timeline, setTimeline] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      loadSecurityData();
    }
  }, [roleLoading, isAdmin]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Cargar métricas
      const { data: metricsData, error: metricsError } = await supabase
        .rpc('get_security_dashboard_metrics' as any);

      if (metricsError) throw metricsError;
      setMetrics(metricsData as any);

      // Cargar timeline
      const { data: timelineData, error: timelineError } = await supabase
        .rpc('get_security_events_timeline' as any, { p_days: 7 });

      if (timelineError) throw timelineError;
      setTimeline(timelineData as any || []);

    } catch (error: any) {
      console.error('Error loading security data:', error);
      toast.error('Error al cargar datos de seguridad: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (roleLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  // Verificar si hay datos (incluso con valores en 0)
  const hasData = metrics && (
    metrics.overview.failed_logins_24h > 0 ||
    metrics.overview.suspicious_ips_24h > 0 ||
    metrics.overview.active_sessions > 0 ||
    metrics.overview.critical_events_7d > 0 ||
    metrics.overview.high_events_7d > 0 ||
    (metrics.recent_critical_events && metrics.recent_critical_events.length > 0) ||
    (metrics.top_event_types && metrics.top_event_types.length > 0)
  );

  if (!metrics) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No se pudieron cargar las métricas de seguridad. Verifica que las funciones RPC estén creadas.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Seguridad</h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo en tiempo real de eventos de seguridad
          </p>
        </div>
        <button
          onClick={loadSecurityData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Activity className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      {/* Info si no hay datos */}
      {!hasData && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            El sistema de seguridad está activo pero aún no hay eventos registrados. Los datos aparecerán automáticamente cuando ocurran eventos de seguridad.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          icon={AlertTriangle}
          title="Logins Fallidos"
          value={metrics.overview.failed_logins_24h}
          subtitle="Últimas 24h"
          variant={metrics.overview.failed_logins_24h > 10 ? 'destructive' : 'default'}
        />
        <MetricCard
          icon={Shield}
          title="IPs Sospechosas"
          value={metrics.overview.suspicious_ips_24h}
          subtitle="Últimas 24h"
          variant={metrics.overview.suspicious_ips_24h > 5 ? 'destructive' : 'default'}
        />
        <MetricCard
          icon={Activity}
          title="Sesiones Activas"
          value={metrics.overview.active_sessions}
          subtitle="Ahora mismo"
          variant="default"
        />
        <MetricCard
          icon={AlertTriangle}
          title="Eventos Críticos"
          value={metrics.overview.critical_events_7d}
          subtitle="Últimos 7 días"
          variant={metrics.overview.critical_events_7d > 0 ? 'destructive' : 'default'}
        />
        <MetricCard
          icon={TrendingUp}
          title="Eventos Alta"
          value={metrics.overview.high_events_7d}
          subtitle="Últimos 7 días"
          variant={metrics.overview.high_events_7d > 5 ? 'destructive' : 'default'}
        />
      </div>

      {/* MFA Adoption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Adopción de MFA
          </CardTitle>
          <CardDescription>
            Porcentaje de usuarios con autenticación de dos factores habilitada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Usuarios con MFA</span>
              <span className="text-2xl font-bold">
                {metrics.mfa_adoption.mfa_enabled} / {metrics.mfa_adoption.total_users}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <div
                className="bg-primary h-3 rounded-full transition-all"
                style={{ width: `${metrics.mfa_adoption.adoption_rate}%` }}
              />
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold">{metrics.mfa_adoption.adoption_rate}%</span>
              <span className="text-sm text-muted-foreground ml-2">tasa de adopción</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Chart */}
      {timeline && timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendencia de Eventos (7 días)
            </CardTitle>
            <CardDescription>
              Evolución temporal de eventos de seguridad por severidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeline.map((day) => (
                <div key={day.date} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('es-ES', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex-1 flex gap-1 h-8 bg-secondary rounded">
                    {day.critical > 0 && (
                      <div
                        className="bg-red-500 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.critical / day.total) * 100}%` }}
                        title={`${day.critical} críticos`}
                      >
                        {day.critical}
                      </div>
                    )}
                    {day.high > 0 && (
                      <div
                        className="bg-orange-500 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.high / day.total) * 100}%` }}
                        title={`${day.high} altos`}
                      >
                        {day.high}
                      </div>
                    )}
                    {day.medium > 0 && (
                      <div
                        className="bg-yellow-500 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.medium / day.total) * 100}%` }}
                        title={`${day.medium} medios`}
                      >
                        {day.medium}
                      </div>
                    )}
                    {day.low > 0 && (
                      <div
                        className="bg-blue-500 rounded flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${(day.low / day.total) * 100}%` }}
                        title={`${day.low} bajos`}
                      >
                        {day.low}
                      </div>
                    )}
                  </div>
                  <div className="w-12 text-right text-sm font-medium">
                    {day.total}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 justify-center text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span>Crítico</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded" />
                <span>Alto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded" />
                <span>Medio</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded" />
                <span>Bajo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Critical Events */}
      {metrics.recent_critical_events && metrics.recent_critical_events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Eventos Críticos Recientes
            </CardTitle>
            <CardDescription>
              Últimos 10 eventos de alta severidad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recent_critical_events.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="font-medium">{event.event_type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                      {event.user_email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Usuario: {event.user_email}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(event.created_at).toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Event Types */}
      {metrics.top_event_types && metrics.top_event_types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Tipos de Eventos (7 días)</CardTitle>
            <CardDescription>
              Eventos más frecuentes en la última semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {metrics.top_event_types.map((eventType, index) => (
                <div key={eventType.event_type} className="flex items-center gap-3">
                  <div className="w-8 text-center font-bold text-muted-foreground">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{eventType.event_type}</span>
                      <Badge variant={getSeverityColor(eventType.severity)} className="text-xs">
                        {eventType.severity}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right font-bold">
                    {eventType.count}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  title: string;
  value: number;
  subtitle: string;
  variant?: 'default' | 'destructive';
}

function MetricCard({ icon: Icon, title, value, subtitle, variant = 'default' }: MetricCardProps) {
  return (
    <Card className={variant === 'destructive' ? 'border-destructive' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className={`h-4 w-4 ${variant === 'destructive' ? 'text-destructive' : 'text-muted-foreground'}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${variant === 'destructive' ? 'text-destructive' : ''}`}>
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
      <Skeleton className="h-96" />
    </div>
  );
}