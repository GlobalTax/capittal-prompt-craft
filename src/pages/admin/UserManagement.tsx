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
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Ban
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
  is_suspended?: boolean;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendNotes, setSuspendNotes] = useState("");
  const [newRole, setNewRole] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  const [isEmbedded, setIsEmbedded] = useState(false);

  // Detect iframe/storage blocking on mount
  useState(() => {
    const checkEnvironment = async () => {
      try {
        const embedded = window.self !== window.top;
        setIsEmbedded(embedded);
        
        // Check session availability
        const { data } = await supabase.auth.getSession();
        
        if (embedded && !data.session) {
          setShowStorageWarning(true);
        }
      } catch (error) {
        console.error('Environment check failed:', error);
        setShowStorageWarning(true);
      }
    };
    checkEnvironment();
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

      const [profiles, roles, verifications, suspended] = await Promise.all([
        supabase.from('user_profiles').select('*').in('id', userIds),
        supabase.from('user_roles').select('*').in('user_id', userIds),
        supabase.from('user_verification_status').select('*').in('user_id', userIds),
        supabase.from('suspended_users').select('user_id').in('user_id', userIds)
      ]);

      return authUsersData.users.map((user: any) => {
        const profile = profiles.data?.find(p => p.id === user.id);
        const role = roles.data?.find(r => r.user_id === user.id);
        const verification = verifications.data?.find(v => v.user_id === user.id);
        const isSuspended = suspended.data?.some(s => s.user_id === user.id) || false;

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          role: role?.role || 'user',
          verification_status: verification?.verification_status || 'pending',
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          is_suspended: isSuspended
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
        .upsert({ 
          user_id: userId,
          verification_status: status,
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          verified_at: new Date().toISOString(),
          notes: verificationNotes,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      
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
        body: { email: cleanEmail, role, app_url: window.location.origin }
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
      
      // Extract domain from URL for verification
      const invitationDomain = invitationUrl ? new URL(invitationUrl).origin : '';
      
      // Show different messages based on email status
      if (emailSent) {
        // Email sent successfully with domain verification
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">✅ Invitación enviada correctamente</p>
            <p className="text-xs text-muted-foreground">Dominio: {invitationDomain}</p>
          </div>
        );
        
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
        body: { email: invitation.email, role: invitation.role, app_url: window.location.origin }
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

  // Suspend/Reactivate user mutations
  const suspendUser = useMutation({
    mutationFn: async ({ userId, reason, notes }: { userId: string; reason: string; notes: string }) => {
      const { error } = await supabase
        .from('suspended_users')
        .insert({
          user_id: userId,
          reason,
          notes,
          auto_delete_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 días
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario suspendido correctamente');
      setShowSuspendDialog(false);
      setSuspendReason("");
      setSuspendNotes("");
    },
    onError: () => {
      toast.error('Error al suspender usuario');
    }
  });

  const reactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('suspended_users')
        .delete()
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario reactivado correctamente');
    },
    onError: () => {
      toast.error('Error al reactivar usuario');
    }
  });

  // Verify email manually mutation
  const verifyEmailManually = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc('verify_user_email_manually', {
        p_user_id: userId
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Email verificado manualmente');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Error al verificar email');
    }
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      // Check if in iframe and no session
      const { data: sessionData } = await supabase.auth.getSession();
      const embedded = window.self !== window.top;
      
      if (embedded && !sessionData.session) {
        // Open in new tab if embedded without session
        window.open(window.location.href, '_blank');
        throw new Error('Sesión no disponible. Por favor, completa la acción en la nueva pestaña.');
      }

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId }
      });
      
      // Handle specific error status codes
      if (error) {
        const errorMsg = error.message || '';
        const statusCode = error.context?.status || error.status;
        
        // 403 - Session/authorization issues (iframe)
        if (statusCode === 403 || errorMsg.includes('403') || errorMsg.includes('No autorizado')) {
          window.open(window.location.href, '_blank');
          throw new Error('Sesión no disponible en vista embebida. Abre en nueva pestaña.');
        }
        
        // 429 - Rate limit
        if (statusCode === 429 || errorMsg.includes('429') || errorMsg.includes('Demasiados intentos')) {
          throw new Error('Demasiados intentos de eliminación. Intenta de nuevo en 1 hora.');
        }
        
        // 500 - Server error
        if (statusCode === 500 || errorMsg.includes('500')) {
          throw new Error('Error del servidor al eliminar usuario. Se registró el incidente.');
        }
        
        throw error;
      }
      
      if (data?.error) {
        // Check for specific error messages
        if (data.error.includes('hora') || data.error.includes('Demasiados')) {
          throw new Error(data.error);
        }
        throw new Error(data.error);
      }
      
      return data;
    },
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Usuario eliminado correctamente');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      setDeleteConfirmed(false);
    },
    onError: (error: any) => {
      console.error('Delete user error:', error);
      const errorMessage = error.message || 'Error al eliminar usuario';
      toast.error(errorMessage, { duration: 5000 });
    }
  });

  const copyInvitationLink = (token: string) => {
    const baseUrl = window.location.origin;
    const invitationUrl = `${baseUrl}/invite?token=${token}`;
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
        <Button onClick={exportToCSV} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
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
                <TableHead>Email Verificado</TableHead>
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
                  <TableCell colSpan={8} className="text-center py-8">
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
                      <div className="flex items-center gap-2">
                        {user.email_confirmed_at ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <span className="text-sm text-green-600 dark:text-green-400">Verificado</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-sm text-amber-600 dark:text-amber-400">Pendiente</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => verifyEmailManually.mutate(user.id)}
                              disabled={verifyEmailManually.isPending}
                              title="Verificar manualmente"
                              className="h-6 px-2"
                            >
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        {user.is_suspended && (
                          <Badge variant="destructive" className="gap-1">
                            <Ban className="h-3 w-3" />
                            Suspendido
                          </Badge>
                        )}
                      </div>
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
                        {user.is_suspended ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reactivateUser.mutate(user.id)}
                            disabled={reactivateUser.isPending}
                            title="Reactivar usuario"
                          >
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowSuspendDialog(true);
                            }}
                            title="Suspender usuario"
                          >
                            <Ban className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              const { data: { user: currentUser } } = await supabase.auth.getUser();
                              if (currentUser?.id === user.id) {
                                toast.error('No puedes eliminarte a ti mismo');
                                return;
                              }
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                            title="Eliminar usuario"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => {
        setShowDeleteDialog(open);
        if (!open) {
          setDeleteConfirmed(false);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Eliminar Usuario
            </DialogTitle>
            <DialogDescription>
              Esta acción es <strong className="text-destructive">irreversible</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Embedded view warning */}
            {isEmbedded && (
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Vista embebida detectada
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                      Para eliminar usuarios, abre la aplicación en una nueva pestaña con tu sesión activa.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => window.open(window.location.href, '_blank')}
                    >
                      Abrir en nueva pestaña
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
              <p className="text-sm font-medium mb-2">Vas a eliminar a:</p>
              <div className="space-y-1">
                <p className="text-sm">
                  <strong>Nombre:</strong> {selectedUser?.first_name || selectedUser?.last_name 
                    ? `${selectedUser?.first_name || ''} ${selectedUser?.last_name || ''}`.trim()
                    : 'Sin nombre'}
                </p>
                <p className="text-sm">
                  <strong>Email:</strong> {selectedUser?.email}
                </p>
                <p className="text-sm">
                  <strong>Rol:</strong> <Badge variant={getRoleBadgeVariant(selectedUser?.role || 'user')}>
                    {selectedUser?.role}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>⚠️ Advertencia:</strong> Se eliminarán todos los datos asociados a este usuario:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 space-y-1 list-disc list-inside">
                <li>Perfil de usuario</li>
                <li>Roles y permisos</li>
                <li>Registros de actividad</li>
                <li>Datos relacionados en cascada</li>
              </ul>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <input
                type="checkbox"
                id="delete-confirm"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-1"
                disabled={isEmbedded}
              />
              <label htmlFor="delete-confirm" className="text-sm cursor-pointer select-none">
                Entiendo que esta acción es <strong>irreversible</strong> y todos los datos del usuario serán eliminados permanentemente
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteDialog(false);
                setDeleteConfirmed(false);
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedUser && deleteUser.mutate(selectedUser.id)}
              disabled={!deleteConfirmed || deleteUser.isPending || isEmbedded}
              title={isEmbedded ? 'Abre en nueva pestaña para eliminar' : ''}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteUser.isPending ? 'Eliminando...' : isEmbedded ? 'No disponible en vista embebida' : 'Eliminar Usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Ban className="h-5 w-5" />
              Suspender Usuario
            </DialogTitle>
            <DialogDescription>
              Suspender temporalmente a {selectedUser?.email}. Esta acción es reversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-900 dark:text-amber-100">
                <strong>Nota:</strong> El usuario no podrá iniciar sesión mientras esté suspendido. 
                Los datos se mantendrán intactos y se podrá reactivar en cualquier momento.
              </p>
            </div>
            <div>
              <Label>Razón de suspensión *</Label>
              <Input
                placeholder="Ej: Incumplimiento de términos de servicio"
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
            <div>
              <Label>Notas adicionales (opcional)</Label>
              <Textarea
                placeholder="Información adicional sobre la suspensión..."
                value={suspendNotes}
                onChange={(e) => setSuspendNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              El usuario será eliminado automáticamente después de 90 días si no se reactiva.
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowSuspendDialog(false);
                setSuspendReason("");
                setSuspendNotes("");
              }}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedUser && suspendUser.mutate({ 
                userId: selectedUser.id, 
                reason: suspendReason,
                notes: suspendNotes
              })}
              disabled={!suspendReason || suspendUser.isPending}
            >
              <Ban className="h-4 w-4 mr-2" />
              {suspendUser.isPending ? 'Suspendiendo...' : 'Suspender Usuario'}
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
