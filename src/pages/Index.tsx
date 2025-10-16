import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator, Target, BarChart3, FileText, Zap, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const quickAccessCards = [
    {
      title: "Nueva Valoración",
      description: "Crea una valoración para tu empresa o cliente",
      icon: Calculator,
      color: "from-primary/20 to-primary/5",
      iconColor: "text-primary",
      action: () => navigate("/valuations/advisor")
    },
    {
      title: "Valoraciones de Clientes",
      description: "Gestiona las valoraciones de tus clientes",
      icon: Target,
      color: "from-success/20 to-success/5",
      iconColor: "text-success",
      action: () => navigate("/valuations/clients")
    },
    {
      title: "Dashboard Ejecutivo",
      description: "Visualiza métricas y tendencias clave",
      icon: BarChart3,
      color: "from-accent/20 to-accent/5",
      iconColor: "text-accent",
      action: () => navigate("/dashboard")
    },
    {
      title: "Generar Informes",
      description: "Exporta valoraciones a PDF profesional",
      icon: FileText,
      color: "from-warning/20 to-warning/5",
      iconColor: "text-warning",
      action: () => navigate("/reports")
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10 rounded-full mb-4">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Panel de Control</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bienvenido a Capittal
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            La herramienta definitiva para valoración de despachos profesionales
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Card className="border-l-4 border-primary bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valoraciones Activas</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Comienza ahora</div>
              <p className="text-xs text-muted-foreground mt-1">
                Crea tu primera valoración
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-success bg-gradient-to-br from-success/5 to-transparent hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Análisis Avanzado</CardTitle>
              <BarChart3 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">Métricas en tiempo real</div>
              <p className="text-xs text-muted-foreground mt-1">
                Dashboard ejecutivo disponible
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-accent bg-gradient-to-br from-accent/5 to-transparent hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Informes Profesionales</CardTitle>
              <FileText className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">PDF personalizados</div>
              <p className="text-xs text-muted-foreground mt-1">
                Con tu branding corporativo
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Cards */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Acceso Rápido</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickAccessCards.map((card, index) => (
              <Card 
                key={card.title}
                className={`group cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-300 bg-gradient-to-br ${card.color} border-none animate-fade-in`}
                style={{ animationDelay: `${(index + 2) * 100}ms` }}
                onClick={card.action}
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-full bg-background flex items-center justify-center ${card.iconColor} mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{card.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full group-hover:bg-background/50 transition-colors"
                  >
                    Acceder →
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
