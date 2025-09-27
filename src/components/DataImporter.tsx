import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download, Eye } from 'lucide-react';

interface ImportedData {
  id: string;
  company: string;
  revenue: number;
  ebitda: number;
  netIncome: number;
  totalAssets: number;
  debt: number;
  employees?: number;
  sector?: string;
  status: 'valid' | 'warning' | 'error';
  issues?: string[];
}

interface ImportResult {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  data: ImportedData[];
}

const DataImporter = () => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Simulated data for demonstration
  const simulateDataProcessing = async (file: File): Promise<ImportResult> => {
    const simulatedData: ImportedData[] = [
      {
        id: '1',
        company: 'TechCorp S.A.',
        revenue: 50000000,
        ebitda: 12000000,
        netIncome: 8000000,
        totalAssets: 75000000,
        debt: 15000000,
        employees: 250,
        sector: 'Tecnología',
        status: 'valid'
      },
      {
        id: '2',
        company: 'MedSolutions Ltd.',
        revenue: 25000000,
        ebitda: 5000000,
        netIncome: 3000000,
        totalAssets: 40000000,
        debt: 8000000,
        employees: 180,
        sector: 'Salud',
        status: 'warning',
        issues: ['EBITDA margin parece bajo para el sector']
      },
      {
        id: '3',
        company: 'IndustrialCorp',
        revenue: 0, // Error: revenue missing
        ebitda: 15000000,
        netIncome: 10000000,
        totalAssets: 100000000,
        debt: 25000000,
        sector: 'Industrial',
        status: 'error',
        issues: ['Revenue is required', 'Debt/Assets ratio too high']
      },
      {
        id: '4',
        company: 'RetailChain S.L.',
        revenue: 80000000,
        ebitda: 8000000,
        netIncome: 4500000,
        totalAssets: 60000000,
        debt: 12000000,
        employees: 500,
        sector: 'Consumo',
        status: 'valid'
      },
      {
        id: '5',
        company: 'FinanceGroup',
        revenue: 35000000,
        ebitda: 14000000,
        netIncome: 9000000,
        totalAssets: 200000000,
        debt: 50000000,
        sector: 'Financiero',
        status: 'warning',
        issues: ['High leverage for financial sector']
      }
    ];

    const validRows = simulatedData.filter(d => d.status === 'valid').length;
    const warningRows = simulatedData.filter(d => d.status === 'warning').length;
    const errorRows = simulatedData.filter(d => d.status === 'error').length;

    return {
      totalRows: simulatedData.length,
      validRows,
      warningRows,
      errorRows,
      data: simulatedData
    };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Simulate preview generation
      const mockPreview = [
        { A: 'Company', B: 'Revenue', C: 'EBITDA', D: 'Net Income', E: 'Total Assets', F: 'Debt' },
        { A: 'TechCorp S.A.', B: '50000000', C: '12000000', D: '8000000', E: '75000000', F: '15000000' },
        { A: 'MedSolutions Ltd.', B: '25000000', C: '5000000', D: '3000000', E: '40000000', F: '8000000' },
        { A: 'IndustrialCorp', B: '', C: '15000000', D: '10000000', E: '100000000', F: '25000000' },
      ];
      setPreviewData(mockPreview);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Selecciona un archivo para importar",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    // Simulate processing steps
    const steps = [
      { message: "Leyendo archivo...", progress: 20 },
      { message: "Validando estructura...", progress: 40 },
      { message: "Procesando datos...", progress: 60 },
      { message: "Validando reglas de negocio...", progress: 80 },
      { message: "Generando reporte...", progress: 100 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setUploadProgress(step.progress);
    }

    const result = await simulateDataProcessing(selectedFile);
    setImportResult(result);
    setIsProcessing(false);

    toast({
      title: "Importación completada",
      description: `${result.validRows} registros válidos de ${result.totalRows} procesados`,
    });
  };

  const downloadTemplate = () => {
    // Simulate template download
    const csvContent = "Company,Revenue,EBITDA,Net Income,Total Assets,Debt,Employees,Sector\nEjemplo Corp,50000000,12000000,8000000,75000000,15000000,250,Tecnología\n";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_valoracion.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Plantilla descargada",
      description: "Archivo de plantilla guardado exitosamente",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800">Válido</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="secondary">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importador de Datos Financieros
          </CardTitle>
          <CardDescription>
            Importa datos financieros desde archivos Excel o CSV con validación automática
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="import" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="import">Importar</TabsTrigger>
              <TabsTrigger value="preview">Vista Previa</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <div className="grid gap-4">
                <Alert>
                  <Download className="h-4 w-4" />
                  <AlertTitle>Plantilla de Importación</AlertTitle>
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      Descarga nuestra plantilla para asegurar el formato correcto de tus datos
                    </span>
                    <Button size="sm" onClick={downloadTemplate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar Plantilla
                    </Button>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="file-upload">Seleccionar Archivo</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || isProcessing}
                      className="min-w-[120px]"
                    >
                      {isProcessing ? (
                        <>
                          <Upload className="h-4 w-4 mr-2 animate-pulse" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-muted-foreground">
                      Procesando archivo... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Formatos Soportados:</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Excel (.xlsx, .xls)</li>
                      <li>CSV (.csv)</li>
                      <li>Máximo 1000 registros</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Campos Requeridos:</h4>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Nombre de la empresa</li>
                      <li>Ingresos (Revenue)</li>
                      <li>EBITDA</li>
                      <li>Activos totales</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              {selectedFile && previewData.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Vista Previa: {selectedFile.name}</h3>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0] || {}).map((key) => (
                            <TableHead key={key}>{previewData[0][key]}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.slice(1, 6).map((row, index) => (
                          <TableRow key={index}>
                            {Object.values(row).map((value: any, cellIndex) => (
                              <TableCell key={cellIndex}>
                                {value || <span className="text-red-500">Vacío</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mostrando primeras 5 filas. Total: {previewData.length - 1} registros
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Selecciona un archivo para ver la vista previa
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {importResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold">{importResult.totalRows}</p>
                          <p className="text-sm text-muted-foreground">Total</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">{importResult.validRows}</p>
                          <p className="text-sm text-muted-foreground">Válidos</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">{importResult.warningRows}</p>
                          <p className="text-sm text-muted-foreground">Advertencias</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">{importResult.errorRows}</p>
                          <p className="text-sm text-muted-foreground">Errores</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Datos Procesados</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Estado</TableHead>
                            <TableHead>Empresa</TableHead>
                            <TableHead>Ingresos</TableHead>
                            <TableHead>EBITDA</TableHead>
                            <TableHead>Sector</TableHead>
                            <TableHead>Observaciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importResult.data.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{getStatusBadge(row.status)}</TableCell>
                              <TableCell className="font-medium">{row.company}</TableCell>
                              <TableCell>{row.revenue ? formatCurrency(row.revenue) : '-'}</TableCell>
                              <TableCell>{formatCurrency(row.ebitda)}</TableCell>
                              <TableCell>{row.sector || '-'}</TableCell>
                              <TableCell>
                                {row.issues ? (
                                  <div className="space-y-1">
                                    {row.issues.map((issue, index) => (
                                      <div key={index} className="text-sm text-red-600 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        {issue}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <CheckCircle className="h-4 w-4" />
                                    <span className="text-sm">Sin problemas</span>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Importa un archivo para ver los resultados del procesamiento
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

export default DataImporter;