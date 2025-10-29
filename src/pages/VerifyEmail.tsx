import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Get current user email
    const loadUserEmail = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        
        // Check if already verified
        if (user.email_confirmed_at) {
          toast.success('Tu email ya está verificado');
          navigate('/dashboard');
        }
      } else {
        navigate('/login');
      }
    };

    loadUserEmail();
  }, [navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (countdown > 0) {
      toast.error(`Espera ${countdown} segundos antes de reenviar`);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('resend-verification-email', {
        body: { email }
      });

      if (error) throw error;

      setEmailSent(true);
      setCountdown(60); // 60 seconds cooldown
      toast.success('Email de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error('Error al enviar email. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    navigate('/security');
  };

  const handleCheckVerification = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email_confirmed_at) {
      toast.success('¡Email verificado correctamente!');
      navigate('/dashboard');
    } else {
      toast.info('El email aún no ha sido verificado. Revisa tu bandeja de entrada.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Verifica tu Email</CardTitle>
          <CardDescription>
            Hemos enviado un email de verificación a tu dirección de correo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-muted"
            />
          </div>

          {emailSent && (
            <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-950 p-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-green-900 dark:text-green-100">
                Email enviado correctamente. Si no lo encuentras, revisa tu carpeta de spam.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Instrucciones:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Revisa tu bandeja de entrada</li>
                <li>Busca el email de Capittal Valoraciones</li>
                <li>Haz clic en el enlace de verificación</li>
                <li>Regresa aquí y haz clic en "Ya verificué mi email"</li>
              </ol>
            </div>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleResendEmail}
              disabled={loading || countdown > 0}
            >
              {loading ? (
                'Enviando...'
              ) : countdown > 0 ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Reenviar en {countdown}s
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Reenviar Email de Verificación
                </>
              )}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleCheckVerification}
            >
              Ya verificué mi email
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={handleChangeEmail}
            >
              Cambiar dirección de email
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            ¿Necesitas ayuda?{' '}
            <a href="mailto:support@capittalvaloraciones.com" className="text-primary hover:underline">
              Contáctanos
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
