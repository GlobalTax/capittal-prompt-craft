import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfile } from "@/components/auth/UserProfile";

const Header = () => {
  return (
    <header className="bg-card border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">
        {/* Sidebar Trigger */}
        <div className="flex items-center gap-4">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Select defaultValue="catala">
            <SelectTrigger className="w-24 h-8 border-0 bg-transparent text-xs text-muted-foreground hover:text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="catala">Català</SelectItem>
              <SelectItem value="espanyol">Español</SelectItem>
              <SelectItem value="english">English</SelectItem>
            </SelectContent>
          </Select>
          <UserProfile />
        </div>
      </div>
    </header>
  );
};

export default Header;