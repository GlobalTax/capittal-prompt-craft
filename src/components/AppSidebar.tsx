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
  TrendingUp, 
  FileText, 
  Users, 
  Settings,
  BarChart3,
  Database,
  Bell,
  Zap,
  Target,
  FileBarChart
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    description: "Resumen ejecutivo"
  },
  {
    title: "Valoración Básica",
    url: "/valuation",
    icon: Calculator,
    description: "Calculadora principal"
  },
  {
    title: "Generador de Reportes",
    url: "/reports",
    icon: FileText,
    description: "PDFs profesionales"
  },
  {
    title: "Colaboración",
    url: "/collaboration",
    icon: Users,
    description: "Trabajo en equipo"
  }
];

const integrationItems = [
  {
    title: "Datos Financieros",
    url: "/integrations/financial",
    icon: BarChart3,
    description: "APIs de mercado"
  },
  {
    title: "Importador",
    url: "/integrations/importer",
    icon: Database,
    description: "Excel y CSV"
  },
  {
    title: "Alertas",
    url: "/integrations/alerts",
    icon: Bell,
    description: "Notificaciones"
  },
  {
    title: "Zapier",
    url: "/integrations/zapier",
    icon: Zap,
    description: "Automatización"
  }
];

const advancedItems = [
  {
    title: "Due Diligence",
    url: "/advanced/due-diligence",
    icon: Target,
    description: "Checklist completo"
  },
  {
    title: "Múltiplos Comparables",
    url: "/advanced/multiples",
    icon: FileBarChart,
    description: "Análisis sectorial"
  },
  {
    title: "Configuración",
    url: "/settings",
    icon: Settings,
    description: "Ajustes avanzados"
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

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
            <NavLink to={item.url} end={item.url === "/"} className={getNavCls}>
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="text-sm truncate">{item.title}</span>
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
        {!collapsed && (
          <div className="px-4 pb-4 mb-2">
            <h2 className="text-xl font-bold text-sidebar-foreground">Capittal</h2>
            <p className="text-xs text-muted-foreground mt-0.5">M&A Platform</p>
          </div>
        )}

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            Análisis Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(menuItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Integrations */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            Integraciones
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(integrationItems)}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Advanced Features */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : "px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            Funciones Avanzadas
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderMenuItems(advancedItems)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}