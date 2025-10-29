import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function EmailVerificationBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkEmailVerification = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Show banner if email is not verified and user hasn't dismissed it
      if (user && !user.email_confirmed_at && !dismissed) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    checkEmailVerification();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkEmailVerification();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dismissed]);

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('No se pudo obtener tu email');
        return;
      }

      const { error } = await supabase.functions.invoke('resend-verification-email', {
        body: { email: user.email }
      });

      if (error) throw error;

      toast.success('Email de verificación enviado. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error('Error al enviar email. Intenta de nuevo más tarde.');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  const handleGoToVerifyPage = () => {
    navigate('/verify-email');
  };

  if (!show) return null;

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
      <Mail className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <span className="text-amber-900 dark:text-amber-100">
            <strong>Verifica tu email:</strong> Revisa tu bandeja de entrada y haz clic en el enlace de verificación.
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleGoToVerifyPage}
            className="bg-white dark:bg-gray-800"
          >
            Verificar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleResendEmail}
            disabled={loading}
            className="text-amber-900 dark:text-amber-100"
          >
            {loading ? 'Enviando...' : 'Reenviar'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-8 w-8 text-amber-900 dark:text-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
