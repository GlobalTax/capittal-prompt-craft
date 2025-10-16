import Header from "@/components/Header";
import { UserCounter } from '@/components/UserCounter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, TrendingUp, Users, Building2, CalendarDays } from 'lucide-react';

const Index = () => {
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
      gradient: 'from-success/10 to-success/5',
      iconColor: 'text-success'
    },
    {
      title: 'Reportes',
      description: 'Genera informes profesionales',
      icon: TrendingUp,
      link: '/reports',
      gradient: 'from-accent/10 to-primary/10',
      iconColor: 'text-accent'
    },
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
            Bienvenido a Capittal
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu plataforma profesional de valoración de empresas
          </p>
        </div>

        {/* User counter destacado */}
        <div className="flex justify-center">
          <UserCounter variant="hero" showBadge showTrend />
        </div>

        {/* Quick stats */}
        <div className="grid md:grid-cols-3 gap-4">
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

          <Card className="bg-gradient-to-br from-accent/5 to-accent/3 border-l-4 border-accent hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reportes</p>
                  <p className="text-3xl font-bold text-accent">8</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>
        </div>

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
