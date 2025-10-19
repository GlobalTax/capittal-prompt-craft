import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Search, TrendingUp, Users, DollarSign, CheckCircle2, Eye, Mail, Phone } from "lucide-react";
import { trackFunnelEvent } from "@/lib/analytics";

interface Lead {
  id: string;
  company_name: string;
  sector: string;
  annual_revenue: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  message: string;
  status: string;
  advisor_user_id: string | null;
  valuation_id: string | null;
  assigned_to: string | null;
  created_at: string;
  advisor_profile?: {
    first_name: string;
    last_name: string;
  };
}

const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-purple-500",
  negotiating: "bg-orange-500",
  won: "bg-green-500",
  lost: "bg-gray-500",
};

const statusLabels = {
  new: "Nuevo",
  contacted: "Contactado",
  qualified: "Calificado",
  negotiating: "Negociando",
  won: "Ganado",
  lost: "Perdido",
};

export default function SellBusinessLeads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    conversion: 0,
    avgRevenue: 0,
  });

  useEffect(() => {
    fetchLeads();
    fetchUsers();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sell_business_leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch advisor profiles separately
      const leadsWithProfiles = await Promise.all(
        (data || []).map(async (lead) => {
          if (lead.advisor_user_id) {
            const { data: profile } = await supabase
              .from("user_profiles")
              .select("first_name, last_name")
              .eq("id", lead.advisor_user_id)
              .single();
            
            return { ...lead, advisor_profile: profile };
          }
          return lead;
        })
      );

      setLeads(leadsWithProfiles as Lead[]);
      calculateStats(leadsWithProfiles as Lead[]);
    } catch (error: any) {
      toast.error("Error al cargar leads: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    const { data } = await supabase.rpc("get_users_with_roles");
    setUsers(data || []);
  };

  const calculateStats = (leadsData: Lead[]) => {
    const total = leadsData.length;
    const newLeads = leadsData.filter((l) => l.status === "new").length;
    const won = leadsData.filter((l) => l.status === "won").length;
    const conversion = total > 0 ? (won / total) * 100 : 0;
    const avgRevenue =
      leadsData.length > 0
        ? leadsData.reduce((sum, l) => sum + (l.annual_revenue || 0), 0) / leadsData.length
        : 0;

    setStats({ total, new: newLeads, conversion, avgRevenue });
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("sell_business_leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      // Track analytics events
      if (newStatus === "contacted") {
        await trackFunnelEvent("lead_contacted", { leadId });
      } else if (newStatus === "qualified") {
        await trackFunnelEvent("lead_qualified", { leadId });
      } else if (newStatus === "won") {
        await trackFunnelEvent("deal_won", { leadId });
      }

      toast.success("Estado actualizado");
      fetchLeads();
    } catch (error: any) {
      toast.error("Error al actualizar: " + error.message);
    }
  };

  const assignLead = async (leadId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("sell_business_leads")
        .update({ assigned_to: userId })
        .eq("id", leadId);

      if (error) throw error;

      toast.success("Lead asignado");
      fetchLeads();
    } catch (error: any) {
      toast.error("Error al asignar: " + error.message);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.sector.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Leads de Venta</h1>
          <p className="text-muted-foreground">Gestiona las oportunidades de venta generadas</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Nuevos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.new}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Conversión</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversion.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Facturación Promedio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{(stats.avgRevenue / 1000).toFixed(0)}k</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contacto o sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new">Nuevos</SelectItem>
              <SelectItem value="contacted">Contactados</SelectItem>
              <SelectItem value="qualified">Calificados</SelectItem>
              <SelectItem value="negotiating">Negociando</SelectItem>
              <SelectItem value="won">Ganados</SelectItem>
              <SelectItem value="lost">Perdidos</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
          <CardDescription>Haz clic en un lead para ver detalles y gestionar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Facturación</TableHead>
                <TableHead>Asesor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.company_name}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{lead.contact_name}</div>
                      <div className="text-muted-foreground text-xs">{lead.contact_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{lead.sector}</TableCell>
                  <TableCell>€{(lead.annual_revenue / 1000).toFixed(0)}k</TableCell>
                  <TableCell>
                    {lead.advisor_profile
                      ? `${lead.advisor_profile.first_name} ${lead.advisor_profile.last_name}`
                      : "Directo"}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                      {statusLabels[lead.status as keyof typeof statusLabels]}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedLead(lead)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{lead.company_name}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Sector</Label>
                              <p className="text-sm">{lead.sector}</p>
                            </div>
                            <div>
                              <Label>Facturación Estimada</Label>
                              <p className="text-sm">€{lead.annual_revenue.toLocaleString()}</p>
                            </div>
                          </div>

                          <div>
                            <Label>Contacto</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Mail className="h-4 w-4" />
                              <span className="text-sm">{lead.contact_email}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Phone className="h-4 w-4" />
                              <span className="text-sm">{lead.contact_phone}</span>
                            </div>
                          </div>

                          <div>
                            <Label>Mensaje</Label>
                            <p className="text-sm bg-muted p-3 rounded-md mt-1">{lead.message}</p>
                          </div>

                          <div>
                            <Label>Cambiar Estado</Label>
                            <Select
                              value={lead.status}
                              onValueChange={(value) => updateLeadStatus(lead.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusLabels).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Asignar a</Label>
                            <Select
                              value={lead.assigned_to || ""}
                              onValueChange={(value) => assignLead(lead.id, value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar usuario" />
                              </SelectTrigger>
                              <SelectContent>
                                {users.map((user) => (
                                  <SelectItem key={user.user_id} value={user.user_id}>
                                    {user.first_name} {user.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}