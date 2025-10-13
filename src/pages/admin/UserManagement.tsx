import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { 
  UserCheck, 
  UserX, 
  Shield, 
  Search, 
  Filter,
  Download,
  Calendar,
  Mail,
  Clock,
  TrendingUp,
  Users,
  UserPlus,
  AlertCircle,
  Copy
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  role: string;
  verification_status: string;
  first_name?: string;
  last_name?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  user_id: string | null;
  accepted_at: string | null;
  token: string;
}

// Componente interno que contiene toda la lógica y hooks
function AdminUsersPanel() {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [newRole, setNewRole] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [showStorageWarning, setShowStorageWarning] = useState(false);

  // Detect iframe/storage blocking
  useState(() => {
    const checkStorage = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const isEmbedded = window.self !== window.top;
        
        if (!data.session && isEmbedded) {
          setShowStorageWarning(true);
        }
      } catch (error) {
        console.error('Storage check failed:', error);
      }
    };
    checkStorage();
  });

  // Fetch pending invitations
  const { data: pendingInvitations, isLoading: isLoadingInvitations } = useQuery({
    queryKey: ['pending-invitations'],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_invitations')
        .select('*')
        .is('used_at', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as PendingInvitation[];
    }
  });

  // Fetch users with all details
  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    enabled: true,
    queryFn: async () => {
      // Llamar a la Edge Function en lugar de auth.admin.listUsers()
      const { data: authUsersData, error: authError } = await supabase.functions.invoke('admin-list-users');
      
      if (authError) {
        // Manejar errores de autenticación/autorización
        if (authError.message?.includes('401') || authError.message?.includes('403')) {
          toast.error('Acceso denegado: No tienes permisos para listar usuarios.');
          return [];
        }
        throw authError;
      }
      if (!authUsersData?.users) throw new Error('No se pudieron obtener usuarios');

      const userIds = authUsersData.users.map((u: any) => u.id);

      const [profiles, roles, verifications] = await Promise.all([
        supabase.from('user_profiles').select('*').in('id', userIds),
        supabase.from('user_roles').select('*').in('user_id', userIds),
        supabase.from('user_verification_status').select('*').in('user_id', userIds)
      ]);

      return authUsersData.users.map((user: any) => {
        const profile = profiles.data?.find(p => p.id === user.id);
        const role = roles.data?.find(r => r.user_id === user.id);
        const verification = verifications.data?.find(v => v.user_id === user.id);

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          role: role?.role || 'user',
          verification_status: verification?.verification_status || 'pending',
          first_name: profile?.first_name,
          last_name: profile?.last_name
        } as UserData;
      });
    }
  });

  // Statistics
  const activeInvitations = pendingInvitations?.filter(inv => 
    inv.expires_at && new Date(inv.expires_at) > new Date()
  ).length || 0;
  
  const stats = {
    total: users?.length || 0,
    pending: users?.filter(u => u.verification_status === 'pending').length || 0,
    approved: users?.filter(u => u.verification_status === 'approved').length || 0,
    admins: users?.filter(u => u.role === 'admin' || u.role === 'superadmin').length || 0,
    invitations: activeInvitations
  };

  // Verify user mutation
  const verifyUser = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const { error } = await supabase
        .from('user_verification_status')
        .update({ 
          verification_status: status,
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
          notes: verificationNotes
        })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario verificado correctamente');
      setShowVerifyDialog(false);
      setVerificationNotes("");
    },
    onError: () => {
      toast.error('Error al verificar usuario');
    }
  });

  // Change role mutation
  const changeRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // Delete existing role
      await supabase.from('user_roles').delete().eq('user_id', userId);
      
      // Insert new role
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: role as any });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Rol actualizado correctamente');
      setShowRoleDialog(false);
      setNewRole("");
    },
    onError: () => {
      toast.error('Error al cambiar rol');
    }
  });

  // Invite user mutation
  const inviteUser = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: string }) => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        throw new Error('Email inválido');
      }
      
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: { email: cleanEmail, role }
      });
      
      if (error) {
        console.error('Error inviting user:', error);
        // Extract detailed error if available
        const errorMsg = error.context?.error || error.message || 'Error al enviar invitación';
        throw new Error(errorMsg);
      }
      
      return data;
    },
    retry: false,
    onSuccess: (data) => {
      const invitationUrl = data?.invitation_url;
      const emailSent = data?.email_sent;
      const emailError = data?.email_error;
      
      // Refresh both users and invitations
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      
      setShowInviteDialog(false);
      setInviteEmail("");
      setInviteRole("user");
      
      // Show different messages based on email status
      if (emailSent) {
        // Email sent successfully
        toast.success('Invitación enviada por email correctamente');
        
        // Also show the link as backup
        if (invitationUrl) {
          toast.info(
            <div className="flex flex-col gap-2">
              <p className="font-semibold">Link de invitación (respaldo)</p>
              <p className="text-xs break-all">{invitationUrl}</p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(invitationUrl);
                  toast.success('Link copiado al portapapeles');
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar link
              </Button>
            </div>,
            { duration: 10000 }
          );
        }
      } else {
        // Email failed - show warning with link
        toast.error(
          <div className="flex flex-col gap-2">
            <p className="font-semibold text-amber-600">⚠️ No se pudo enviar el email</p>
            <p className="text-xs">Comparte este enlace manualmente con el usuario:</p>
            {invitationUrl && (
              <>
                <p className="text-xs break-all bg-muted p-2 rounded">{invitationUrl}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(invitationUrl);
                    toast.success('Link copiado al portapapeles');
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar link
                </Button>
              </>
            )}
            {emailError && (
              <p className="text-xs text-muted-foreground">Error: {emailError}</p>
            )}
          </div>,
          { duration: 15000 }
        );
      }
    },
    onError: (error: any) => {
      const errorMsg = error?.message || 'Error al enviar invitación';
      toast.error(errorMsg, { duration: 5000 });
    }
  });

  // Filtered users
  const filteredUsers = users?.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.verification_status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'superadmin': return 'destructive';
      case 'admin': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Resend invitation mutation
  const resendInvitation = useMutation({
    mutationFn: async (invitation: PendingInvitation) => {
      const { data, error } = await supabase.functions.invoke('send-user-invitation', {
        body: { email: invitation.email, role: invitation.role }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitación reenviada correctamente');
    },
    onError: () => {
      toast.error('Error al reenviar invitación');
    }
  });

  // Cancel invitation mutation
  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('pending_invitations')
        .delete()
        .eq('id', invitationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-invitations'] });
      toast.success('Invitación cancelada');
    },
    onError: () => {
      toast.error('Error al cancelar invitación');
    }
  });

  const copyInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const invitationUrl = `${baseUrl}/register?invitation=${token}`;
    navigator.clipboard.writeText(invitationUrl);
    toast.success('Link de invitación copiado');
  };

  const isInvitationExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const exportToCSV = () => {
    if (!filteredUsers) return;
    
    const headers = ['Email', 'Nombre', 'Rol', 'Estado', 'Registro', 'Último acceso'];
    const rows = filteredUsers.map(u => [
      u.email,
      `${u.first_name || ''} ${u.last_name || ''}`.trim(),
      u.role,
      u.verification_status,
      formatDate(u.created_at),
      formatDate(u.last_sign_in_at)
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Exportado correctamente');
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      {/* Storage Warning Banner */}
      {showStorageWarning && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Vista embebida detectada
                </h3>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Tu navegador bloquea el almacenamiento en esta vista. Abre la app en una nueva pestaña para continuar.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  Abrir en nueva pestaña
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowStorageWarning(false)}
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administrar permisos, verificaciones y accesos</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowInviteDialog(true)} 
            className="gap-2"
            disabled={!isSuperAdmin}
            title={!isSuperAdmin ? 'Solo superadministradores pueden invitar usuarios' : ''}
          >
            <UserPlus className="h-4 w-4" />
            Invitar Usuario
          </Button>
          <Button onClick={exportToCSV} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Registrados en total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Invitaciones</CardTitle>
            <Mail className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.invitations}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes de aceptar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Esperando verificación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Verificados</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Usuarios activos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground mt-1">Con permisos elevados</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="superadmin">Superadministrador</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios ({filteredUsers?.length || 0})</CardTitle>
          <CardDescription>
            Gestiona los usuarios registrados en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name || user.last_name 
                        ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                        : 'Sin nombre'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(user.verification_status)}>
                        {user.verification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(user.last_sign_in_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {user.verification_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowVerifyDialog(true);
                            }}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowRoleDialog(true);
                          }}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pending Invitations Table */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Invitaciones Pendientes ({pendingInvitations?.length || 0})</CardTitle>
            <CardDescription>
              Gestiona las invitaciones enviadas que aún no han sido aceptadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Fecha de invitación</TableHead>
                  <TableHead>Expira</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingInvitations ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Cargando invitaciones...
                    </TableCell>
                  </TableRow>
                ) : pendingInvitations && pendingInvitations.length > 0 ? (
                  pendingInvitations.map((invitation) => {
                    const isExpired = isInvitationExpired(invitation.expires_at);
                    return (
                      <TableRow key={invitation.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {invitation.email}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(invitation.role)}>
                            {invitation.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(invitation.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDate(invitation.expires_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isExpired ? (
                            <Badge variant="destructive">Expirada</Badge>
                          ) : invitation.accepted_at ? (
                            <Badge variant="default">Aceptada</Badge>
                          ) : (
                            <Badge variant="secondary">Pendiente</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyInvitationLink(invitation.token)}
                              title="Copiar link de invitación"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            {!isExpired && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => resendInvitation.mutate(invitation)}
                                disabled={resendInvitation.isPending}
                                title="Reenviar invitación"
                              >
                                <Mail className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm('¿Estás seguro de cancelar esta invitación?')) {
                                  cancelInvitation.mutate(invitation.id);
                                }
                              }}
                              disabled={cancelInvitation.isPending}
                              title="Cancelar invitación"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No hay invitaciones pendientes
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Verify Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verificar Usuario</DialogTitle>
            <DialogDescription>
              ¿Deseas verificar a {selectedUser?.email}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Notas (opcional)</Label>
              <Textarea
                placeholder="Notas sobre la verificación..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && verifyUser.mutate({ 
                userId: selectedUser.id, 
                status: 'approved' 
              })}
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
            <DialogDescription>
              Cambiar permisos de {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nuevo Rol</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="advisor">Asesor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem 
                    value="superadmin" 
                    disabled={!isSuperAdmin}
                  >
                    Superadministrador {!isSuperAdmin && '(Solo superadmin)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => selectedUser && changeRole.mutate({ 
                userId: selectedUser.id, 
                role: newRole 
              })}
              disabled={newRole === 'superadmin' && !isSuperAdmin}
            >
              <Shield className="h-4 w-4 mr-2" />
              Cambiar Rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Envía una invitación por email para que se registre en la plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="usuario@ejemplo.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <Label>Rol Inicial</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="advisor">Asesor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem 
                    value="superadmin"
                    disabled={!isSuperAdmin}
                  >
                    Superadministrador {!isSuperAdmin && '(Solo superadmin)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => inviteUser.mutate({ 
                email: inviteEmail, 
                role: inviteRole 
              })}
              disabled={!inviteEmail || inviteUser.isPending || (inviteRole === 'superadmin' && !isSuperAdmin)}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Enviar Invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente principal con manejo de permisos
export default function AdminUsersPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Verificando permisos...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No tienes permisos para acceder a esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminUsersPanel />;
}
