import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MFAVerification } from '@/components/auth/MFAVerification';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMFAModal, setShowMFAModal] = useState(false);
  const [tempUserId, setTempUserId] = useState<string | null>(null);
  const { signIn, user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const nextUrl = searchParams.get('next');
  const from = nextUrl || location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await signIn(email, password);

    if (error) {
      setLoading(false);
      return;
    }

    // Check if MFA is enabled for this user
    const userId = data?.user?.id;
    if (userId) {
      const { data: mfaEnabled } = await supabase
        .from('user_mfa_factors')
        .select('id')
        .eq('user_id', userId)
        .eq('is_verified', true)
        .maybeSingle();

      if (mfaEnabled) {
        // Show MFA verification modal
        setTempUserId(userId);
        setShowMFAModal(true);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    navigate(from, { replace: true });
  };

  const handleMFASuccess = () => {
    setShowMFAModal(false);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg border-border/50">
        <CardHeader className="space-y-1 text-center">
          <div className="space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">MiValoracion</CardTitle>
            <p className="text-xs text-muted-foreground">un producto de Capittal Suites</p>
          </div>
          <CardDescription>{t('auth.loginSubtitle')}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t('auth.loggingIn') : t('auth.loginButton')}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                {t('auth.register')}
              </Link>
            </p>
            <div className="text-center pt-2 border-t">
              <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                Términos y Condiciones
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={showMFAModal} onOpenChange={setShowMFAModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificación de Dos Factores</DialogTitle>
            <DialogDescription>
              Ingresa el código de tu aplicación de autenticación
            </DialogDescription>
          </DialogHeader>
          {tempUserId && (
            <MFAVerification
              userId={tempUserId}
              onSuccess={handleMFASuccess}
              onCancel={() => setShowMFAModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
