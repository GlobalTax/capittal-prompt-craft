import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfile } from "@/components/auth/UserProfile";
import { ReportIssueButton } from "@/components/ReportIssueButton";
import { Badge } from "@/components/ui/badge";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  // Query para contar colaboraciones pendientes
  const { data: pendingCount } = useQuery({
    queryKey: ['pending-collaborations-count'],
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
    refetchInterval: 30000, // Refetch cada 30 segundos
  });

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  const handleNotificationsClick = () => {
    navigate('/my-received-collaborations');
  };

  return (
    <header className="bg-card border-b border-border sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Sidebar Trigger */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          {pendingCount && pendingCount > 0 && (
            <button
              onClick={handleNotificationsClick}
              className="relative p-2 hover:bg-accent rounded-md transition-colors"
              title={`${pendingCount} colaboraciones pendientes`}
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Badge 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </Badge>
            </button>
          )}

          <Select value={i18n.language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-24 h-8 border-0 bg-transparent text-xs text-muted-foreground hover:text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ca">Català</SelectItem>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <ReportIssueButton variant="ghost" size="icon" />
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default Header;