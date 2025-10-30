import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileCheck, Download, Activity, AlertCircle, ShieldAlert } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { usePendingAlerts } from "@/hooks/usePendingAlerts";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: alerts } = usePendingAlerts();
  
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [usersResult, pendingResult, valuationsResult, downloadsResult] = await Promise.all([
        supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('user_verification_status').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('valoraciones').select('id', { count: 'exact', head: true }),
        supabase.from('template_downloads').select('id', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: usersResult.count || 0,
        pendingVerification: pendingResult.count || 0,
        totalValuations: valuationsResult.count || 0,
        totalDownloads: downloadsResult.count || 0
      };
    }
  });

  const { count: animatedUserCount } = useCountUp({
    end: stats?.totalUsers || 0,
    duration: 2000,
  });

  const kpis = [
    {
      title: "Total Usuarios",
      value: stats?.totalUsers || 0,
      icon: Users,
      description: "Usuarios registrados"
    },
    {
      title: "Pendientes Verificación",
      value: stats?.pendingVerification || 0,
      icon: FileCheck,
      description: "Esperando aprobación"
    },
    {
      title: "Valoraciones Totales",
      value: stats?.totalValuations || 0,
      icon: Activity,
      description: "Valoraciones creadas"
    },
    {
      title: "Descargas Documentos",
      value: stats?.totalDownloads || 0,
      icon: Download,
      description: "Templates descargados"
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-muted-foreground">Gestión y estadísticas del sistema</p>
      </div>

      {/* Loading State */}
      {!stats && !alerts && (
        <div className="space-y-6">
          <Card className="border-2 bg-muted/50 mb-8">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-10 w-24 mb-2" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Alertas Pendientes */}
      {alerts && alerts.total > 0 && (
        <Card className="col-span-full border-red-500 border-2 bg-red-50 dark:bg-red-950 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Acciones Pendientes
              </CardTitle>
              <Badge variant="destructive">{alerts.total}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Usuarios Pendientes</p>
                <p className="text-2xl font-bold text-red-600">{alerts.pendingUsers}</p>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/users?filter=pending')}>
                  Revisar →
                </Button>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Colaboradores Nuevos</p>
                <p className="text-2xl font-bold text-orange-600">{alerts.recentCollaborators}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Leads Sospechosos</p>
                <p className="text-2xl font-bold text-yellow-600">{alerts.suspiciousLeads}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Leads Sin Asignar</p>
                <p className="text-2xl font-bold text-blue-600">{alerts.unassignedLeads}</p>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/sell-leads')}>
                  Ver →
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        {kpis.map((kpi) => (
          <Card 
            key={kpi.title}
            className="hover:shadow-xl transition-all hover:scale-[1.02] border-l-4 border-primary"
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {kpi.title === "Total Usuarios" 
                  ? animatedUserCount.toLocaleString()
                  : kpi.value.toLocaleString()
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
