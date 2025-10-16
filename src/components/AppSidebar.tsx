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
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Settings,
  BarChart3,
  Target,
  FileBarChart,
  FileDown,
  Handshake,
  DollarSign,
  ShieldCheck,
  Users,
  FolderOpen
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUserRole } from "@/hooks/useUserRole";
import logoCapittal from "@/assets/logo-capittal.png";


export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const { isAdmin, isAdvisor, loading } = useUserRole();

  const menuItems = [
    {
      title: t('sidebar.dashboard'),
      url: "/",
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


  const advancedItems = [
    {
      title: t('sidebar.budget'),
      url: "/advanced/budget",
      icon: BarChart3,
      description: "Presupuesto mensualizado"
    },
    {
      title: t('sidebar.multiplesComparables'),
      url: "/advanced/multiples",
      icon: FileBarChart,
      description: "Análisis sectorial"
    },
    {
      title: t('sidebar.settings'),
      url: "/settings",
      icon: Settings,
      description: "Ajustes avanzados"
    }
  ];

  const resourceItems = [
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

  const renderMenuItems = (items: typeof menuItems) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild className="h-9 mx-2 rounded-md">
            <NavLink to={item.url} end className={getNavCls}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="text-base font-medium truncate">{item.title}</span>
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
        {/* Logo/Brand */}
        <div className="px-4 pb-4 mb-2">
          {collapsed ? (
            <img src={logoCapittal} alt="Capittal" className="h-8 w-8 mx-auto" />
          ) : (
            <div>
              <img src={logoCapittal} alt="Capittal" className="h-10 mb-2" />
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Calculator className="h-3 w-3" />
                Herramienta de Valoración Despachos
              </p>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            {t('sidebar.mainAnalysis')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(menuItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Advanced Features */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            {t('sidebar.advancedFeatures')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(advancedItems)}
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