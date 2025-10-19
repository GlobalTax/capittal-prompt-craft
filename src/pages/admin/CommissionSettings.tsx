import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Euro, Plus, Check, X, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface CommissionRule {
  id: string;
  name: string;
  description: string;
  source_type: string;
  commission_percentage: number;
  base_commission: number;
  min_amount: number | null;
  max_amount: number | null;
  is_active: boolean;
}

interface PendingCommission {
  id: string;
  lead_id: string;
  company_name: string;
  annual_revenue: number;
  estimated_commission: number;
  status: string;
  created_at: string;
  advisor_email: string;
}

export default function CommissionSettings() {
  const [rules, setRules] = useState<CommissionRule[]>([]);
  const [pendingCommissions, setPendingCommissions] = useState<PendingCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    source_type: 'deal',
    commission_percentage: 5,
    base_commission: 0,
  });

  useEffect(() => {
    fetchRules();
    fetchPendingCommissions();
  }, []);

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('commission_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      toast({
        title: 'Error al cargar reglas',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('sell_business_leads')
        .select(`
          id,
          company_name,
          annual_revenue,
          estimated_commission,
          status,
          created_at,
          advisor_user_id
        `)
        .eq('status', 'won')
        .not('estimated_commission', 'is', null);

      if (error) throw error;

      // Obtener emails de asesores
      const advisorIds = data?.map(d => d.advisor_user_id).filter(Boolean) || [];
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', advisorIds);

      const enrichedData = data?.map(lead => {
        const profile = profiles?.find(p => p.id === lead.advisor_user_id);
        const fullName = profile ? `${profile.first_name} ${profile.last_name}` : 'Usuario';
        
        return {
          ...lead,
          lead_id: lead.id,
          advisor_email: fullName,
        };
      });

      setPendingCommissions(enrichedData || []);
    } catch (error: any) {
      console.error('Error fetching commissions:', error);
    }
  };

  const createRule = async () => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .insert([newRule]);

      if (error) throw error;

      toast({
        title: 'Regla creada',
        description: 'La regla de comisión se ha creado correctamente',
      });

      setDialogOpen(false);
      setNewRule({
        name: '',
        description: '',
        source_type: 'deal',
        commission_percentage: 5,
        base_commission: 0,
      });
      fetchRules();
    } catch (error: any) {
      toast({
        title: 'Error al crear regla',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('commission_rules')
        .update({ is_active: !currentStatus })
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: currentStatus ? 'Regla desactivada' : 'Regla activada',
      });

      fetchRules();
    } catch (error: any) {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const markAsPaid = async (leadId: string) => {
    try {
      // Aquí podrías crear un registro en commission_payments
      // Por ahora solo actualizamos el estado del lead
      const { error } = await supabase
        .from('sell_business_leads')
        .update({ commission_paid: true })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: 'Comisión marcada como pagada',
      });

      fetchPendingCommissions();
    } catch (error: any) {
      toast({
        title: 'Error al marcar como pagada',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalPending = pendingCommissions.reduce((sum, c) => sum + (c.estimated_commission || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuración de Comisiones</h1>
          <p className="text-muted-foreground">Gestiona reglas y pagos de comisiones</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Regla
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Regla de Comisión</DialogTitle>
              <DialogDescription>Define una nueva regla de comisión</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Ej: Comisión estándar venta empresas"
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="Descripción opcional"
                />
              </div>
              <div>
                <Label>Tipo de origen</Label>
                <Select value={newRule.source_type} onValueChange={(val) => setNewRule({ ...newRule, source_type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deal">Deal/Venta</SelectItem>
                    <SelectItem value="lead">Lead generado</SelectItem>
                    <SelectItem value="referral">Referido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>% Comisión</Label>
                  <Input
                    type="number"
                    value={newRule.commission_percentage}
                    onChange={(e) => setNewRule({ ...newRule, commission_percentage: parseFloat(e.target.value) })}
                    step="0.1"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label>Comisión base (€)</Label>
                  <Input
                    type="number"
                    value={newRule.base_commission}
                    onChange={(e) => setNewRule({ ...newRule, base_commission: parseFloat(e.target.value) })}
                    step="100"
                    min="0"
                  />
                </div>
              </div>
              <Button onClick={createRule} className="w-full">Crear Regla</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Resumen de comisiones pendientes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5 text-warning" />
            Comisiones Pendientes de Pago
          </CardTitle>
          <CardDescription>Deals cerrados con comisión por pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="text-3xl font-bold text-warning">{totalPending.toLocaleString()}€</div>
            <p className="text-sm text-muted-foreground">{pendingCommissions.length} comisiones pendientes</p>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Asesor</TableHead>
                  <TableHead className="text-right">Facturación</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead>Fecha Cierre</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCommissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay comisiones pendientes
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingCommissions.map(commission => (
                    <TableRow key={commission.id}>
                      <TableCell className="font-medium">{commission.company_name}</TableCell>
                      <TableCell>{commission.advisor_email}</TableCell>
                      <TableCell className="text-right">{commission.annual_revenue?.toLocaleString()}€</TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {commission.estimated_commission?.toLocaleString()}€
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDistanceToNow(new Date(commission.created_at), { addSuffix: true, locale: es })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsPaid(commission.lead_id)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Marcar Pagada
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reglas de comisión */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Comisión</CardTitle>
          <CardDescription>Gestiona las reglas de cálculo de comisiones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <p>Cargando...</p>
            ) : rules.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No hay reglas configuradas. Crea tu primera regla.
              </p>
            ) : (
              rules.map(rule => (
                <div key={rule.id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{rule.name}</h3>
                      <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                        {rule.is_active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      <span>Tipo: <strong>{rule.source_type}</strong></span>
                      <span>Comisión: <strong>{rule.commission_percentage}%</strong></span>
                      {rule.base_commission > 0 && (
                        <span>Base: <strong>{rule.base_commission}€</strong></span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleRuleStatus(rule.id, rule.is_active)}
                  >
                    {rule.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
