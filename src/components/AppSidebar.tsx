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
  Handshake,
  DollarSign,
  ShieldCheck,
  Users,
  FolderOpen,
  TrendingUp,
  ShieldAlert,
  FileSearch,
  Settings2
} from "lucide-react";
import { usePendingAlerts } from "@/hooks/usePendingAlerts";
import { useTranslation } from "react-i18next";
import { useUserRole } from "@/hooks/useUserRole";


export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, isAdvisor, loading } = useUserRole();
  const { data: alerts } = usePendingAlerts();

  const menuItems = [
    {
      title: t('sidebar.dashboard'),
      url: "/dashboard",
      icon: LayoutDashboard,
      description: "Resumen ejecutivo"
    },
    {
      title: "Mis Valoraciones",
      url: "/valuations/advisor",
      icon: Calculator,
      description: "Valoración del despacho"
    },
    {
      title: "Valoraciones Clientes",
      url: "/valuations/clients",
      icon: Target,
      description: "Valoraciones de clientes"
    },
    {
      title: t('sidebar.reports'),
      url: "/reports",
      icon: FileText,
      description: "PDFs profesionales"
    }
  ];

  const resourceItems = [
    {
      title: "Mis Referencias",
      url: "/my-referrals",
      icon: TrendingUp,
      description: "Leads y comisiones"
    },
    {
      title: t('sidebar.documentTemplates'),
      url: "/resources/templates",
      icon: FileDown,
      description: "Plantillas descargables"
    },
    {
      title: t('sidebar.sellBusiness'),
      url: "/resources/sell-business",
      icon: Handshake,
      description: "Colaboración en venta"
    },
    {
      title: t('sidebar.feeCalculator'),
      url: "/resources/fee-calculator",
      icon: DollarSign,
      description: "Calcular honorarios"
    }
  ];

  const adminItems = [
    {
      title: "Panel de Administración",
      url: "/admin",
      icon: ShieldCheck,
      description: "Dashboard administrativo"
    },
    {
      title: "Alertas de Seguridad",
      url: "/admin/security",
      icon: ShieldAlert,
      description: "Monitoreo y control",
      badge: alerts?.total || 0
    },
    {
      title: "Gestión de Usuarios",
      url: "/admin/users",
      icon: Users,
      description: "Verificar y gestionar usuarios"
    },
    {
      title: "Gestión de Documentos",
      url: "/admin/templates",
      icon: FolderOpen,
      description: "Administrar recursos"
    },
    {
      title: "Gestión de Leads",
      url: "/admin/sell-leads",
      icon: Users,
      description: "Gestionar leads de venta"
    },
    {
      title: "Analytics de Funnel",
      url: "/admin/funnel-analytics",
      icon: TrendingUp,
      description: "Métricas de conversión"
    },
    {
      title: "Comisiones",
      url: "/admin/commissions",
      icon: DollarSign,
      description: "Gestionar comisiones"
    },
    {
      title: "Logs de Auditoría",
      url: "/admin/audit-logs",
      icon: FileSearch,
      description: "Trazabilidad del sistema"
    },
    {
      title: "Configuración de Alertas",
      url: "/admin/alert-settings",
      icon: Settings2,
      description: "Personalizar notificaciones"
    }
  ];

  const advisorItems = [
    {
      title: "Mi Perfil de Asesor",
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
              Perfil de Asesor
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
              Administración
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