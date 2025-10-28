import { Navigate, Outlet } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { Card } from '@/components/ui/card';

/**
 * AdminRoute - Protección de rutas administrativas
 * 
 * ⚠️ IMPORTANTE: Esta es una validación de UI solamente
 * La seguridad real está garantizada por:
 * 
 * 1. Row Level Security (RLS) en Supabase
 *    - Todas las tablas críticas tienen políticas RLS
 *    - Los usuarios no pueden acceder a datos de otros usuarios
 * 
 * 2. Funciones SECURITY DEFINER
 *    - has_role_secure() valida roles en el servidor
 *    - Todas las operaciones administrativas validan permisos
 * 
 * 3. Edge Functions protegidas
 *    - validateUserRole() en todas las funciones admin
 * 
 * Esta validación frontend solo mejora UX mostrando mensajes
 * apropiados cuando un usuario no tiene permisos.
 * 
 * Un atacante que bypasee este componente verá páginas vacías
 * porque RLS bloqueará todas las queries en la base de datos.
 */
export const AdminRoute = () => {
  const { isAdmin, isGlobalAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 w-full max-w-md px-6">
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !isGlobalAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a esta sección. Esta área está restringida a administradores.
          </p>
        </Card>
      </div>
    );
  }

  return <Outlet />;
};
