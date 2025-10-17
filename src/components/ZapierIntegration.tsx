import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Zap, Send, Settings, Activity, CheckCircle, AlertCircle, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ZapierWebhook {
  id: string;
  name: string;
  url: string;
  triggerType: string;
  isActive: boolean;
  lastTriggered?: string;
  totalTriggers: number;
  description: string;
}

interface TriggerEvent {
  id: string;
  type: string;
  timestamp: string;
  status: 'success' | 'failed' | 'pending';
  webhookId: string;
  payload: any;
  response?: string;
}

const ZapierIntegration = () => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<ZapierWebhook[]>([]);
  const [triggerEvents, setTriggerEvents] = useState<TriggerEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [queueStats, setQueueStats] = useState({ pending: 0, sent: 0, failed: 0 });
  const [testWebhookUrl, setTestWebhookUrl] = useState('');
  const [selectedTrigger, setSelectedTrigger] = useState('');

  // Simulated webhook data
  const simulatedWebhooks: ZapierWebhook[] = [
    {
      id: '1',
      name: 'Nuevas Valoraciones → Google Sheets',
      url: 'https://hooks.zapier.com/hooks/catch/123456/abcdef/',
      triggerType: 'valuation_completed',
      isActive: true,
      lastTriggered: '2024-01-15T10:30:00Z',
      totalTriggers: 45,
      description: 'Envía datos de valoraciones completadas a Google Sheets'
    },
    {
      id: '2',
      name: 'Alertas Críticas → Slack',
      url: 'https://hooks.zapier.com/hooks/catch/789012/ghijkl/',
      triggerType: 'critical_alert',
      isActive: true,
      lastTriggered: '2024-01-14T16:45:00Z',
      totalTriggers: 12,
      description: 'Notifica alertas críticas al canal de Slack del equipo'
    },
    {
      id: '3',
      name: 'Reportes Semanales → Email',
      url: 'https://hooks.zapier.com/hooks/catch/345678/mnopqr/',
      triggerType: 'weekly_report',
      isActive: false,
      totalTriggers: 8,
      description: 'Envía resumen semanal de valoraciones por email'
    }
  ];

  const simulatedEvents: TriggerEvent[] = [
    {
      id: '1',
      type: 'valuation_completed',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success',
      webhookId: '1',
      payload: { company: 'TechCorp S.A.', value: 45000000, change: 8 },
      response: '200 OK'
    },
    {
      id: '2',
      type: 'critical_alert',
      timestamp: '2024-01-14T16:45:00Z',
      status: 'success',
      webhookId: '2',
      payload: { alert: 'Umbral de deuda superado', company: 'IndustrialCorp' },
      response: '200 OK'
    },
    {
      id: '3',
      type: 'valuation_completed',
      timestamp: '2024-01-14T14:20:00Z',
      status: 'failed',
      webhookId: '1',
      payload: { company: 'MedSolutions Ltd.', value: 25000000 },
      response: '500 Internal Server Error'
    }
  ];

  React.useEffect(() => {
    loadQueueStats();
    setWebhooks(simulatedWebhooks);
    setTriggerEvents(simulatedEvents);
  }, []);

  const loadQueueStats = async () => {
    try {
      const { data, error } = await supabase
        .from('zapier_webhook_queue')
        .select('status');
      
      if (error) throw error;
      
      const stats = data.reduce((acc, item) => {
        acc[item.status as keyof typeof acc]++;
        return acc;
      }, { pending: 0, sent: 0, failed: 0 });
      
      setQueueStats(stats);
    } catch (error) {
      console.error('[Zapier] Failed to load queue stats:', error);
    }
  };

  const handleProcessQueue = async () => {
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-zapier-webhooks');
      
      if (error) throw error;
      
      await loadQueueStats();
      
      toast({
        title: "Cola Procesada",
        description: `Procesados ${data.processed} webhooks: ${data.successful} exitosos, ${data.failed} fallidos`,
      });
    } catch (error) {
      console.error('[Zapier] Failed to process queue:', error);
      toast({
        title: "Error",
        description: "Error al procesar la cola de webhooks",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerTypes = [
    { value: 'valuation_completed', label: 'Valoración Completada' },
    { value: 'valuation_updated', label: 'Valoración Actualizada' },
    { value: 'critical_alert', label: 'Alerta Crítica' },
    { value: 'market_change', label: 'Cambio de Mercado' },
    { value: 'due_date_alert', label: 'Fecha de Vencimiento' },
    { value: 'weekly_report', label: 'Reporte Semanal' },
    { value: 'monthly_report', label: 'Reporte Mensual' },
  ];

  const handleTestWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testWebhookUrl) {
      toast({
        title: "Error",
        description: "Por favor ingresa una URL de webhook",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Triggering Zapier webhook:", testWebhookUrl);

    try {
      const testPayload = {
        timestamp: new Date().toISOString(),
        event_type: selectedTrigger || 'test',
        test_data: {
          company: 'Empresa de Prueba',
          valuation: 10000000,
          sector: 'Tecnología',
          date: new Date().toISOString().split('T')[0]
        },
        triggered_from: window.location.origin,
      };

      const response = await fetch(testWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors",
        body: JSON.stringify(testPayload),
      });

      toast({
        title: "Webhook Enviado",
        description: "La solicitud fue enviada a Zapier. Verifica el historial de tu Zap para confirmar que se activó.",
      });

      // Add to events log
      const newEvent: TriggerEvent = {
        id: Date.now().toString(),
        type: selectedTrigger || 'test',
        timestamp: new Date().toISOString(),
        status: 'success',
        webhookId: 'test',
        payload: testPayload,
        response: 'Request sent (no-cors mode)'
      };
      setTriggerEvents(prev => [newEvent, ...prev]);

    } catch (error) {
      console.error("Error triggering webhook:", error);
      toast({
        title: "Error",
        description: "Error al enviar el webhook. Verifica la URL e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addWebhook = () => {
    if (!testWebhookUrl || !selectedTrigger) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    const newWebhook: ZapierWebhook = {
      id: Date.now().toString(),
      name: `${triggerTypes.find(t => t.value === selectedTrigger)?.label} → Zap`,
      url: testWebhookUrl,
      triggerType: selectedTrigger,
      isActive: true,
      totalTriggers: 0,
      description: 'Webhook configurado manualmente'
    };

    setWebhooks(prev => [...prev, newWebhook]);
    setTestWebhookUrl('');
    setSelectedTrigger('');

    toast({
      title: "Webhook Agregado",
      description: "El webhook ha sido configurado exitosamente",
    });
  };

  const toggleWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.map(webhook => 
      webhook.id === webhookId 
        ? { ...webhook, isActive: !webhook.isActive }
        : webhook
    ));
  };

  const removeWebhook = (webhookId: string) => {
    setWebhooks(prev => prev.filter(webhook => webhook.id !== webhookId));
    toast({
      title: "Webhook Eliminado",
      description: "El webhook ha sido eliminado correctamente",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Integración con Zapier
          </CardTitle>
          <CardDescription>
            Automatiza flujos de trabajo conectando tus valoraciones con más de 5,000 aplicaciones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>Estado de la Cola:</strong> {queueStats.pending} pendientes, {queueStats.sent} enviados, {queueStats.failed} fallidos
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleProcessQueue}
                  disabled={isProcessing || queueStats.pending === 0}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                  Procesar Cola
                </Button>
              </div>
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="webhooks" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              <TabsTrigger value="test">Probar</TabsTrigger>
              <TabsTrigger value="events">Eventos</TabsTrigger>
              <TabsTrigger value="templates">Plantillas</TabsTrigger>
            </TabsList>

            <TabsContent value="webhooks" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Webhooks Configurados</h3>
                <Button 
                  onClick={() => window.open('https://zapier.com/apps/webhook/integrations', '_blank')}
                  variant="outline"
                  size="sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Crear Zap
                </Button>
              </div>

              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{webhook.name}</h4>
                            <Badge variant={webhook.isActive ? 'default' : 'secondary'}>
                              {webhook.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {webhook.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Trigger</p>
                              <p className="capitalize">
                                {triggerTypes.find(t => t.value === webhook.triggerType)?.label}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Activaciones</p>
                              <p>{webhook.totalTriggers}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Última Activación</p>
                              <p>{webhook.lastTriggered ? formatTimestamp(webhook.lastTriggered) : 'Nunca'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleWebhook(webhook.id)}
                          >
                            {webhook.isActive ? 'Pausar' : 'Activar'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeWebhook(webhook.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {webhooks.length === 0 && (
                  <div className="text-center py-8">
                    <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      No hay webhooks configurados
                    </p>
                    <Button onClick={() => window.open('https://zapier.com', '_blank')}>
                      Empezar con Zapier
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <h3 className="text-lg font-semibold">Probar Webhook</h3>
              
              <form onSubmit={handleTestWebhook} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">URL del Webhook</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      placeholder="https://hooks.zapier.com/hooks/catch/..."
                      value={testWebhookUrl}
                      onChange={(e) => setTestWebhookUrl(e.target.value)}
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Copia la URL del webhook desde tu Zap en Zapier
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trigger-type">Tipo de Evento</Label>
                    <Select value={selectedTrigger} onValueChange={setSelectedTrigger} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {triggerTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="test-payload">Datos de Prueba (JSON)</Label>
                    <Textarea
                      id="test-payload"
                      placeholder="Los datos de prueba se generarán automáticamente..."
                      value={JSON.stringify({
                        company: 'Empresa de Prueba',
                        valuation: 10000000,
                        sector: 'Tecnología',
                        date: new Date().toISOString().split('T')[0]
                      }, null, 2)}
                      rows={6}
                      readOnly
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading} className="flex-1">
                    {isLoading ? (
                      <>
                        <Send className="h-4 w-4 mr-2 animate-pulse" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Enviar Prueba
                      </>
                    )}
                  </Button>
                  <Button type="button" onClick={addWebhook} variant="outline">
                    Guardar Webhook
                  </Button>
                </div>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Cómo configurar tu Zap:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Ve a <a href="https://zapier.com" target="_blank" className="underline">zapier.com</a> y crea una nueva cuenta</li>
                  <li>Crea un nuevo Zap y selecciona "Webhooks by Zapier" como trigger</li>
                  <li>Elige "Catch Hook" y copia la URL del webhook</li>
                  <li>Pégala arriba y configura las acciones que quieres automatizar</li>
                  <li>¡Prueba tu webhook y activa el Zap!</li>
                </ol>
              </div>
            </TabsContent>

            <TabsContent value="events" className="space-y-4">
              <h3 className="text-lg font-semibold">Historial de Eventos</h3>
              
              <div className="space-y-3">
                {triggerEvents.length > 0 ? (
                  triggerEvents.map((event) => (
                    <Card key={event.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(event.status)}
                            <div>
                              <h4 className="font-semibold">
                                {triggerTypes.find(t => t.value === event.type)?.label}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {formatTimestamp(event.timestamp)}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={event.status === 'success' ? 'default' : 'destructive'}
                          >
                            {event.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground mb-1">Payload:</p>
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(event.payload, null, 2)}
                            </pre>
                          </div>
                          {event.response && (
                            <div>
                              <p className="text-muted-foreground mb-1">Respuesta:</p>
                              <p className="bg-gray-100 p-2 rounded text-xs">
                                {event.response}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay eventos registrados</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <h3 className="text-lg font-semibold">Plantillas de Automatización</h3>
              
              <div className="grid gap-4">
                {[
                  {
                    title: "Valoraciones → Google Sheets",
                    description: "Guarda automáticamente todas las valoraciones completadas en una hoja de cálculo",
                    trigger: "Valoración completada",
                    actions: ["Crear fila en Google Sheets", "Enviar notificación por email"]
                  },
                  {
                    title: "Alertas Críticas → Slack",
                    description: "Notifica al equipo inmediatamente cuando hay alertas críticas",
                    trigger: "Alerta crítica",
                    actions: ["Enviar mensaje a Slack", "Crear tarea en Asana"]
                  },
                  {
                    title: "Reportes → Email Semanal",
                    description: "Envía un resumen semanal de todas las valoraciones y alertas",
                    trigger: "Reporte semanal",
                    actions: ["Generar PDF", "Enviar por email", "Guardar en Drive"]
                  },
                  {
                    title: "Nuevos Clientes → CRM",
                    description: "Sincroniza datos de nuevas valoraciones con tu CRM",
                    trigger: "Valoración completada",
                    actions: ["Crear contacto en CRM", "Asignar a representante"]
                  }
                ].map((template, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold mb-2">{template.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {template.description}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Trigger:</p>
                              <Badge variant="outline">{template.trigger}</Badge>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Acciones:</p>
                              <div className="space-y-1">
                                {template.actions.map((action, i) => (
                                  <Badge key={i} variant="secondary" className="mr-1 mb-1">
                                    {action}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Usar Plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ZapierIntegration;