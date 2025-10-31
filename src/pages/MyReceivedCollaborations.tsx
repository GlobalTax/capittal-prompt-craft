import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Inbox, Clock, CheckCircle2, XCircle, Euro, Building2, Calendar, User, ExternalLink, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDateLocale } from '@/i18n/config';
import { useReceivedCollaborations } from '@/hooks/useReceivedCollaborations';
import { useTranslation } from 'react-i18next';

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

export default function MyReceivedCollaborations() {
  const { t } = useTranslation();
  const { requests, loading, acceptRequest, rejectRequest } = useReceivedCollaborations();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const totalEstimatedCommission = pendingRequests
    .reduce((sum, r) => sum + (r.estimated_commission || 0), 0);

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    if (actionType === 'accept') {
      await acceptRequest(selectedRequest.id, responseMessage);
    } else {
      await rejectRequest(selectedRequest.id, responseMessage);
    }

    setSelectedRequest(null);
    setActionType(null);
    setResponseMessage('');
  };

  const openActionDialog = (request: any, type: 'accept' | 'reject') => {
    setSelectedRequest(request);
    setActionType(type);
    setResponseMessage('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('receivedCollaborations.title')}</h1>
          <p className="text-muted-foreground">{t('receivedCollaborations.subtitle')}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              {t('receivedCollaborations.totalReceived')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              {t('receivedCollaborations.pending')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">{t('receivedCollaborations.awaitingResponse')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {t('receivedCollaborations.accepted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{acceptedRequests.length}</div>
            <p className="text-xs text-muted-foreground">{t('receivedCollaborations.activeCollaborations')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-success" />
              {t('receivedCollaborations.estimatedEarnings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{totalEstimatedCommission.toLocaleString()}€</div>
            <p className="text-xs text-muted-foreground">{t('receivedCollaborations.ifAcceptAll')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de solicitudes recibidas */}
      <Card>
        <CardHeader>
          <CardTitle>{t('receivedCollaborations.received')}</CardTitle>
          <CardDescription>{t('receivedCollaborations.receivedDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>{t('common.loading')}</p>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <Inbox className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">{t('receivedCollaborations.empty')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('receivedCollaborations.advisor')}</TableHead>
                    <TableHead>{t('collaboration.company')}</TableHead>
                    <TableHead>{t('collaboration.type')}</TableHead>
                    <TableHead>{t('collaboration.status')}</TableHead>
                    <TableHead>{t('collaboration.estimatedCommissionShort')}</TableHead>
                    <TableHead>{t('collaboration.date')}</TableHead>
                    <TableHead>{t('collaboration.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(request => {
                    const advisor = request.requesting_advisor;
                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {advisor?.first_name && advisor?.last_name ? (
                                <>
                                  <div className="font-medium">{advisor.first_name} {advisor.last_name}</div>
                                  <div className="text-xs text-muted-foreground">ID: {request.requesting_advisor_id.slice(0, 13)}...</div>
                                </>
                              ) : (
                                <div>ID: {request.requesting_advisor_id.slice(0, 13)}...</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              {request.company_name}
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
                        </TableCell>
                        <TableCell className="text-success font-medium">
                          {request.estimated_commission 
                            ? `${request.estimated_commission.toLocaleString()}€` 
                            : '-'}
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
                          <div className="flex items-center gap-2">
                            {request.status === 'pending' ? (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => openActionDialog(request, 'accept')}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
                                  {t('receivedCollaborations.accept')}
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => openActionDialog(request, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  {t('receivedCollaborations.reject')}
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setActionType(null);
                                }}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
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

      {/* Dialog para aceptar/rechazar */}
      <Dialog 
        open={!!selectedRequest && actionType !== null} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
            setActionType(null);
            setResponseMessage('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Aceptar Colaboración' : 'Rechazar Colaboración'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept' 
                ? 'Confirma que deseas colaborar en esta empresa'
                : 'Indica el motivo por el cual rechazas esta colaboración'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4" />
                  {selectedRequest.company_name}
                </div>
                {selectedRequest.annual_revenue && (
                  <div className="text-sm text-muted-foreground">
                    Facturación: {selectedRequest.annual_revenue.toLocaleString()}€
                  </div>
                )}
                {selectedRequest.estimated_commission && (
                  <div className="text-sm font-medium text-success">
                    Comisión estimada: {selectedRequest.estimated_commission.toLocaleString()}€
                  </div>
                )}
                {selectedRequest.message && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <div className="text-xs font-medium mb-1">Mensaje del asesor:</div>
                    <div className="text-sm">{selectedRequest.message}</div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  {actionType === 'accept' ? 'Mensaje de aceptación (opcional)' : 'Motivo del rechazo'}
                </label>
                <Textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder={actionType === 'accept' 
                    ? 'Añade un mensaje para el asesor solicitante...'
                    : 'Explica brevemente por qué rechazas esta colaboración...'}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null);
                setActionType(null);
                setResponseMessage('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAction}
              variant={actionType === 'accept' ? 'default' : 'destructive'}
            >
              {actionType === 'accept' ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aceptar
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Rechazar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles */}
      <Dialog 
        open={!!selectedRequest && actionType === null} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRequest(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles de Colaboración</DialogTitle>
            <DialogDescription>
              Información completa de la solicitud
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <Building2 className="h-4 w-4" />
                  {selectedRequest.company_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  {selectedRequest.requesting_advisor?.first_name} {selectedRequest.requesting_advisor?.last_name}
                </div>
              </div>

              {selectedRequest.message && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Mensaje:</label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedRequest.message}
                  </div>
                </div>
              )}

              {selectedRequest.response_message && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Tu respuesta:</label>
                  <div className="p-3 bg-muted/50 rounded-md text-sm">
                    {selectedRequest.response_message}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setSelectedRequest(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
