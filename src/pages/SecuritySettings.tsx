import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Smartphone, Trash2, Monitor } from 'lucide-react';
import { MFASetup } from '@/components/auth/MFASetup';
import { format } from 'date-fns';
import { sanitizeError, logError } from '@/lib/utils';

export default function SecuritySettings() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check MFA status
      const { data: mfaFactor } = await supabase
        .from('user_mfa_factors')
        .select('is_verified')
        .eq('user_id', user.id)
        .eq('is_verified', true)
        .maybeSingle();

      setMfaEnabled(!!mfaFactor);

      // Load active sessions
      const { data: sessionsData } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_activity', { ascending: false });

      setSessions(sessionsData || []);
    } catch (error) {
      logError(error, 'SecuritySettings.loadSecurityData');
      toast.error(sanitizeError(error, 'Error al cargar configuración de seguridad'));
    } finally {
      setLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('¿Estás seguro de que deseas desactivar la autenticación de dos factores?')) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_mfa_factors')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMfaEnabled(false);
      toast.success('MFA desactivado correctamente');
    } catch (error) {
      logError(error, 'SecuritySettings.handleDisableMFA');
      toast.error(sanitizeError(error, 'Error al desactivar MFA'));
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Sesión revocada correctamente');
    } catch (error) {
      logError(error, 'SecuritySettings.handleRevokeSession');
      toast.error(sanitizeError(error, 'Error al revocar sesión'));
    }
  };

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (showMFASetup) {
    return (
      <div className="container max-w-2xl py-6">
        <MFASetup
          onComplete={() => {
            setShowMFASetup(false);
            setMfaEnabled(true);
            loadSecurityData();
          }}
        />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Seguridad</h1>
        <p className="text-muted-foreground">Gestiona la seguridad de tu cuenta</p>
      </div>

      {/* MFA Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticación de Dos Factores (MFA)
          </CardTitle>
          <CardDescription>
            Agrega una capa adicional de seguridad a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {mfaEnabled ? 'MFA Activado' : 'MFA Desactivado'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mfaEnabled
                    ? 'Tu cuenta está protegida con autenticación de dos factores'
                    : 'Mejora la seguridad de tu cuenta habilitando MFA'}
                </p>
              </div>
            </div>
            {mfaEnabled ? (
              <Button onClick={handleDisableMFA} variant="destructive">
                Desactivar
              </Button>
            ) : (
              <Button onClick={() => setShowMFASetup(true)}>
                Activar MFA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Sesiones Activas
          </CardTitle>
          <CardDescription>
            Gestiona los dispositivos donde has iniciado sesión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay sesiones activas</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{session.user_agent || 'Dispositivo desconocido'}</p>
                    <p className="text-sm text-muted-foreground">
                      IP: {session.ip_address} • Última actividad:{' '}
                      {format(new Date(session.last_activity), 'dd/MM/yyyy HH:mm')}
                    </p>
                    {session.location_city && (
                      <p className="text-xs text-muted-foreground">
                        {session.location_city}, {session.location_country}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleRevokeSession(session.id)}
                    variant="ghost"
                    size="icon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
