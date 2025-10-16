import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, FileText, TrendingUp, Shield, Clock, Users, LogOut, Linkedin, Twitter, DollarSign, Building2, Zap, Activity } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import logoCapittal from '@/assets/logo-capittal.png';
import { UserCounter } from '@/components/UserCounter';

const mockChartData = [
  { month: 'Ene', valoraciones: 18, valor: 1.8 },
  { month: 'Feb', valoraciones: 20, valor: 2.1 },
  { month: 'Mar', valoraciones: 22, valor: 2.3 },
  { month: 'Abr', valoraciones: 19, valor: 2.0 },
  { month: 'May', valoraciones: 24, valor: 2.4 },
  { month: 'Jun', valoraciones: 26, valor: 2.7 },
];

const Landing = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="landing-page min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            Capittal
          </h1>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">Ir al Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link to="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              La Plataforma Definitiva para{' '}
              <span className="text-primary">
                Valoración de Empresas
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Optimiza tu trabajo como asesoría con herramientas profesionales de valoración DCF, 
              análisis de múltiplos y generación automática de informes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link to="/register">Comenzar Gratis</Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/login">Ver Demo</Link>
              </Button>
            </div>
          </div>
          
          {/* Mockup Hero */}
          <div className="relative">
            {/* Background gradient effects */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 blur-3xl -z-10" />
            
            <Card className="relative shadow-2xl hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 bg-gradient-to-br from-card via-card to-card/95 transition-all duration-300 hover:scale-[1.02] animate-fade-in">
              <CardHeader className="space-y-4">
                {/* Browser window decoration */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-destructive shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-warning shadow-sm"></div>
                  <div className="w-3 h-3 rounded-full bg-success shadow-sm"></div>
                </div>
                
                {/* Title and badges */}
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">Dashboard Ejecutivo</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="success" className="text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-success-foreground mr-1.5 animate-pulse"></span>
                      En Tiempo Real
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Hace 2 min
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* KPIs Grid - 4 items */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 transition-all duration-300 hover:bg-primary/15 hover:scale-[1.02] group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Valoraciones Activas</p>
                      <BarChart3 className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% vs mes anterior
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 transition-all duration-300 hover:bg-accent/15 hover:scale-[1.02] group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <DollarSign className="w-4 h-4 text-accent group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-bold">€8.7M</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +18.5% ROI
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20 transition-all duration-300 hover:bg-success/15 hover:scale-[1.02] group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Clientes Activos</p>
                      <Building2 className="w-4 h-4 text-success group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      4 sectores diferentes
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20 transition-all duration-300 hover:bg-warning/15 hover:scale-[1.02] group">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Valor Medio</p>
                      <Activity className="w-4 h-4 text-warning group-hover:scale-110 transition-transform" />
                    </div>
                    <p className="text-2xl font-bold">€2.7M</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +8% este mes
                    </p>
                  </div>
                </div>
                
                {/* Real Chart with Recharts */}
                <div className="h-[200px] bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 border border-border/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis 
                        dataKey="month" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valoraciones" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="hsl(var(--accent))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--accent))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Bottom badges */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <Badge variant="outline" className="text-xs">
                    <Zap className="w-3 h-3 mr-1 text-warning" />
                    12 Valoraciones este mes
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    <Activity className="w-3 h-3 mr-1" />
                    Tendencia positiva
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section - User Counter */}
      <section className="py-12 border-y bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <UserCounter variant="hero" showBadge showTrend />
            <div className="text-center md:text-left max-w-md">
              <h4 className="text-lg font-semibold mb-2">Únete a la comunidad</h4>
              <p className="text-muted-foreground text-sm">
                Profesionales de toda España ya optimizan sus valoraciones con Capittal
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Todo lo que necesitas para valorar empresas
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Herramientas profesionales diseñadas específicamente para asesorías
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Dashboard Ejecutivo</CardTitle>
                <CardDescription>
                  Visualiza todos tus KPIs en tiempo real con gráficos interactivos y análisis de tendencias
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <TrendingUp className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Valoración DCF</CardTitle>
                <CardDescription>
                  Calcula el valor de empresas mediante Flujo de Caja Descontado con proyecciones automáticas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Múltiplos Comparables</CardTitle>
                <CardDescription>
                  Accede a múltiplos del sector actualizados para valoraciones rápidas y precisas
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Informes PDF</CardTitle>
                <CardDescription>
                  Genera informes profesionales automáticamente con tu marca y formato personalizado
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Ahorro de Tiempo</CardTitle>
                <CardDescription>
                  Reduce el tiempo de valoración de días a horas con automatización inteligente
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Shield className="w-12 h-12 text-primary mb-4" />
                <CardTitle>Seguridad Total</CardTitle>
                <CardDescription>
                  Tus datos y los de tus clientes protegidos con encriptación de nivel empresarial
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Diseñado para Asesorías Modernas
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="flex gap-4">
              <Users className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Gestión de Clientes</h4>
                <p className="text-muted-foreground">
                  Organiza valoraciones por cliente y mantén un histórico completo de todos tus trabajos
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Análisis Profesional</h4>
                <p className="text-muted-foreground">
                  Metodologías probadas de valoración con ratios financieros y métricas sectoriales
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <FileText className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Informes Personalizables</h4>
                <p className="text-muted-foreground">
                  Añade tu logo, personaliza colores y genera PDFs listos para presentar a clientes
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Clock className="w-8 h-8 text-primary flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-lg mb-2">Optimiza tu Tiempo</h4>
                <p className="text-muted-foreground">
                  Automatiza cálculos complejos y dedica más tiempo al análisis y asesoramiento estratégico
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-8">
            <UserCounter variant="hero" showBadge={false} />
          </div>
          
          <h3 className="text-3xl lg:text-4xl font-bold mb-4">
            ¿Listo para transformar tu asesoría?
          </h3>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Únete a las asesorías que ya están optimizando su proceso de valoración
          </p>
          <Button size="lg" className="text-lg px-8" asChild>
            <Link to="/register">Comenzar Ahora - Es Gratis</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/30 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Columna Marca/Info */}
            <div>
              <img src={logoCapittal} alt="Capittal" className="h-8 mb-4" />
              <p className="text-muted-foreground mb-4">
                Plataforma profesional de valoración de empresas para asesores financieros
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Linkedin className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Columna Producto */}
            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/dcf-calculator" className="text-muted-foreground hover:text-primary transition-colors">
                    Valoración DCF
                  </Link>
                </li>
                <li>
                  <Link to="/comparable-multiples" className="text-muted-foreground hover:text-primary transition-colors">
                    Múltiplos Comparables
                  </Link>
                </li>
                <li>
                  <Link to="/reports" className="text-muted-foreground hover:text-primary transition-colors">
                    Informes
                  </Link>
                </li>
                <li>
                  <Link to="/fee-calculator" className="text-muted-foreground hover:text-primary transition-colors">
                    Calculadora de Honorarios
                  </Link>
                </li>
              </ul>
            </div>

            {/* Columna Recursos */}
            <div>
              <h4 className="font-semibold mb-4">Recursos</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/financial-ratios-guide" className="text-muted-foreground hover:text-primary transition-colors">
                    Guía de Ratios Financieros
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Documentación
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Soporte
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>

            {/* Columna Legal/Empresa */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Términos de Servicio
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <Link to="/sell-business-contact" className="text-muted-foreground hover:text-primary transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    Sobre Nosotros
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Capittal. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
