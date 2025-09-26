import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Header = () => {
  return (
    <header className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Capittal</h1>
          </div>

          {/* Language Selector */}
          <div>
            <Select defaultValue="catala">
              <SelectTrigger className="w-24 border-0 bg-transparent text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="catala">Català</SelectItem>
                <SelectItem value="espanyol">Español</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;