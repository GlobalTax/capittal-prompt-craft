import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, Download, Activity } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

export default function AdminDashboard() {
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
