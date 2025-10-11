import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, AlertTriangle, TrendingUp, Calendar, Settings, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { useAuth } from '@/hooks/useAuth';

const AlertSystem = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    alerts, 
    alertRules, 
    unreadCount, 
    loading,
    markAsRead, 
    markAllAsRead: markAllRead, 
    deleteAlert: removeAlert, 
    toggleRule 
  } = useAlerts(user?.id);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);


  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Bell className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'market_change': return <TrendingUp className="h-4 w-4" />;
      case 'valuation_update': return <CheckCircle className="h-4 w-4" />;
      case 'due_date': return <Calendar className="h-4 w-4" />;
      case 'threshold': return <AlertTriangle className="h-4 w-4" />;
      case 'data_sync': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };


  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Hace menos de 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} días`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Cargando alertas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                Sistema de Alertas Inteligentes
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Recibe notificaciones automáticas sobre cambios importantes en tus valoraciones
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
                id="notifications-toggle"
              />
              <Label htmlFor="notifications-toggle">Notificaciones</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="alerts" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alerts">
                Alertas Activas
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="rules">Reglas</TabsTrigger>
              <TabsTrigger value="settings">Configuración</TabsTrigger>
            </TabsList>

            <TabsContent value="alerts" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Alertas Recientes</h3>
                {unreadCount > 0 && (
                  <Button size="sm" variant="outline" onClick={markAllRead}>
                    Marcar todas como leídas
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <Card key={alert.id} className={`transition-all ${!alert.is_read ? 'ring-2 ring-blue-200' : ''}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2 mt-1">
                              {getSeverityIcon(alert.severity)}
                              {getTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-semibold ${!alert.is_read ? 'text-blue-600' : ''}`}>
                                  {alert.title}
                                </h4>
                                <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                                  {alert.severity}
                                </Badge>
                                {alert.action_required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Acción requerida
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>{formatTimestamp(alert.created_at)}</span>
                                {alert.related_entity && (
                                  <span>• {alert.related_entity}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!alert.is_read && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(alert.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAlert(alert.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay alertas activas</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Reglas de Alertas</h3>
                <Button size="sm">
                  + Nueva Regla
                </Button>
              </div>

              <div className="space-y-3">
                {alertRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold">{rule.name}</h4>
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? 'Activa' : 'Inactiva'}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Condición</p>
                              <p>{rule.condition} ≥ {rule.threshold}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Frecuencia</p>
                              <p className="capitalize">{rule.frequency}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Canales</p>
                              <p>{rule.channels.join(', ')}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.enabled}
                            onCheckedChange={() => toggleRule(rule.id)}
                          />
                          <Button size="sm" variant="outline">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración de Notificaciones</h3>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Canales de Notificación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones en la aplicación</Label>
                        <p className="text-sm text-muted-foreground">
                          Recibe alertas directamente en la interfaz
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Notificaciones por email</Label>
                        <p className="text-sm text-muted-foreground">
                          Enviar alertas importantes por correo electrónico
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Webhooks</Label>
                        <p className="text-sm text-muted-foreground">
                          Integración con Slack, Teams y otros servicios
                        </p>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Configuración de Email</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email de notificaciones</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          defaultValue="usuario@empresa.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frecuencia de resumen</Label>
                        <Select defaultValue="daily">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Inmediato</SelectItem>
                            <SelectItem value="hourly">Cada hora</SelectItem>
                            <SelectItem value="daily">Diario</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Umbrales Personalizados</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="market-threshold">Cambio en múltiplos (%)</Label>
                        <Input
                          id="market-threshold"
                          type="number"
                          defaultValue="10"
                          min="1"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="debt-threshold">Ratio de deuda (%)</Label>
                        <Input
                          id="debt-threshold"
                          type="number"
                          defaultValue="70"
                          min="1"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="valuation-threshold">Cambio en valoración (%)</Label>
                        <Input
                          id="valuation-threshold"
                          type="number"
                          defaultValue="15"
                          min="1"
                          max="100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="review-days">Días para revisión</Label>
                        <Input
                          id="review-days"
                          type="number"
                          defaultValue="30"
                          min="1"
                          max="365"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button>
                    Guardar Configuración
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AlertSystem;