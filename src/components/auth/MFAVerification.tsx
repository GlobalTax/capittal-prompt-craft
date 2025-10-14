import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

interface MFAVerificationProps {
  userId: string;
  onSuccess: () => void;
  onCancel?: () => void;
}

export const MFAVerification = ({ userId, onSuccess, onCancel }: MFAVerificationProps) => {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error('El código debe tener 6 dígitos');
      return;
    }

    setIsVerifying(true);

    try {
      const { data, error } = await supabase.functions.invoke('mfa-verify', {
        body: { token: code, user_id: userId }
      });

      if (error) throw error;

      if (data?.valid) {
        toast.success('Verificación exitosa');
        onSuccess();
      } else {
        toast.error('Código inválido. Intenta de nuevo.');
        setCode('');
      }
    } catch (error) {
      console.error('Error verifying MFA:', error);
      toast.error('Error al verificar código');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Verificación de Dos Factores
        </CardTitle>
        <CardDescription>
          Ingresa el código de 6 dígitos de tu aplicación de autenticación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Código de Autenticación</Label>
          <Input
            id="mfa-code"
            type="text"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="text-center text-2xl tracking-widest"
            autoFocus
          />
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button onClick={onCancel} variant="outline" className="flex-1">
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleVerify} 
            disabled={isVerifying || code.length !== 6}
            className="flex-1"
          >
            {isVerifying ? 'Verificando...' : 'Verificar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
