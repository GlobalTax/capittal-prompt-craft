import { Building2, Calculator, FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Capittal</h1>
              <p className="text-xs text-muted-foreground">Valoración de Asesorías</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Calculator className="h-4 w-4 mr-2" />
              Valoración
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Reportes
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Users className="h-4 w-4 mr-2" />
              Clientes
            </Button>
          </nav>

          {/* Contact */}
          <div className="hidden lg:block text-right">
            <div className="text-sm font-medium text-foreground">Madrid</div>
            <div className="text-xs text-muted-foreground">P.º de la Castellana 11-B</div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;