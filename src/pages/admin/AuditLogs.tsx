import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Download, Filter, CalendarIcon, ChevronDown, Activity, Trash2, Edit, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AuditLogs() {
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [operation, setOperation] = useState<string>('ALL');
  const [tableName, setTableName] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch audit logs
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['audit-logs', page, dateFrom, dateTo, operation, tableName, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('audit_trail')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
        .range(page * 100, (page + 1) * 100 - 1);

      if (dateFrom) query = query.gte('timestamp', dateFrom.toISOString());
      if (dateTo) query = query.lte('timestamp', dateTo.toISOString());
      if (operation !== 'ALL') query = query.eq('operation', operation);
      if (tableName !== 'ALL') query = query.eq('table_name', tableName);
      if (searchQuery) {
        query = query.or(`user_email.ilike.%${searchQuery}%,table_name.ilike.%${searchQuery}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      return { logs: data, total: count };
    }
  });

  // Fetch quick stats
  const { data: stats } = useQuery({
    queryKey: ['audit-stats', dateFrom, dateTo],
    queryFn: async () => {
      const { data: logs } = await supabase
        .from('audit_trail')
        .select('operation, table_name, user_id')
        .gte('timestamp', dateFrom?.toISOString() || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .lte('timestamp', dateTo?.toISOString() || new Date().toISOString());

      if (!logs) return { total: 0, critical: 0, uniqueUsers: 0, mostModified: '' };

      const criticalOps = logs.filter(log => 
        log.operation === 'DELETE' || 
        ['user_roles', 'commission_settings'].includes(log.table_name)
      ).length;

      const uniqueUsers = new Set(logs.map(log => log.user_id)).size;

      const tableCounts: { [key: string]: number } = {};
      logs.forEach(log => {
        tableCounts[log.table_name] = (tableCounts[log.table_name] || 0) + 1;
      });
      const mostModified = Object.entries(tableCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      return {
        total: logs.length,
        critical: criticalOps,
        uniqueUsers,
        mostModified
      };
    }
  });

  const handleExportCSV = () => {
    if (!auditLogs?.logs) return;

    const headers = ['Timestamp', 'Usuario', 'Email', 'Operación', 'Tabla', 'IP', 'Detalles'];
    const rows = auditLogs.logs.map(log => [
      new Date(log.timestamp).toLocaleString('es-ES'),
      log.user_email || 'Sistema',
      log.user_email || '',
      log.operation,
      log.table_name,
      log.ip_address || '',
      JSON.stringify({ old: log.old_data, new: log.new_data })
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`;
    link.click();
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'INSERT': return <PlusCircle className="h-4 w-4 text-green-500" />;
      case 'UPDATE': return <Edit className="h-4 w-4 text-blue-500" />;
      case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getOperationVariant = (operation: string) => {
    switch (operation) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  const isCriticalOperation = (log: any) => {
    return log.operation === 'DELETE' || 
           ['user_roles', 'commission_settings'].includes(log.table_name);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Logs de Auditoría</h1>
        <p className="text-muted-foreground">
          Trazabilidad completa de operaciones del sistema
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Operaciones</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Operaciones Críticas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats?.critical || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Usuarios Activos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.uniqueUsers || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tabla Más Modificada</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold truncate">{stats?.mostModified || 'N/A'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label>Desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'PP', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label>Hasta</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'PP', { locale: es }) : 'Seleccionar'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Operation Filter */}
            <div className="space-y-2">
              <Label>Operación</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="INSERT">INSERT</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Filter */}
            <div className="space-y-2">
              <Label>Tabla</Label>
              <Select value={tableName} onValueChange={setTableName}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="user_roles">user_roles</SelectItem>
                  <SelectItem value="collaborators">collaborators</SelectItem>
                  <SelectItem value="commissions">commissions</SelectItem>
                  <SelectItem value="sell_business_leads">sell_business_leads</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="space-y-2">
              <Label>Buscar</Label>
              <Input
                placeholder="Email, tabla..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDateFrom(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
                setDateTo(new Date());
                setOperation('ALL');
                setTableName('ALL');
                setSearchQuery('');
              }}
            >
              Limpiar filtros
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
          <CardDescription>
            {auditLogs?.total || 0} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : auditLogs && auditLogs.logs.length > 0 ? (
            <div className="space-y-2">
              {auditLogs.logs.map((log: any) => (
                <Collapsible key={log.id}>
                  <div className={`border rounded-lg p-4 ${isCriticalOperation(log) ? 'border-red-500 bg-red-50 dark:bg-red-950' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {getOperationIcon(log.operation)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={getOperationVariant(log.operation)}>
                              {log.operation}
                            </Badge>
                            <span className="font-medium">{log.table_name}</span>
                            {isCriticalOperation(log) && (
                              <Badge variant="destructive">CRÍTICO</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <span>{log.user_email || 'Sistema'}</span>
                            {log.ip_address && (
                              <span className="ml-3">IP: {log.ip_address}</span>
                            )}
                            <span className="ml-3">
                              {format(new Date(log.timestamp), 'PPpp', { locale: es })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Ver cambios
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Datos Anteriores</Label>
                          <pre className="bg-red-50 dark:bg-red-950 p-3 rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(log.old_data, null, 2) || 'N/A'}
                          </pre>
                        </div>
                        <div className="space-y-2">
                          <Label>Datos Nuevos</Label>
                          <pre className="bg-green-50 dark:bg-green-950 p-3 rounded text-xs overflow-auto max-h-64">
                            {JSON.stringify(log.new_data, null, 2) || 'N/A'}
                          </pre>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No se encontraron registros de auditoría</p>
            </div>
          )}

          {/* Pagination */}
          {auditLogs && auditLogs.total > 100 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {page + 1} de {Math.ceil(auditLogs.total / 100)}
              </span>
              <Button
                variant="outline"
                disabled={(page + 1) * 100 >= auditLogs.total}
                onClick={() => setPage(p => p + 1)}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
