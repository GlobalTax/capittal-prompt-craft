import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 py-12">
      <div className="max-w-4xl mx-auto">
        <Link to="/register">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al registro
          </Button>
        </Link>

        <Card className="shadow-lg border-border/50">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Términos y Condiciones de Uso
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Aceptación de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Al acceder y utilizar <strong>Capittal</strong> (la "Plataforma"), proporcionada por <strong>Navarro Empresarial</strong>, 
                el usuario acepta estar vinculado por estos Términos y Condiciones. Si no está de acuerdo con estos términos, 
                no debe utilizar la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Naturaleza del Servicio</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                <strong>Capittal es una herramienta gratuita</strong> proporcionada por Navarro Empresarial para facilitar 
                la elaboración de valoraciones empresariales y análisis financieros.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>El servicio se proporciona <strong>"tal cual"</strong> y <strong>"según disponibilidad"</strong>.</li>
                <li>No se requiere pago alguno para acceder y utilizar las funcionalidades básicas de la Plataforma.</li>
                <li>No garantizamos la disponibilidad continua, ininterrumpida o libre de errores del servicio.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Derecho de Discontinuación</h2>
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Navarro Empresarial <strong>se reserva el derecho de modificar, suspender o descontinuar</strong> total o 
                  parcialmente el servicio de Capittal en cualquier momento, <strong>con o sin previo aviso</strong>.
                </p>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                El usuario reconoce y acepta que Navarro Empresarial no será responsable ante el usuario ni ante terceros 
                por cualquier modificación, suspensión o discontinuación del servicio.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Limitación de Responsabilidad</h2>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  Las valoraciones y análisis generados por la Plataforma son <strong>orientativos</strong> y no constituyen 
                  asesoramiento profesional vinculante ni garantizan resultados específicos.
                </li>
                <li>
                  El usuario es el único responsable del uso que haga de las valoraciones generadas y de las decisiones 
                  tomadas con base en ellas.
                </li>
                <li>
                  No garantizamos la exactitud, completitud, actualidad o idoneidad de la información proporcionada por la Plataforma.
                </li>
                <li>
                  Navarro Empresarial no será responsable de daños directos, indirectos, incidentales, consecuentes o 
                  punitivos derivados del uso o la imposibilidad de uso de la Plataforma.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Uso Responsable</h2>
              <p className="text-muted-foreground leading-relaxed">
                El usuario se compromete a:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Utilizar la Plataforma de forma legal y conforme a estos Términos.</li>
                <li>No utilizar la Plataforma para fines fraudulentos, ilegales o no autorizados.</li>
                <li>Mantener la confidencialidad de sus credenciales de acceso.</li>
                <li>No intentar acceder a áreas restringidas de la Plataforma ni interferir con su funcionamiento.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Privacidad y Datos Personales</h2>
              <p className="text-muted-foreground leading-relaxed">
                Los datos personales proporcionados por el usuario se utilizarán únicamente para el funcionamiento de la Plataforma 
                y la prestación del servicio. Navarro Empresarial se compromete a cumplir con la normativa vigente en materia de 
                protección de datos personales (RGPD y LOPDGDD).
              </p>
              <p className="text-muted-foreground leading-relaxed mt-2">
                Para más información sobre cómo tratamos sus datos, puede consultar nuestra Política de Privacidad.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Propiedad Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todos los contenidos, diseños, logotipos, textos, gráficos y código de la Plataforma son propiedad de 
                Navarro Empresarial o de sus licenciantes y están protegidos por las leyes de propiedad intelectual.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Modificaciones de los Términos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Navarro Empresarial se reserva el derecho de modificar estos Términos y Condiciones en cualquier momento. 
                Las modificaciones serán efectivas desde su publicación en la Plataforma. Se recomienda revisar periódicamente 
                estos términos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Legislación Aplicable y Jurisdicción</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estos Términos se rigen por la legislación española. Para cualquier controversia derivada de estos términos, 
                las partes se someten a los juzgados y tribunales correspondientes según la legislación vigente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Contacto</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para cualquier consulta relacionada con estos Términos y Condiciones, puede contactar con nosotros en:
              </p>
              <div className="bg-muted/50 p-4 rounded-lg mt-3">
                <p className="text-muted-foreground"><strong>Navarro Empresarial</strong></p>
                <p className="text-muted-foreground">Email: contacto@navarroempresarial.com</p>
              </div>
            </section>

            <div className="border-t border-border pt-6 mt-8">
              <p className="text-sm text-muted-foreground italic text-center">
                Al utilizar Capittal, usted reconoce haber leído, entendido y aceptado estos Términos y Condiciones en su totalidad.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
