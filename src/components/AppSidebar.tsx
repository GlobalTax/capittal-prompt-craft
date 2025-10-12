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
  FileBarChart
} from "lucide-react";
import { useTranslation } from "react-i18next";


export function AppSidebar() {
  const { t } = useTranslation();
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const menuItems = [
    {
      title: t('sidebar.dashboard'),
      url: "/",
      icon: LayoutDashboard,
      description: "Resumen ejecutivo"
    },
    {
      title: t('sidebar.valuations'),
      url: "/valuation",
      icon: Calculator,
      description: "Calculadora principal"
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
        {!collapsed && (
          <div className="px-4 pb-4 mb-2">
            <h2 className="text-xl font-bold text-sidebar-foreground">Capittal</h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Calculator className="h-3 w-3" />
              Herramienta de Valoración Despachos
            </p>
          </div>
        )}

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
      </SidebarContent>
    </Sidebar>
  );
}