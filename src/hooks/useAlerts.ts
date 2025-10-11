import { useState, useEffect } from 'react';
import { alertRepository, SystemAlert, AlertRule } from '@/repositories/AlertRepository';
import { useToast } from '@/hooks/use-toast';

export function useAlerts(userId: string | undefined) {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const [alertsData, rulesData, unreadCountData] = await Promise.all([
        alertRepository.getAlerts(userId),
        alertRepository.getRules(userId),
        alertRepository.getUnreadCount(userId)
      ]);
      
      setAlerts(alertsData);
      setAlertRules(rulesData);
      setUnreadCount(unreadCountData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las alertas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      await alertRepository.markAsRead(alertId);
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudo marcar la alerta como leída',
        variant: 'destructive',
      });
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    
    try {
      await alertRepository.markAllAsRead(userId);
      setAlerts(prev => prev.map(alert => ({ ...alert, is_read: true })));
      setUnreadCount(0);
      toast({
        title: 'Todas las alertas marcadas como leídas',
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron marcar todas las alertas',
        variant: 'destructive',
      });
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      await alertRepository.deleteAlert(alertId);
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      toast({
        title: 'Alerta eliminada',
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la alerta',
        variant: 'destructive',
      });
    }
  };

  const toggleRule = async (ruleId: string) => {
    const rule = alertRules.find(r => r.id === ruleId);
    if (!rule) return;

    try {
      await alertRepository.toggleRule(ruleId, !rule.enabled);
      setAlertRules(prev => prev.map(r => 
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ));
    } catch (error) {
      console.error('Error toggling rule:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la regla',
        variant: 'destructive',
      });
    }
  };

  return {
    alerts,
    alertRules,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteAlert,
    toggleRule,
    refetch: fetchData,
  };
}
