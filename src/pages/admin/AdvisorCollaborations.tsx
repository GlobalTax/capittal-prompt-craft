import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Handshake, Users, TrendingUp, Euro, Building2, Calendar, User, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/i18n/config';
import { useTranslation } from 'react-i18next';

// Helper para detectar comisiones sospechosas
const isSuspiciousCommission = (request: any) => {
  if (!request.estimated_commission || !request.annual_revenue) return false;
  
  const commissionPercentage = (request.estimated_commission / request.annual_revenue) * 100;
  
  // Alertar si comisión es > 20% de facturación anual (poco realista)
  return commissionPercentage > 20;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  accepted: 'bg-green-500/10 text-green-700 dark:text-green-400',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-400',
  expired: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
};

const collaborationTypeLabels: Record<string, string> = {
  referral: 'Referido',
  co_working: 'Co-trabajo',
  expertise_needed: 'Experiencia Requerida',
};

export default function AdvisorCollaborations() {
  const { t } = useTranslation();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: collaborations, isLoading } = useQuery({
    queryKey: ['admin-collaborations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_collaboration_requests')
        .select(`
          *,
          requesting_advisor:user_profiles!requesting_advisor_id(id, email, first_name, last_name, company),
          target_advisor:user_profiles!target_advisor_id(id, email, first_name, last_name, company)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredCollaborations = collaborations?.filter(c => 
    statusFilter === 'all' || c.status === statusFilter
  ) || [];

  const totalRequests = collaborations?.length || 0;
  const pendingRequests = collaborations?.filter(c => c.status === 'pending').length || 0;
  const acceptedRequests = collaborations?.filter(c => c.status === 'accepted').length || 0;
  const rejectedRequests = collaborations?.filter(c => c.status === 'rejected').length || 0;
  const acceptanceRate = totalRequests > 0 
    ? ((acceptedRequests / (acceptedRequests + rejectedRequests)) * 100).toFixed(1) 
    : '0';
  const totalCommissions = collaborations
    ?.filter(c => c.status === 'accepted')
    .reduce((sum, c) => sum + (c.estimated_commission || 0), 0) || 0;

  const oldPendingRequests = collaborations?.filter(c => {
    if (c.status !== 'pending') return false;
    const daysDiff = Math.floor((Date.now() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff > 7;
  }).length || 0;

  // Query para obtener top asesores
  const { data: topAdvisors } = useQuery({
    queryKey: ['admin-top-advisors'],
    queryFn: async () => {
      const { data } = await supabase
        .from('advisor_collaboration_requests')
        .select('requesting_advisor_id')
        .eq('status', 'accepted');

      if (!data) return [];

      // Contar colaboraciones por asesor
      const counts = data.reduce((acc: any, curr) => {
        const id = curr.requesting_advisor_id;
        if (!acc[id]) {
          acc[id] = {
            id,
            count: 0,
          };
        }
        acc[id].count++;
        return acc;
      }, {});

      // Obtener nombres de los top 5 asesores
      const topIds = Object.values(counts as any)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)
        .map((a: any) => a.id);

      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', topIds);

      return Object.values(counts as any)
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)
        .map((advisor: any) => {
          const profile = profiles?.find((p: any) => p.user_id === advisor.id);
          return {
            ...advisor,
            name: profile ? `${profile.first_name} ${profile.last_name}` : 'Desconocido',
          };
        });
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('adminCollaborations.title')}</h1>
          <p className="text-muted-foreground">{t('adminCollaborations.subtitle')}</p>
        </div>
      </div>

      {/* KPIs Administrativos */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Handshake className="h-4 w-4 text-primary" />
              {t('adminCollaborations.totalRequests')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
            <p className="text-xs text-muted-foreground">Solicitudes totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-600" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            {oldPendingRequests > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {oldPendingRequests} con +7 días
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              {t('adminCollaborations.acceptanceRate')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              {acceptedRequests} aceptadas / {rejectedRequests} rechazadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-success" />
              {t('adminCollaborations.totalCommissions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totalCommissions.toLocaleString()}€
            </div>
            <p className="text-xs text-muted-foreground">En colaboraciones aceptadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              {t('adminCollaborations.expired')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collaborations?.filter(c => c.status === 'expired').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Solicitudes expiradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Advisors */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Top 5 Asesores Más Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topAdvisors?.map((advisor: any, index: number) => (
              <div key={advisor.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{index + 1}</Badge>
                  <span className="font-medium text-sm">{advisor.name}</span>
                </div>
                <Badge className="bg-primary">{advisor.count} aceptadas</Badge>
              </div>
            ))}
            {(!topAdvisors || topAdvisors.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay datos todavía
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Todas las Colaboraciones</CardTitle>
              <CardDescription>Vista completa de solicitudes entre asesores</CardDescription>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="accepted">Aceptadas</SelectItem>
                <SelectItem value="rejected">Rechazadas</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>{t('common.loading')}</p>
          ) : filteredCollaborations.length === 0 ? (
            <div className="text-center py-8">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No hay colaboraciones con este filtro</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Receptor</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Comisión</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollaborations.map((request: any) => {
                    const daysSinceCreation = Math.floor(
                      (Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24)
                    );
                    const isOld = request.status === 'pending' && daysSinceCreation > 7;

                    return (
                      <TableRow key={request.id} className={isOld ? 'bg-yellow-500/5' : ''}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              {request.requesting_advisor?.first_name && request.requesting_advisor?.last_name ? (
                                <>
                                  <div className="font-medium">
                                    {request.requesting_advisor.first_name} {request.requesting_advisor.last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {request.requesting_advisor_id.slice(0, 13)}...
                                  </div>
                                </>
                              ) : (
                                <div>ID: {request.requesting_advisor_id.slice(0, 13)}...</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div className="text-sm">
                              {request.target_advisor?.first_name && request.target_advisor?.last_name ? (
                                <>
                                  <div className="font-medium">
                                    {request.target_advisor.first_name} {request.target_advisor.last_name}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    ID: {request.target_advisor_id.slice(0, 13)}...
                                  </div>
                                </>
                              ) : (
                                <div>ID: {request.target_advisor_id.slice(0, 13)}...</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{request.company_name}</div>
                              {request.company_sector && (
                                <div className="text-xs text-muted-foreground">{request.company_sector}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {collaborationTypeLabels[request.collaboration_type || 'referral']}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[request.status]}>
                            {statusLabels[request.status]}
                          </Badge>
                          {isOld && (
                            <div className="text-xs text-destructive mt-1">+{daysSinceCreation} días</div>
                          )}
                        </TableCell>
                      <TableCell className="text-success font-medium">
                        <div className="flex items-center gap-2">
                          <span>
                            {request.estimated_commission 
                              ? `${request.estimated_commission.toLocaleString()}€` 
                              : '-'}
                          </span>
                          {isSuspiciousCommission(request) && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              Revisar
                            </Badge>
                          )}
                        </div>
                        {request.commission_percentage && (
                          <div className="text-xs text-muted-foreground">
                            {request.commission_percentage}%
                          </div>
                        )}
                      </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDistanceToNow(new Date(request.created_at), { 
                              addSuffix: true, 
                              locale: getDateLocale()
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedRequest(request)}
                          >
                            Ver Detalles
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog 
        open={!!selectedRequest} 
        onOpenChange={(open) => {
          if (!open) setSelectedRequest(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de Colaboración</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-2">SOLICITANTE</div>
                  <div className="font-medium">
                    {selectedRequest.requesting_advisor?.first_name} {selectedRequest.requesting_advisor?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {selectedRequest.requesting_advisor_id.slice(0, 20)}...
                  </div>
                  {selectedRequest.requesting_advisor?.company && (
                    <div className="text-xs text-muted-foreground mt-1">{selectedRequest.requesting_advisor.company}</div>
                  )}
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-xs font-medium text-muted-foreground mb-2">RECEPTOR</div>
                  <div className="font-medium">
                    {selectedRequest.target_advisor?.first_name} {selectedRequest.target_advisor?.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ID: {selectedRequest.target_advisor_id.slice(0, 20)}...
                  </div>
                  {selectedRequest.target_advisor?.company && (
                    <div className="text-xs text-muted-foreground mt-1">{selectedRequest.target_advisor.company}</div>
                  )}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-medium text-lg">
                  <Building2 className="h-5 w-5" />
                  {selectedRequest.company_name}
                </div>
                {selectedRequest.company_sector && (
                  <div className="text-sm text-muted-foreground">Sector: {selectedRequest.company_sector}</div>
                )}
                {selectedRequest.annual_revenue && (
                  <div className="text-sm">Facturación: {selectedRequest.annual_revenue.toLocaleString()}€</div>
                )}
                <div className="flex items-center gap-4 pt-2">
                  <Badge className={statusColors[selectedRequest.status]}>
                    {statusLabels[selectedRequest.status]}
                  </Badge>
                  <Badge variant="outline">
                    {collaborationTypeLabels[selectedRequest.collaboration_type || 'referral']}
                  </Badge>
                </div>
              </div>

              {selectedRequest.estimated_commission && (
                <div className="p-4 bg-success/10 rounded-lg">
                  <div className="text-sm font-medium mb-1">Comisión Estimada</div>
                  <div className="text-2xl font-bold text-success">
                    {selectedRequest.estimated_commission.toLocaleString()}€
                  </div>
                  {selectedRequest.commission_percentage && (
                    <div className="text-sm text-muted-foreground">
                      {selectedRequest.commission_percentage}% del total
                    </div>
                  )}
                </div>
              )}

              {selectedRequest.message && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Mensaje del Solicitante:</label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              {selectedRequest.response_message && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Respuesta del Receptor:</label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedRequest.response_message}
                  </div>
                  {selectedRequest.responded_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Respondido {formatDistanceToNow(new Date(selectedRequest.responded_at), { 
                        addSuffix: true, 
                        locale: getDateLocale()
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-border text-sm text-muted-foreground">
                <div>Creada: {new Date(selectedRequest.created_at).toLocaleString()}</div>
                {selectedRequest.expires_at && (
                  <div>Expira: {new Date(selectedRequest.expires_at).toLocaleString()}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
