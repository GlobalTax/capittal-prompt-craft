import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Save, UserPlus, Trash2, Settings2 } from 'lucide-react';

interface AlertConfig {
  thresholds: {
    highValueLeadAmount: number;
    maxRegistrationsPerIP: number;
    maxDaysWithoutVerification: number;
    duplicateLeadWindowDays: number;
  };
  recipients: string[];
  schedule: {
    immediateAlerts: boolean;
    dailySummary: boolean;
    dailySummaryTime: string;
    weeklySummary: boolean;
    weeklySummaryDay: string;
  };
  enabledAlerts: {
    newUserRegistration: boolean;
    newCollaborator: boolean;
    highValueLead: boolean;
    suspiciousActivity: boolean;
    roleChange: boolean;
    dataDelete: boolean;
    duplicateLead: boolean;
    commissionChange: boolean;
  };
}

const defaultConfig: AlertConfig = {
  thresholds: {
    highValueLeadAmount: 5000000,
    maxRegistrationsPerIP: 5,
    maxDaysWithoutVerification: 7,
    duplicateLeadWindowDays: 30
  },
  recipients: [],
  schedule: {
    immediateAlerts: true,
    dailySummary: false,
    dailySummaryTime: '9',
    weeklySummary: false,
    weeklySummaryDay: 'monday'
  },
  enabledAlerts: {
    newUserRegistration: true,
    newCollaborator: true,
    highValueLead: true,
    suspiciousActivity: true,
    roleChange: true,
    dataDelete: true,
    duplicateLead: false,
    commissionChange: false
  }
};

export default function AlertSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<AlertConfig>(defaultConfig);

  // Cargar configuración actual
  const { isLoading } = useQuery({
    queryKey: ['alert-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commission_settings')
        .select('setting_value')
        .eq('setting_key', 'alert_config')
        .maybeSingle();

      if (error) throw error;
      
      if (data && data.setting_value) {
        const loadedConfig = data.setting_value as any;
        setConfig(loadedConfig);
        return loadedConfig;
      }
      return defaultConfig;
    }
  });

  // Guardar configuración
  const saveMutation = useMutation({
    mutationFn: async (newConfig: AlertConfig) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('commission_settings')
        .upsert({
          setting_key: 'alert_config',
          setting_value: newConfig as any,
          updated_by: user?.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-config'] });
      toast({
        title: 'Configuración guardada',
        description: 'Los cambios se han aplicado correctamente',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración',
        variant: 'destructive',
      });
    }
  });

  const updateThreshold = (key: keyof AlertConfig['thresholds'], value: number) => {
    setConfig(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: value
      }
    }));
  };

  const updateSchedule = (key: keyof AlertConfig['schedule'], value: any) => {
    setConfig(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [key]: value
      }
    }));
  };

  const updateEnabledAlert = (key: keyof AlertConfig['enabledAlerts'], value: boolean) => {
    setConfig(prev => ({
      ...prev,
      enabledAlerts: {
        ...prev.enabledAlerts,
        [key]: value
      }
    }));
  };

  const addRecipient = () => {
    setConfig(prev => ({
      ...prev,
      recipients: [...prev.recipients, '']
    }));
  };

  const updateRecipient = (index: number, value: string) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.map((r, i) => i === index ? value : r)
    }));
  };

  const removeRecipient = (index: number) => {
    setConfig(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    saveMutation.mutate(config);
  };

  if (isLoading) {
    return <div className="container mx-auto py-8 px-4">Cargando configuración...</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Settings2 className="h-8 w-8" />
            Configuración de Alertas
          </h1>
          <p className="text-muted-foreground">
            Personaliza umbrales, destinatarios y horarios de notificaciones
          </p>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>

      {/* Umbrales de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Umbrales</CardTitle>
          <CardDescription>
            Define los valores que disparan alertas automáticas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="highValueLead">Lead de alto valor (€)</Label>
              <Input
                id="highValueLead"
                type="number"
                value={config.thresholds.highValueLeadAmount}
                onChange={(e) => updateThreshold('highValueLeadAmount', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Alertar cuando un lead supere este valor de facturación anual
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRegistrations">Registros desde misma IP</Label>
              <Input
                id="maxRegistrations"
                type="number"
                value={config.thresholds.maxRegistrationsPerIP}
                onChange={(e) => updateThreshold('maxRegistrationsPerIP', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Máximo de registros desde la misma IP en 24 horas
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDaysVerification">Días sin verificar usuario</Label>
              <Input
                id="maxDaysVerification"
                type="number"
                value={config.thresholds.maxDaysWithoutVerification}
                onChange={(e) => updateThreshold('maxDaysWithoutVerification', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Alertar si un usuario permanece sin verificar más de estos días
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duplicateWindow">Ventana de leads duplicados (días)</Label>
              <Input
                id="duplicateWindow"
                type="number"
                value={config.thresholds.duplicateLeadWindowDays}
                onChange={(e) => updateThreshold('duplicateLeadWindowDays', parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Detectar duplicados en esta ventana temporal
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Destinatarios */}
      <Card>
        <CardHeader>
          <CardTitle>Destinatarios de Alertas</CardTitle>
          <CardDescription>
            Emails que recibirán notificaciones de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.recipients.map((email, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={email}
                onChange={(e) => updateRecipient(index, e.target.value)}
                placeholder="email@ejemplo.com"
                type="email"
              />
              <Button
                size="icon"
                variant="destructive"
                onClick={() => removeRecipient(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={addRecipient} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar destinatario
          </Button>
        </CardContent>
      </Card>

      {/* Horarios de Notificaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Programación de Notificaciones</CardTitle>
          <CardDescription>
            Configura cuándo y cómo recibir las alertas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones inmediatas (24/7)</Label>
              <p className="text-sm text-muted-foreground">
                Para alertas críticas de seguridad
              </p>
            </div>
            <Switch
              checked={config.schedule.immediateAlerts}
              onCheckedChange={(checked) => updateSchedule('immediateAlerts', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumen diario</Label>
              <p className="text-sm text-muted-foreground">
                Email diario con resumen de actividad
              </p>
            </div>
            <Switch
              checked={config.schedule.dailySummary}
              onCheckedChange={(checked) => updateSchedule('dailySummary', checked)}
            />
          </div>

          {config.schedule.dailySummary && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="dailyTime">Hora de envío</Label>
              <Select
                value={config.schedule.dailySummaryTime}
                onValueChange={(value) => updateSchedule('dailySummaryTime', value)}
              >
                <SelectTrigger id="dailyTime">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Resumen semanal</Label>
              <p className="text-sm text-muted-foreground">
                Email semanal con estadísticas completas
              </p>
            </div>
            <Switch
              checked={config.schedule.weeklySummary}
              onCheckedChange={(checked) => updateSchedule('weeklySummary', checked)}
            />
          </div>

          {config.schedule.weeklySummary && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="weeklyDay">Día de la semana</Label>
              <Select
                value={config.schedule.weeklySummaryDay}
                onValueChange={(value) => updateSchedule('weeklySummaryDay', value)}
              >
                <SelectTrigger id="weeklyDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Lunes</SelectItem>
                  <SelectItem value="tuesday">Martes</SelectItem>
                  <SelectItem value="wednesday">Miércoles</SelectItem>
                  <SelectItem value="thursday">Jueves</SelectItem>
                  <SelectItem value="friday">Viernes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipos de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Alertas</CardTitle>
          <CardDescription>
            Selecciona qué eventos generan notificaciones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'newUserRegistration', label: 'Nuevos registros de usuario' },
            { key: 'newCollaborator', label: 'Nuevos colaboradores' },
            { key: 'highValueLead', label: 'Leads de alto valor' },
            { key: 'suspiciousActivity', label: 'Actividad sospechosa' },
            { key: 'roleChange', label: 'Cambios de rol' },
            { key: 'dataDelete', label: 'Eliminación de datos' },
            { key: 'duplicateLead', label: 'Leads duplicados' },
            { key: 'commissionChange', label: 'Cambios en comisiones' }
          ].map(alert => (
            <div key={alert.key} className="flex items-center justify-between">
              <Label htmlFor={alert.key}>{alert.label}</Label>
              <Switch
                id={alert.key}
                checked={config.enabledAlerts[alert.key as keyof AlertConfig['enabledAlerts']]}
                onCheckedChange={(checked) => 
                  updateEnabledAlert(alert.key as keyof AlertConfig['enabledAlerts'], checked)
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  );
}
