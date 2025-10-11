import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Settings, Database, Users, Bell, Palette, Download, Upload, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdvisorProfileSettings } from "@/components/advisor/AdvisorProfileSettings";

const AdvancedSettings = () => {
  const { toast } = useToast();
  
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [defaultMultiple, setDefaultMultiple] = useState([4.2]);
  const [discountRate, setDiscountRate] = useState([8.5]);

  const sectorMultiples = [
    { sector: "Consultoría", min: 3.5, max: 5.0, default: 4.2 },
    { sector: "Tecnología", min: 4.0, max: 8.0, default: 6.0 },
    { sector: "Marketing", min: 2.8, max: 4.5, default: 3.6 },
    { sector: "Legal", min: 3.0, max: 5.5, default: 4.1 },
    { sector: "Contabilidad", min: 2.5, max: 4.0, default: 3.2 }
  ];

  const userRoles = [
    { id: "1", name: "Ana García", email: "ana@empresa.com", role: "admin", lastActive: "Hoy" },
    { id: "2", name: "Carlos Ruiz", email: "carlos@empresa.com", role: "editor", lastActive: "Ayer" },
    { id: "3", name: "María López", email: "maria@empresa.com", role: "viewer", lastActive: "Hace 3 días" }
  ];

  const integrationSettings = [
    { 
      name: "Zapier", 
      connected: true, 
      description: "Automatización de workflows",
      icon: Zap
    },
    { 
      name: "Google Sheets", 
      connected: false, 
      description: "Sincronización de datos",
      icon: Database
    },
    { 
      name: "Slack", 
      connected: true, 
      description: "Notificaciones en tiempo real",
      icon: Bell
    }
  ];

  const saveSettings = () => {
    toast({
      title: "Configuración guardada",
      description: "Todos los cambios han sido guardados exitosamente.",
    });
  };

  const exportData = () => {
    toast({
      title: "Exportando datos",
      description: "La exportación comenzará en breve...",
    });
  };

  const importData = () => {
    toast({
      title: "Importar datos", 
      description: "Selecciona un archivo para importar...",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración Avanzada</h1>
          <p className="text-muted-foreground">
            Personaliza la plataforma según tus necesidades
          </p>
        </div>
        <Button onClick={saveSettings}>
          <Settings className="h-4 w-4 mr-2" />
          Guardar Todo
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="multiples">Múltiplos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="backup">Backup</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de la Interfaz</CardTitle>
                <CardDescription>
                  Personaliza la apariencia y comportamiento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Modo Oscuro</Label>
                    <div className="text-sm text-muted-foreground">
                      Cambiar entre tema claro y oscuro
                    </div>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notificaciones</Label>
                    <div className="text-sm text-muted-foreground">
                      Recibir alertas y notificaciones
                    </div>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Guardado Automático</Label>
                    <div className="text-sm text-muted-foreground">
                      Guardar cambios automáticamente
                    </div>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Idioma por Defecto</Label>
                  <Select defaultValue="es">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="ca">Català</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Cálculos</CardTitle>
                <CardDescription>
                  Parámetros por defecto para valoraciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="default-multiple">Múltiplo EBITDA por Defecto</Label>
                  <Slider
                    id="default-multiple"
                    min={2}
                    max={8}
                    step={0.1}
                    value={defaultMultiple}
                    onValueChange={setDefaultMultiple}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {defaultMultiple[0]}x
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount-rate">Tasa de Descuento por Defecto (%)</Label>
                  <Slider
                    id="discount-rate"
                    min={5}
                    max={15}
                    step={0.1}
                    value={discountRate}
                    onValueChange={setDiscountRate}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {discountRate[0]}%
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Moneda por Defecto</Label>
                  <Select defaultValue="eur">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eur">Euro (€)</SelectItem>
                      <SelectItem value="usd">Dólar ($)</SelectItem>
                      <SelectItem value="gbp">Libra (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Formato de Fecha</Label>
                  <Select defaultValue="dd-mm-yyyy">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="multiples" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Múltiplos por Sector</CardTitle>
              <CardDescription>
                Configurar rangos de múltiplos específicos por industria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectorMultiples.map((sector, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 items-center">
                    <Label className="font-medium">{sector.sector}</Label>
                    <div className="space-y-1">
                      <Label className="text-xs">Mínimo</Label>
                      <Input type="number" defaultValue={sector.min} step="0.1" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Máximo</Label>
                      <Input type="number" defaultValue={sector.max} step="0.1" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Por Defecto</Label>
                      <Input type="number" defaultValue={sector.default} step="0.1" />
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex space-x-2">
                <Button variant="outline">Añadir Sector</Button>
                <Button variant="outline">Restaurar Valores</Button>
                <Button>Guardar Múltiplos</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>
                  Administrar accesos y permisos del equipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userRoles.map(user => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <p className="text-xs text-muted-foreground">Último acceso: {user.lastActive}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Select defaultValue={user.role}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invitar Usuario</CardTitle>
                <CardDescription>
                  Añadir nuevo miembro al equipo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="nuevo@usuario.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Solo lectura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Mensaje de bienvenida (opcional)</Label>
                  <Textarea placeholder="Mensaje personalizado..." rows={3} />
                </div>
                <Button className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Enviar Invitación
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integraciones Externas</CardTitle>
              <CardDescription>
                Conectar con herramientas y servicios externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrationSettings.map((integration, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <integration.icon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">{integration.name}</p>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={integration.connected ? 'default' : 'secondary'}>
                        {integration.connected ? 'Conectado' : 'Desconectado'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        {integration.connected ? 'Configurar' : 'Conectar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Backup y Restauración</CardTitle>
                <CardDescription>
                  Gestionar copias de seguridad de datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Backup Automático</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="disabled">Desactivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Último Backup</Label>
                  <p className="text-sm text-muted-foreground">
                    15 de Enero, 2024 - 14:30
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <Shield className="h-4 w-4 mr-2" />
                    Crear Backup
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Restaurar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Importar/Exportar</CardTitle>
                <CardDescription>
                  Migrar datos desde/hacia otras plataformas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Formato de Exportación</Label>
                  <Select defaultValue="json">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={exportData} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                  <Button variant="outline" onClick={importData} className="flex-1">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Los archivos de importación deben estar en formato JSON o CSV válido
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <AdvisorProfileSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSettings;