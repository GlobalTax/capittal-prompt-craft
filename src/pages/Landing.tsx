import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, FileText, TrendingUp, Shield, Clock, Users, LogOut } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';

const Landing = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
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
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
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
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 blur-3xl rounded-full"></div>
            <Card className="relative shadow-2xl border-2">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <CardTitle>Dashboard Ejecutivo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valoraciones</p>
                    <p className="text-2xl font-bold">24</p>
                  </div>
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Medio</p>
                    <p className="text-2xl font-bold">€2.4M</p>
                  </div>
                </div>
                <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-16 h-16 text-primary/40" />
                </div>
              </CardContent>
            </Card>
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
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
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
      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Capittal. Todos los derechos reservados.
            </p>
            <div className="flex gap-6">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-primary">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="text-sm text-muted-foreground hover:text-primary">
                Registrarse
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
