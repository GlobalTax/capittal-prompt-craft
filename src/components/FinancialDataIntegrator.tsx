import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, TrendingUp, Database, Activity, CheckCircle, AlertCircle } from 'lucide-react';

interface MarketData {
  sector: string;
  peRatio: number;
  evEbitda: number;
  priceToSales: number;
  lastUpdated: string;
  trend: 'up' | 'down' | 'stable';
}

interface EconomicIndicator {
  name: string;
  value: number;
  unit: string;
  change: number;
  source: string;
}

const FinancialDataIntegrator = () => {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [economicIndicators, setEconomicIndicators] = useState<EconomicIndicator[]>([]);
  const [syncProgress, setSyncProgress] = useState(0);

  // Simulated data providers
  const dataProviders = [
    { id: 'bloomberg', name: 'Bloomberg API', status: 'available' },
    { id: 'reuters', name: 'Reuters Eikon', status: 'available' },
    { id: 'yahoo', name: 'Yahoo Finance', status: 'available' },
    { id: 'alpha', name: 'Alpha Vantage', status: 'available' },
  ];

  // Simulated market data
  const simulatedMarketData: MarketData[] = [
    { sector: 'Tecnología', peRatio: 28.5, evEbitda: 18.2, priceToSales: 6.8, lastUpdated: '2024-01-15 09:30', trend: 'up' },
    { sector: 'Salud', peRatio: 22.3, evEbitda: 14.7, priceToSales: 4.2, lastUpdated: '2024-01-15 09:30', trend: 'stable' },
    { sector: 'Financiero', peRatio: 12.8, evEbitda: 8.9, priceToSales: 2.1, lastUpdated: '2024-01-15 09:30', trend: 'down' },
    { sector: 'Industrial', peRatio: 16.4, evEbitda: 11.3, priceToSales: 1.8, lastUpdated: '2024-01-15 09:30', trend: 'up' },
    { sector: 'Consumo', peRatio: 19.7, evEbitda: 13.2, priceToSales: 2.9, lastUpdated: '2024-01-15 09:30', trend: 'stable' },
  ];

  const simulatedEconomicData: EconomicIndicator[] = [
    { name: 'Tasa Libre de Riesgo', value: 4.25, unit: '%', change: 0.15, source: 'Banco Central' },
    { name: 'Prima de Riesgo de Mercado', value: 6.8, unit: '%', change: -0.05, source: 'Mercado' },
    { name: 'Inflación Esperada', value: 3.2, unit: '%', change: 0.1, source: 'INE' },
    { name: 'PIB Growth Rate', value: 2.8, unit: '%', change: 0.3, source: 'Ministerio' },
  ];

  const handleConnect = async () => {
    if (!selectedProvider) {
      toast({
        title: "Error",
        description: "Selecciona un proveedor de datos",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setSyncProgress(0);

    // Simulate connection process
    const steps = [
      { message: "Conectando con API...", progress: 25 },
      { message: "Autenticando credenciales...", progress: 50 },
      { message: "Sincronizando datos de mercado...", progress: 75 },
      { message: "Completando configuración...", progress: 100 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSyncProgress(step.progress);
    }

    // Simulate successful connection
    setConnectionStatus('connected');
    setMarketData(simulatedMarketData);
    setEconomicIndicators(simulatedEconomicData);
    setIsConnecting(false);

    toast({
      title: "Conexión exitosa",
      description: `Conectado a ${dataProviders.find(p => p.id === selectedProvider)?.name}`,
    });
  };

  const handleRefreshData = async () => {
    setIsConnecting(true);
    setSyncProgress(0);

    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncProgress(100);
    
    // Update timestamps
    const updatedData = marketData.map(data => ({
      ...data,
      lastUpdated: new Date().toLocaleString('es-ES'),
    }));
    setMarketData(updatedData);
    setIsConnecting(false);

    toast({
      title: "Datos actualizados",
      description: "Múltiplos de mercado sincronizados exitosamente",
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Database className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon()}
                Integrador de Datos Financieros
              </CardTitle>
              <CardDescription>
                Conecta con APIs financieras para obtener múltiplos de mercado actualizados
              </CardDescription>
            </div>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="connection" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="connection">Conexión</TabsTrigger>
              <TabsTrigger value="market-data">Datos de Mercado</TabsTrigger>
              <TabsTrigger value="economic">Indicadores Económicos</TabsTrigger>
            </TabsList>

            <TabsContent value="connection" className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Proveedor de Datos</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataProviders.map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {connectionStatus === 'disconnected' && (
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="apiKey">API Key</Label>
                      <Input
                        id="apiKey"
                        type="password"
                        placeholder="Ingresa tu API key"
                      />
                    </div>
                    <Button 
                      onClick={handleConnect}
                      disabled={isConnecting || !selectedProvider}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Conectando...
                        </>
                      ) : (
                        'Conectar'
                      )}
                    </Button>
                  </div>
                )}

                {isConnecting && (
                  <div className="space-y-2">
                    <Progress value={syncProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Sincronizando datos... {syncProgress}%
                    </p>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRefreshData}
                      disabled={isConnecting}
                      variant="outline"
                      className="flex-1"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar Datos
                    </Button>
                    <Button 
                      onClick={() => setConnectionStatus('disconnected')}
                      variant="destructive"
                      className="flex-1"
                    >
                      Desconectar
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="market-data" className="space-y-4">
              {connectionStatus === 'connected' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Múltiplos por Sector</h3>
                    <Button size="sm" onClick={handleRefreshData} disabled={isConnecting}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Actualizar
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {marketData.map((data, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{data.sector}</h4>
                            <div className="flex items-center gap-2">
                              {getTrendIcon(data.trend)}
                              <span className="text-xs text-muted-foreground">
                                {data.lastUpdated}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">P/E Ratio</p>
                              <p className="font-semibold">{data.peRatio}x</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">EV/EBITDA</p>
                              <p className="font-semibold">{data.evEbitda}x</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">P/S Ratio</p>
                              <p className="font-semibold">{data.priceToSales}x</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Conecta con un proveedor de datos para ver múltiplos de mercado
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="economic" className="space-y-4">
              {connectionStatus === 'connected' ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Indicadores Económicos</h3>
                  <div className="grid gap-4">
                    {economicIndicators.map((indicator, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{indicator.name}</h4>
                              <p className="text-sm text-muted-foreground">{indicator.source}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">
                                {indicator.value}{indicator.unit}
                              </p>
                              <p className={`text-sm ${indicator.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {indicator.change >= 0 ? '+' : ''}{indicator.change}{indicator.unit}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Conecta con un proveedor de datos para ver indicadores económicos
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDataIntegrator;