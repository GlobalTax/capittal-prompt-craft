import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, FileText, Handshake, Lock, Target, TrendingUp, Users } from 'lucide-react';

export default function ClientLanding() {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: FileText,
      title: 'Valoración Profesional',
      description: 'Análisis detallado del valor real de tu empresa con metodologías certificadas',
    },
    {
      icon: Users,
      title: 'Compradores Cualificados',
      description: 'Acceso a nuestra red de compradores pre-verificados e interesados',
    },
    {
      icon: Lock,
      title: 'Proceso Confidencial',
      description: 'Máxima discreción durante todo el proceso de venta',
    },
    {
      icon: Handshake,
      title: 'Asesoramiento Integral',
      description: 'Acompañamiento legal, fiscal y estratégico completo',
    },
  ];

  const process = [
    {
      step: '1',
      title: 'Valoración Inicial',
      description: 'Análisis financiero y estratégico de tu empresa para determinar su valor de mercado',
      color: 'text-primary',
    },
    {
      step: '2',
      title: 'Preparación Documentación',
      description: 'Recopilación y organización de toda la información necesaria para la venta',
      color: 'text-chart-2',
    },
    {
      step: '3',
      title: 'Marketing a Compradores',
      description: 'Presentación de tu empresa a compradores potenciales de forma confidencial',
      color: 'text-chart-3',
    },
    {
      step: '4',
      title: 'Negociación y Cierre',
      description: 'Gestión de ofertas, due diligence y cierre exitoso de la operación',
      color: 'text-success',
    },
  ];

  const testimonials = [
    {
      company: 'Asesoría Fiscal Barcelona',
      sector: 'Servicios Profesionales',
      result: 'Vendida en 4 meses',
      quote: 'Proceso transparente y profesional. Maximizaron el valor de venta.',
    },
    {
      company: 'Empresa Seguridad Madrid',
      sector: 'Servicios de Seguridad',
      result: 'Valorada en 2.1M€',
      quote: 'Encontraron el comprador perfecto que respetó nuestro equipo.',
    },
  ];

  const faqs = [
    {
      question: '¿Cuánto cuesta el servicio?',
      answer: 'La valoración inicial es gratuita. Nuestros honorarios se basan en éxito: solo cobramos un porcentaje cuando se cierra la venta exitosamente.',
    },
    {
      question: '¿Cuánto tarda el proceso?',
      answer: 'El tiempo promedio es de 6-12 meses, dependiendo del sector, tamaño de la empresa y condiciones de mercado. Algunas operaciones pueden cerrarse en 3-4 meses.',
    },
    {
      question: '¿Es confidencial el proceso?',
      answer: 'Sí, mantenemos absoluta confidencialidad. Solo revelamos información a compradores cualificados que firman acuerdos de confidencialidad previamente.',
    },
    {
      question: '¿Qué documentación necesito?',
      answer: 'Principalmente: estados financieros de los últimos 3 años, declaraciones fiscales, contratos principales, nómina de clientes, y estructura organizativa. Te ayudamos a preparar todo.',
    },
    {
      question: '¿Puedo seguir operando durante la venta?',
      answer: 'Sí, es importante que la empresa continúe operando normalmente durante el proceso para mantener su valor. Te ayudamos a gestionar ambos aspectos.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 px-6">
        <div className="container mx-auto max-w-6xl text-center space-y-6">
          <Badge variant="outline" className="mb-4">
            <Building2 className="mr-2 h-3 w-3" />
            Especialistas en Venta de Empresas
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Vende tu Empresa al Mejor Precio
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Asesoramiento profesional de principio a fin para maximizar el valor de tu empresa y encontrar el comprador ideal
          </p>
          <div className="flex gap-4 justify-center pt-6">
            <Button size="lg" onClick={() => navigate('/resources/sell-business')} className="shadow-lg">
              <Target className="mr-2 h-5 w-5" />
              Solicitar Valoración Gratuita
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Ya soy asesor
            </Button>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Por qué Vender con Capittal?</h2>
            <p className="text-muted-foreground text-lg">
              Expertos en maximizar el valor de tu empresa
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <benefit.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Proceso */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Proceso de Venta en 4 Pasos</h2>
            <p className="text-muted-foreground text-lg">
              Un camino claro y estructurado hacia el éxito
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((step, index) => (
              <div key={index} className="relative">
                <Card className="h-full hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className={`text-4xl font-bold ${step.color} mb-2`}>{step.step}</div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < process.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <div className="w-6 h-1 bg-gradient-to-r from-primary to-accent"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Casos de Éxito</h2>
            <p className="text-muted-foreground text-lg">
              Empresas que confiaron en nosotros
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-gradient-to-br from-primary/5 to-accent/5">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-lg">{testimonial.company}</CardTitle>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      {testimonial.result}
                    </Badge>
                  </div>
                  <CardDescription>{testimonial.sector}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="italic text-muted-foreground">"{testimonial.quote}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Preguntas Frecuentes</h2>
            <p className="text-muted-foreground text-lg">
              Resolvemos tus dudas
            </p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-6">
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary to-accent text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl font-bold">¿Listo para Vender tu Empresa?</h2>
          <p className="text-xl opacity-90">
            Solicita una valoración gratuita y sin compromiso. Nuestro equipo te contactará en 24-48 horas.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/resources/sell-business')} className="shadow-lg">
            <TrendingUp className="mr-2 h-5 w-5" />
            Solicitar Valoración Ahora
          </Button>
          <p className="text-sm opacity-75">
            100% confidencial • Sin compromiso • Respuesta en 24-48h
          </p>
        </div>
      </section>
    </div>
  );
}
