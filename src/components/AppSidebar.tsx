import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Settings,
  Target,
  FileDown,
  DollarSign,
  ShieldCheck,
  Users,
  FolderOpen,
  TrendingUp,
  ShieldAlert,
  FileSearch,
  Settings2,
  Send,
  Inbox,
  Handshake
} from "lucide-react";
import { usePendingAlerts } from "@/hooks/usePendingAlerts";
import { useTranslation } from "react-i18next";
import { useUserRole } from "@/hooks/useUserRole";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, isAdvisor, loading } = useUserRole();
  const { data: alerts } = usePendingAlerts();

  // Query para contar colaboraciones pendientes
  const { data: pendingCount } = useQuery({
    queryKey: ['sidebar-pending-collaborations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { count } = await supabase
        .from('advisor_collaboration_requests')
        .select('*', { count: 'exact', head: true })
        .eq('target_advisor_id', user.id)
        .eq('status', 'pending');
      
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const menuItems = [
    {
      title: t('sidebar.dashboard'),
      url: "/dashboard",
      icon: LayoutDashboard,
      description: "Resumen ejecutivo"
    },
    {
      title: t('sidebar.valuations'),
      url: "/valuations",
      icon: Calculator,
      description: "Todas tus valoraciones"
    },
    // NOTA: Generador de reportes oculto temporalmente para fase futura
    /*{
      title: t('sidebar.reports'),
      url: "/reports",
      icon: FileText,
      description: "PDFs profesionales"
    }*/
  ];

  const resourceItems = [
    {
      title: t('sidebar.collaborationSent'),
      url: "/my-collaboration-requests",
      icon: Send,
      description: "Solicitudes que he enviado"
    },
    {
      title: t('sidebar.collaborationReceived'),
      url: "/my-received-collaborations",
      icon: Inbox,
      description: "Solicitudes recibidas de otros asesores",
      badge: pendingCount && pendingCount > 0 ? pendingCount : undefined
    },
    {
      title: t('sidebar.myReferences'),
      url: "/my-referrals",
      icon: TrendingUp,
      description: "Mis leads referidos"
    },
    {
      title: t('sidebar.documentTemplates'),
      url: "/resources/templates",
      icon: FileDown,
      description: "Plantillas descargables"
    }
  ];

  const adminItems = [
    {
      title: t('sidebar.adminPanel'),
      url: "/admin",
      icon: ShieldCheck,
      description: "Dashboard administrativo"
    },
    {
      title: t('sidebar.securityAlerts'),
      url: "/admin/security",
      icon: ShieldAlert,
      description: "Monitoreo y control",
      badge: alerts?.total || 0
    },
    {
      title: t('sidebar.userManagement'),
      url: "/admin/users",
      icon: Users,
      description: "Verificar y gestionar usuarios"
    },
    {
      title: t('sidebar.documentManagement'),
      url: "/admin/templates",
      icon: FolderOpen,
      description: "Administrar recursos"
    },
    {
      title: t('sidebar.leadManagement'),
      url: "/admin/sell-leads",
      icon: Users,
      description: "Gestionar leads de venta"
    },
    {
      title: t('sidebar.funnelAnalytics'),
      url: "/admin/funnel-analytics",
      icon: TrendingUp,
      description: "Métricas de conversión"
    },
    {
      title: t('sidebar.commissions'),
      url: "/admin/commissions",
      icon: DollarSign,
      description: "Gestionar comisiones"
    },
    {
      title: t('sidebar.auditLogs'),
      url: "/admin/audit-logs",
      icon: FileSearch,
      description: "Trazabilidad del sistema"
    },
    {
      title: t('sidebar.alertSettings'),
      url: "/admin/alert-settings",
      icon: Settings2,
      description: "Personalizar notificaciones"
    },
    {
      title: t('sidebar.sectorMultiples'),
      url: "/admin/sector-multiples",
      icon: TrendingUp,
      description: "Gestionar múltiplos de valoración"
    },
    {
      title: t('sidebar.advisorCollaborations'),
      url: "/admin/advisor-collaborations",
      icon: Handshake,
      description: "Supervisar colaboraciones entre asesores"
    }
  ];

  const advisorItems = [
    {
      title: t('sidebar.advisorProfile'),
      url: "/settings?tab=branding",
      icon: Settings,
      description: "Configurar perfil y branding"
    }
  ];

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-accent text-accent-foreground font-medium" 
      : "hover:bg-sidebar-accent text-sidebar-foreground";

  const renderMenuItems = (items: any[]) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild className="h-9 mx-2 rounded-md">
            <NavLink to={item.url} end className={getNavCls}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <div className="flex items-center justify-between flex-1">
                  <span className="text-base font-medium truncate">{item.title}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <Badge variant="destructive" className="ml-2">{item.badge}</Badge>
                  )}
                </div>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar className="shrink-0 border-r border-sidebar-border bg-sidebar" collapsible="icon" style={{ "--sidebar-width": "16rem" } as React.CSSProperties}>
      <SidebarContent className="py-4 overflow-y-auto">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            {t('sidebar.mainAnalysis')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(menuItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Resources */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            {t('sidebar.resources')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(resourceItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Advisor Profile (only for advisors) */}
        {!loading && isAdvisor && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
              {t('sidebar.advisorProfile')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(advisorItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administration (only for admins) */}
        {!loading && isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
              {t('sidebar.administration')}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              {renderMenuItems(adminItems)}
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}