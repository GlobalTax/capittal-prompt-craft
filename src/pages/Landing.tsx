import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BarChart3, FileText, TrendingUp, Shield, Clock, Users, LogOut, DollarSign, Building2, Zap, Activity, CheckCircle, ArrowRight, Menu, X, ChevronDown } from 'lucide-react';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCounter } from '@/components/UserCounter';
import { useTrackLandingEvents } from '@/hooks/useTrackLandingEvents';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const mockChartData = [
  { month: 'Ene', valoraciones: 18, valor: 1.8 },
  { month: 'Feb', valoraciones: 20, valor: 2.1 },
  { month: 'Mar', valoraciones: 22, valor: 2.3 },
  { month: 'Abr', valoraciones: 19, valor: 2.0 },
  { month: 'May', valoraciones: 24, valor: 2.4 },
  { month: 'Jun', valoraciones: 26, valor: 2.7 },
];

const formSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  telefono: z.string().min(9, 'Teléfono inválido').max(20),
  experiencia: z.string().min(1, 'Selecciona tu experiencia'),
  especializacion: z.array(z.string()).min(1, 'Selecciona al menos una'),
});

type FormData = z.infer<typeof formSchema>;

const Landing = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const { trackCTAClick, trackFormSubmit } = useTrackLandingEvents();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showStickyCTA, setShowStickyCTA] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      especializacion: []
    }
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const onSubmit = async (data: FormData) => {
    trackFormSubmit({
      email: data.email,
      experiencia: data.experiencia,
      especializacion: data.especializacion
    });

    toast({
      title: '¡Solicitud enviada!',
      description: 'Nos pondremos en contacto contigo pronto.',
    });
  };

  const handleCTAClick = (section: string) => {
    trackCTAClick(section);
    navigate('/register');
  };

  const especializaciones = ['M&A', 'Valoraciones', 'Due Diligence', 'Reestructuración'];
  const currentEspecializacion = watch('especializacion') || [];

  const toggleEspecializacion = (value: string) => {
    const current = currentEspecializacion;
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    setValue('especializacion', updated);
  };

  return (
    <div className="landing-page min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Capittal</h1>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
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
                  <Button onClick={() => handleCTAClick('navbar')}>
                    Solicitar Colaboración
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pt-4 pb-2 space-y-2">
              {user ? (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/dashboard">Ir al Dashboard</Link>
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link to="/login">Iniciar Sesión</Link>
                  </Button>
                  <Button className="w-full" onClick={() => handleCTAClick('navbar-mobile')}>
                    Solicitar Colaboración
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Sticky CTA */}
      {isMobile && showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t shadow-lg z-40 animate-slide-in-bottom">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => handleCTAClick('sticky-mobile')}
          >
            Solicitar Colaboración
          </Button>
        </div>
      )}

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="secondary" className="text-sm">
              <Users className="w-4 h-4 mr-2" />
              Para Asesores Financieros Independientes
            </Badge>
            
            <h2 className="text-4xl lg:text-6xl font-bold leading-tight">
              Genera{' '}
              <span className="text-primary">€5K-15K extra al mes</span>
              {' '}colaborando con Capittal
            </h2>
            
            <p className="text-xl text-muted-foreground">
              Únete a nuestra red de asesores y accede a proyectos de valoración empresarial con remuneración competitiva.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => handleCTAClick('hero')}
              >
                Solicitar Colaboración
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => {
                  document.getElementById('testimonios')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Ver Casos de Éxito
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Mockup Hero */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 blur-3xl -z-10" />
            
            <Card className="relative shadow-2xl border-2 bg-gradient-to-br from-card via-card to-card/95 transition-all duration-300 hover:scale-[1.02]">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-destructive"></div>
                  <div className="w-3 h-3 rounded-full bg-warning"></div>
                  <div className="w-3 h-3 rounded-full bg-success"></div>
                </div>
                
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">Dashboard Ejecutivo</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse"></span>
                    En Tiempo Real
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* KPIs Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Valoraciones</p>
                      <BarChart3 className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">24</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +12% vs mes anterior
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Valor Total</p>
                      <DollarSign className="w-4 h-4 text-accent" />
                    </div>
                    <p className="text-2xl font-bold">€8.7M</p>
                    <p className="text-xs text-success flex items-center gap-1 mt-1">
                      <TrendingUp className="w-3 h-3" />
                      +18.5%
                    </p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-lg border border-success/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Clientes</p>
                      <Building2 className="w-4 h-4 text-success" />
                    </div>
                    <p className="text-2xl font-bold">12</p>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 rounded-lg border border-warning/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-muted-foreground">Promedio</p>
                      <Activity className="w-4 h-4 text-warning" />
                    </div>
                    <p className="text-2xl font-bold">€2.7M</p>
                  </div>
                </div>
                
                {/* Chart */}
                <div className="h-[180px] bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-4 border border-border/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="valoraciones" stroke="hsl(var(--primary))" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y bg-gradient-to-r from-background via-muted/20 to-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary mb-2">158</div>
              <p className="text-sm text-muted-foreground mb-1">asesores han generado</p>
              <p className="text-2xl font-semibold text-success">€2.7M en comisiones</p>
              <p className="text-xs text-muted-foreground">este año</p>
            </div>
            <div className="text-center md:text-left max-w-md border-l-2 border-primary/20 pl-6">
              <p className="text-lg italic text-muted-foreground mb-2">
                "He triplicado mis ingresos en 6 meses"
              </p>
              <p className="text-sm font-medium">— María G., Asesora Financiera</p>
            </div>
          </div>
        </div>
      </section>

      {/* El Problema */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="text-sm">El Desafío</Badge>
            
            <h3 className="text-3xl lg:text-4xl font-bold">
              ¿Buscas proyectos de valoración pero no sabes dónde encontrarlos?
            </h3>
            
            <p className="text-xl text-muted-foreground">
              Como asesor financiero independiente, conseguir clientes de forma constante es difícil. 
              El marketing es costoso y los resultados son inciertos.
            </p>

            <div className="grid md:grid-cols-3 gap-6 pt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Inconsistencia</CardTitle>
                  <CardDescription>
                    Meses con muchos proyectos y otros sin nada
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Alto Costo</CardTitle>
                  <CardDescription>
                    Marketing y captación de clientes muy caros
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tiempo Perdido</CardTitle>
                  <CardDescription>
                    Horas en prospección en vez de trabajar
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo Funciona */}
      <section id="como-funciona" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Proceso Simple</Badge>
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Así funciona la colaboración
            </h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un proceso transparente y profesional
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                step: '01',
                title: 'Solicitud',
                description: 'Completa el formulario con tu experiencia y especialización'
              },
              {
                step: '02',
                title: 'Evaluación',
                description: 'Revisamos tu perfil y experiencia en 48h'
              },
              {
                step: '03',
                title: 'Asignación',
                description: 'Te enviamos proyectos que coincidan con tu perfil'
              },
              {
                step: '04',
                title: 'Cobro',
                description: 'Completa la valoración y recibe tu pago'
              }
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-bold text-primary/10 mb-4">{item.step}</div>
                <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                <p className="text-muted-foreground">{item.description}</p>
                
                {i < 3 && (
                  <ArrowRight className="hidden md:block absolute -right-4 top-8 text-primary/30 w-8 h-8" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Beneficios de colaborar con Capittal
            </h3>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                icon: DollarSign,
                title: 'Ingresos Predecibles',
                description: 'Flujo constante de proyectos bien remunerados'
              },
              {
                icon: Clock,
                title: 'Sin Prospección',
                description: 'Nosotros traemos los clientes, tú haces lo que sabes'
              },
              {
                icon: Shield,
                title: 'Herramientas Pro',
                description: 'Acceso a nuestra plataforma de valoración avanzada'
              },
              {
                icon: Users,
                title: 'Red Profesional',
                description: 'Conéctate con otros asesores de toda España'
              },
              {
                icon: FileText,
                title: 'Informes Automáticos',
                description: 'Genera PDFs profesionales en minutos'
              },
              {
                icon: TrendingUp,
                title: 'Crecimiento',
                description: 'Desarrolla tu expertise con casos variados'
              }
            ].map((benefit, i) => (
              <Card key={i} className="hover:shadow-lg transition-all hover:scale-[1.02]">
                <CardHeader>
                  <benefit.icon className="w-12 h-12 text-primary mb-4" />
                  <CardTitle>{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl lg:text-4xl font-bold mb-4">
              Lo que dicen nuestros colaboradores
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'María González',
                role: 'Asesora Financiera',
                text: 'Desde que colaboro con Capittal, mi agenda está llena. Ya no pierdo tiempo buscando clientes.'
              },
              {
                name: 'Carlos Ruiz',
                role: 'Experto en M&A',
                text: 'La plataforma es increíble. Reduzco el tiempo de valoración en un 70%.'
              },
              {
                name: 'Ana Martínez',
                role: 'Consultora',
                text: 'Proyectos interesantes, pago puntual y excelente soporte técnico.'
              }
            ].map((testimonial, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                      <CardDescription>{testimonial.role}</CardDescription>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{testimonial.text}"</p>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section className="py-20 bg-primary/5">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-3xl lg:text-4xl font-bold mb-4">
                Solicita colaborar ahora
              </h3>
              <p className="text-xl text-muted-foreground">
                Completa el formulario y te contactamos en menos de 48h
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Datos de Contacto</CardTitle>
                <CardDescription>
                  Cuéntanos sobre tu experiencia y especialización
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo</Label>
                    <Input 
                      id="nombre" 
                      placeholder="Tu nombre"
                      {...register('nombre')}
                    />
                    {errors.nombre && (
                      <p className="text-sm text-destructive">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Profesional</Label>
                    <Input 
                      id="email" 
                      type="email"
                      placeholder="tu@email.com"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input 
                      id="telefono" 
                      placeholder="+34 600 000 000"
                      {...register('telefono')}
                    />
                    {errors.telefono && (
                      <p className="text-sm text-destructive">{errors.telefono.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experiencia">Años de Experiencia</Label>
                    <select 
                      id="experiencia"
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                      {...register('experiencia')}
                    >
                      <option value="">Selecciona...</option>
                      <option value="0-2">0-2 años</option>
                      <option value="3-5">3-5 años</option>
                      <option value="5-10">5-10 años</option>
                      <option value="10+">Más de 10 años</option>
                    </select>
                    {errors.experiencia && (
                      <p className="text-sm text-destructive">{errors.experiencia.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Especialización (selecciona todas las que apliquen)</Label>
                    <div className="space-y-2">
                      {especializaciones.map((esp) => (
                        <div key={esp} className="flex items-center space-x-2">
                          <Checkbox
                            id={esp}
                            checked={currentEspecializacion.includes(esp)}
                            onCheckedChange={() => toggleEspecializacion(esp)}
                          />
                          <label
                            htmlFor={esp}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {esp}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.especializacion && (
                      <p className="text-sm text-destructive">{errors.especializacion.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    <CheckCircle className="mr-2 w-4 h-4" />
                    Enviar Solicitud
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-lg mb-4">Capittal</h4>
              <p className="text-sm text-muted-foreground">
                Plataforma profesional de valoración empresarial
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Producto</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/dashboard" className="hover:text-primary">Dashboard</Link></li>
                <li><Link to="/valuations" className="hover:text-primary">Valoraciones</Link></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Legal</h5>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Privacidad</a></li>
                <li><a href="#" className="hover:text-primary">Términos</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Contacto</h5>
              <p className="text-sm text-muted-foreground">
                info@capittal.com
              </p>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © 2025 Capittal. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
