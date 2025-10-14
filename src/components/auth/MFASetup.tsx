import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield, Copy, CheckCircle2 } from 'lucide-react';

export const MFASetup = ({ onComplete }: { onComplete?: () => void }) => {
  const [secret, setSecret] = useState('');
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

      // Generar secret base32 aleatorio
      const randomBytes = new Uint8Array(20);
      crypto.getRandomValues(randomBytes);
      const base32Secret = base32Encode(randomBytes);
      
      setSecret(base32Secret);

      // Generar URL para QR code
      const issuer = 'AlgoPasa';
      const accountName = user.email;
      const otpauthUrl = `otpauth://totp/${issuer}:${accountName}?secret=${base32Secret}&issuer=${issuer}`;
      
      // Generar QR code usando API pública
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`;
      setQrCode(qrUrl);

    } catch (error) {
      console.error('Error generating MFA secret:', error);
      toast.error('Error al generar código MFA');
    }
  };

  const base32Encode = (buffer: Uint8Array): string => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let result = '';

    for (const byte of buffer) {
      bits += byte.toString(2).padStart(8, '0');
    }

    for (let i = 0; i < bits.length; i += 5) {
      const chunk = bits.slice(i, i + 5).padEnd(5, '0');
      result += alphabet[parseInt(chunk, 2)];
    }

    return result;
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Verificar el código TOTP
      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
        'mfa-verify',
        {
          body: {
            token: verificationCode,
            user_id: user.id,
            secret: secret // Solo para verificación inicial
          }
        }
      );

      if (verifyError) throw verifyError;

      if (!verifyResult?.valid) {
        toast.error('Código inválido. Intenta de nuevo.');
        setIsVerifying(false);
        return;
      }

      // Generar códigos de backup
      const { data: codes, error: codesError } = await supabase.rpc('generate_backup_codes');
      if (codesError) throw codesError;

      // Guardar MFA factor
      const { error: insertError } = await supabase
        .from('user_mfa_factors')
        .upsert({
          user_id: user.id,
          factor_type: 'totp',
          secret: secret,
          is_verified: true,
          backup_codes: codes
        });

      if (insertError) throw insertError;

      setBackupCodes(codes);
      setStep('backup');
      toast.success('MFA configurado correctamente');

    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Error al verificar código');
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
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono text-sm" />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(secret);
                    toast.success('Código copiado');
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
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
