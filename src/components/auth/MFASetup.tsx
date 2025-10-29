import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Copy, CheckCircle2 } from 'lucide-react';

export const MFASetup = ({ onComplete }: { onComplete?: () => void }) => {
  const [factorId, setFactorId] = useState<string>(''); // ✅ Nuevo: almacenar factor_id
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');

  useEffect(() => {
    generateMFASecret();
  }, []);

  const generateMFASecret = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      console.log('[MFASetup] Calling mfa-generate-secret...');

      // ✅ Llamar al edge function para generar secret server-side
      const { data, error } = await supabase.functions.invoke('mfa-generate-secret');

      if (error) {
        console.error('[MFASetup] Error generating secret:', error);
        throw error;
      }

      console.log('[MFASetup] Secret generated successfully (factor_id received)');

      // ✅ Guardar solo QR y factor_id (NO el secret)
      setQrCode(data.qr_code_url);
      setFactorId(data.factor_id);

    } catch (error) {
      console.error('Error generating MFA secret:', error);
      toast.error('Error al generar código MFA');
    }
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);

    try {
      console.log('[MFASetup] Verifying token...');

      // ✅ Solo enviar factor_id (NO el secret)
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
        'mfa-verify',
        {
          body: {
            token: verificationCode,
            factor_id: factorId // ✅ factor_id en lugar de user_id
          }
        }
      );

      if (verifyError) {
        console.error('[MFASetup] Verification error:', verifyError);
        toast.error('Error al verificar código');
        setIsVerifying(false);
        return;
      }

      if (!verifyResult?.valid) {
        toast.error('Código inválido. Por favor, inténtalo de nuevo.');
        setIsVerifying(false);
        return;
      }

      console.log('[MFASetup] ✅ Verification successful');

      // Guardar backup codes (ya generados por el edge function)
      if (verifyResult.backup_codes) {
        setBackupCodes(verifyResult.backup_codes);
      }

      toast.success('MFA configurado correctamente');
      setStep('backup');

    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Error al verificar MFA');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Códigos copiados al portapapeles');
  };

  const handleComplete = () => {
    onComplete?.();
  };

  if (step === 'backup') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Códigos de Respaldo
          </CardTitle>
          <CardDescription>
            Guarda estos códigos en un lugar seguro. Podrás usarlos si pierdes acceso a tu aplicación de autenticación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, i) => (
                <div key={i}>{code}</div>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={copyBackupCodes} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copiar Códigos
            </Button>
            <Button onClick={handleComplete} className="flex-1">
              Finalizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificar MFA</CardTitle>
          <CardDescription>
            Ingresa el código de 6 dígitos de tu aplicación de autenticación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de Verificación</Label>
            <Input
              id="code"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setStep('setup')} variant="outline" className="flex-1">
              Atrás
            </Button>
            <Button onClick={handleVerify} disabled={isVerifying} className="flex-1">
              {isVerifying ? 'Verificando...' : 'Verificar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Configurar Autenticación de Dos Factores
        </CardTitle>
        <CardDescription>
          Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {qrCode && (
          <div className="flex flex-col items-center space-y-4">
            <img src={qrCode} alt="QR Code" className="border rounded-md" />
            
            <div className="w-full space-y-2">
              <Label>O ingresa manualmente este código:</Label>
              <div className="p-2 bg-muted rounded text-sm break-all text-xs text-muted-foreground text-center font-mono">
                Factor ID: {factorId}
              </div>
              <p className="text-xs text-muted-foreground">
                El código secreto está almacenado de forma segura en el servidor
              </p>
            </div>
          </div>
        )}

        <Button onClick={() => setStep('verify')} className="w-full">
          Continuar
        </Button>
      </CardContent>
    </Card>
  );
};
