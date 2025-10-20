import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePendingAlerts() {
  return useQuery({
    queryKey: ['pending-alerts'],
    queryFn: async () => {
      const [
        pendingUsers,
        recentCollaborators,
        suspiciousLeads,
        unassignedLeads,
        securityAlerts
      ] = await Promise.all([
        // Usuarios pendientes de verificación
        supabase
          .from('user_verification_status')
          .select('id', { count: 'exact', head: true })
          .eq('verification_status', 'pending'),
        
        // Colaboradores nuevos últimos 7 días
        supabase
          .from('collaborators')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        
        // Leads sospechosos (de security_logs)
        supabase
          .from('security_logs')
          .select('id', { count: 'exact', head: true })
          .in('event_type', ['duplicate_lead_detected', 'high_value_lead_unassigned', 'extremely_high_value_lead'])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        
        // Leads sin asignar
        supabase
          .from('sell_business_leads')
          .select('id', { count: 'exact', head: true })
          .is('advisor_user_id', null),
        
        // Alertas de seguridad críticas (últimas 24h)
        supabase
          .from('security_logs')
          .select('id', { count: 'exact', head: true })
          .in('severity', ['high', 'critical'])
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ]);

      const total = (
        (pendingUsers.count || 0) +
        (recentCollaborators.count || 0) +
        (suspiciousLeads.count || 0) +
        (unassignedLeads.count || 0)
      );

      return {
        pendingUsers: pendingUsers.count || 0,
        recentCollaborators: recentCollaborators.count || 0,
        suspiciousLeads: suspiciousLeads.count || 0,
        unassignedLeads: unassignedLeads.count || 0,
        securityAlerts: securityAlerts.count || 0,
        total
      };
    },
    refetchInterval: 30000, // Auto-refresh cada 30 segundos
  });
}
