import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useNewLeadsCount() {
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewLeadsCount();

    // Poll every 30 seconds for new leads
    const interval = setInterval(fetchNewLeadsCount, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchNewLeadsCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { count, error } = await supabase
        .from('sell_business_leads')
        .select('*', { count: 'exact', head: true })
        .eq('advisor_user_id', user.id)
        .eq('status', 'new');

      if (error) throw error;

      setNewLeadsCount(count || 0);
    } catch (error) {
      console.error('Error fetching new leads count:', error);
    } finally {
      setLoading(false);
    }
  };

  return { newLeadsCount, loading };
}
