import { useState, useEffect } from 'react';
import Header from "@/components/Header";
import { UserCounter } from '@/components/UserCounter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, TrendingUp, Users, Building2, CalendarDays, Handshake, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);

  useEffect(() => {
    fetchRecentLeads();
  }, []);

  const fetchRecentLeads = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('sell_business_leads')
        .select('id, company_name, sector, status, created_at, annual_revenue')
        .eq('advisor_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentLeads(data || []);
    } catch (error) {
      console.error('Error fetching recent leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  };

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

  const quickAccessCards = [
    {
      title: 'Dashboard',
      description: 'Visualiza tus KPIs y métricas',
      icon: BarChart3,
      link: '/dashboard',
      gradient: 'from-primary/10 to-accent/10',
      iconColor: 'text-primary'
    },
    {
      title: 'Valoraciones',
      description: 'Gestiona tus proyectos de valoración',
      icon: FileText,
      link: '/valuations',
      gradient: 'from-primary/10 to-accent/10',
      iconColor: 'text-primary'
    },
    // NOTA: Generador de reportes oculto temporalmente para fase futura
    /*{
      title: 'Reportes',
      description: 'Genera informes profesionales',
      icon: TrendingUp,
      link: '/reports',
      gradient: 'from-accent/10 to-primary/10',
      iconColor: 'text-accent'
    },*/
    {
      title: 'Empresas',
      description: 'Gestiona oportunidades de negocio',
      icon: Building2,
      link: '/security-companies',
      gradient: 'from-warning/10 to-warning/5',
      iconColor: 'text-warning'
    },
    {
      title: 'Agenda',
      description: 'Organiza tus eventos y reuniones',
      icon: CalendarDays,
      link: '/calendar',
      gradient: 'from-primary/10 to-primary/5',
      iconColor: 'text-primary'
    },
    {
      title: 'Colaboradores',
      description: 'Gestiona tu equipo',
      icon: Users,
      link: '/collaborators',
      gradient: 'from-success/10 to-accent/10',
      iconColor: 'text-success'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero welcome */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bienvenido a MiValoracion
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu plataforma profesional de valoración de empresas
          </p>
          <p className="text-sm text-muted-foreground">
            un producto de Capittal Suites
          </p>
        </div>

        {/* User counter destacado */}
        <div className="flex justify-center">
          <UserCounter variant="hero" showBadge showTrend />
        </div>

        {/* Quick stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-l-4 border-primary hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valoraciones</p>
                  <p className="text-3xl font-bold text-primary">24</p>
                </div>
                <FileText className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-success/5 to-success/3 border-l-4 border-success hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Empresas</p>
                  <p className="text-3xl font-bold text-success">12</p>
                </div>
                <Building2 className="w-8 h-8 text-success/50" />
              </div>
            </CardContent>
          </Card>

          {/* NOTA: Generador de reportes oculto temporalmente para fase futura */}
          {/*<Card className="bg-gradient-to-br from-accent/5 to-accent/3 border-l-4 border-accent hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reportes</p>
                  <p className="text-3xl font-bold text-accent">8</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>*/}
        </div>

        {/* Recent Referrals Widget */}
        {!loadingLeads && recentLeads.length > 0 && (
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-primary" />
                  <CardTitle>Tus Últimas Referencias</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/my-referrals" className="flex items-center gap-1">
                    Ver todas <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.slice(0, 3).map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{lead.company_name}</p>
                      <p className="text-sm text-muted-foreground">{lead.sector}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(lead.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-success">
                          {lead.annual_revenue?.toLocaleString()}€
                        </p>
                      </div>
                      <Badge className={statusColors[lead.status]}>
                        {statusLabels[lead.status]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick access cards */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Acceso Rápido</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickAccessCards.map((card) => (
              <Card 
                key={card.title}
                className={`bg-gradient-to-br ${card.gradient} border-2 hover:shadow-xl transition-all hover:scale-[1.02] duration-300`}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-background/50 flex items-center justify-center mb-3`}>
                    <card.icon className={`w-7 h-7 ${card.iconColor}`} />
                  </div>
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {card.description}
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={card.link}>Ir a {card.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
