import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BookOpen, TrendingUp, Target, AlertCircle } from "lucide-react";

const FinancialRatiosGuide = () => {
  const enterpriseValueRatios = [
    {
      name: "VE / Ingresos",
      description: "Valor de empresa / Ingresos",
      interpretation: "Múltiplo básico para comparación sectorial"
    },
    {
      name: "VE / EBITDA",
      description: "Valor de empresa / Beneficios antes de intereses, impuestos, depreciaciones y amortizaciones",
      interpretation: "Múltiplo más utilizado en M&A"
    },
    {
      name: "VE / EBIT",
      description: "Valor de empresa / Beneficios antes de intereses e impuestos",
      interpretation: "Considera la depreciación y amortización"
    },
    {
      name: "VE / Capital Invertido",
      description: "Valor de empresa / (Fondos propios + Deuda total)",
      interpretation: "Mide la eficiencia del capital invertido"
    }
  ];

  const equityValueRatios = [
    {
      name: "Ratio PER",
      description: "Precio de la acción / BPA o capitalización bursátil / beneficio neto",
      interpretation: "Múltiplo fundamental de valoración"
    },
    {
      name: "Precio / Ventas",
      description: "Precio de la Acción / Ingresos por Acción o Capitalización Bursátil / Ingresos",
      interpretation: "Útil para empresas con bajos márgenes"
    },
    {
      name: "Precio / Capital Contable",
      description: "Precio / Valor Contable por Acción o Capitalización Bursátil / Capital Ordinario",
      interpretation: "Compara valor de mercado vs. valor contable"
    },
    {
      name: "Ratio PEG",
      description: "(Precio / BPA) / (% Tasa de Crecimiento * 100)",
      interpretation: "Ajusta el PER por crecimiento esperado"
    }
  ];

  const marginGuidance = [
    {
      range: "< 10%",
      status: "Insuficiente",
      color: "destructive",
      description: "El despacho podría no generar suficientes beneficios"
    },
    {
      range: "15% - 20%",
      status: "Mínimo",
      color: "warning",
      description: "El despacho obtiene unos rendimientos mínimos"
    },
    {
      range: "20% - 30%",
      status: "Óptimo",
      color: "success",
      description: "El despacho obtiene unos rendimientos óptimos"
    },
    {
      range: "> 30%",
      status: "Superior",
      color: "success",
      description: "El despacho obtiene unos rendimientos superiores a la media"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <BookOpen className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Guía de Ratios Financieros
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprende los ratios clave para la valoración de empresas de asesoría y consultoría
        </p>
      </div>

      <Tabs defaultValue="enterprise" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="enterprise">Ratios de Valor Empresa</TabsTrigger>
          <TabsTrigger value="equity">Ratios de Valor Patrimonial</TabsTrigger>
          <TabsTrigger value="margins">Análisis de Márgenes</TabsTrigger>
        </TabsList>

        <TabsContent value="enterprise" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ratios de Valor de Empresa
              </CardTitle>
              <CardDescription>
                Ratios que miden el valor en función de los beneficios en relación con los activos de toda la empresa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {enterpriseValueRatios.map((ratio, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-card">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-primary">{ratio.name}</h4>
                      <Badge variant="outline">Enterprise Value</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ratio.description}</p>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-success" />
                      <span className="text-sm">{ratio.interpretation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Ratios de Valor Patrimonial
              </CardTitle>
              <CardDescription>
                Ratios que miden el valor en función de los beneficios en relación con los fondos propios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {equityValueRatios.map((ratio, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-card">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-primary">{ratio.name}</h4>
                      <Badge variant="outline">Equity Value</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{ratio.description}</p>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-success" />
                      <span className="text-sm">{ratio.interpretation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="margins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Análisis de Márgenes Netos
              </CardTitle>
              <CardDescription>
                Interpretación de los márgenes netos para despachos de asesoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {marginGuidance.map((margin, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className={
                            margin.color === 'destructive' ? 'bg-destructive text-destructive-foreground' :
                            margin.color === 'warning' ? 'bg-warning text-warning-foreground' :
                            'bg-success text-success-foreground'
                          }
                        >
                          {margin.range}
                        </Badge>
                        <span className="font-semibold">{margin.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{margin.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-primary-light rounded-lg">
                <h4 className="font-semibold text-primary mb-2">Factores Clave para Asesorías</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Despachos de un millón en adelante suelen valorarse de manera superior</li>
                  <li>• El tipo de servicios y la calidad de los clientes es fundamental</li>
                  <li>• La facturación recurrente incrementa significativamente el valor</li>
                  <li>• La especialización técnica permite múltiplos superiores</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialRatiosGuide;