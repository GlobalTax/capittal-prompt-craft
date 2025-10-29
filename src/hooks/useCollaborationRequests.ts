import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CollaborationRequest {
  id: string;
  requesting_advisor_id: string;
  target_advisor_id: string;
  lead_id: string | null;
  company_name: string;
  company_sector: string | null;
  annual_revenue: number | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  collaboration_type: 'referral' | 'co_working' | 'expertise_needed' | null;
  collaboration_terms: any;
  message: string | null;
  estimated_commission: number | null;
  commission_percentage: number | null;
  response_message: string | null;
  responded_at: string | null;
  created_at: string;
  expires_at: string | null;
  updated_at: string;
  requesting_advisor?: {
    id: string;
    email: string;
    raw_user_meta_data: {
      first_name?: string;
      last_name?: string;
      company?: string;
    };
  };
  lead?: {
    id: string;
    contact_name: string;
    contact_email: string;
    valuation_id: string | null;
  };
}

export const useCollaborationRequests = () => {
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error } = await supabase
        .from('advisor_collaboration_requests')
        .select('*')
        .eq('target_advisor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map data with basic structure
      const mappedRequests = (data || []).map(request => ({
        ...request,
        requesting_advisor: undefined, // Will be populated by UI from user metadata
        lead: undefined, // Will be populated if needed
      })) as CollaborationRequest[];

      setRequests(mappedRequests);
    } catch (error: any) {
      toast({
        title: 'Error al cargar solicitudes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string, responseMessage?: string) => {
    try {
      const { error } = await supabase
        .from('advisor_collaboration_requests')
        .update({
          status: 'accepted',
          response_message: responseMessage || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Solicitud aceptada',
        description: 'Has aceptado colaborar en esta empresa',
      });

      await fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Error al aceptar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const rejectRequest = async (requestId: string, reason?: string) => {
    try {
      const { error } = await supabase
        .from('advisor_collaboration_requests')
        .update({
          status: 'rejected',
          response_message: reason || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Solicitud rechazada',
        description: 'Has rechazado la colaboración',
      });

      await fetchRequests();
    } catch (error: any) {
      toast({
        title: 'Error al rechazar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return {
    requests,
    loading,
    acceptRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
};
