import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Calculator } from "lucide-react";

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await signUp(email, password, { name, company });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-screen gap-12">
          {/* Hero Section */}
          <div className="flex-1 max-w-lg text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              <div className="bg-primary/10 p-3 rounded-full mr-3">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">ValorAsesor</h1>
            </div>
            
            <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Plataforma Profesional de 
              <span className="text-primary block">Valoración M&A</span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              La herramienta definitiva para valorar empresas de servicios profesionales. 
              Cálculos precisos, reportes profesionales y análisis comparativo del mercado.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center space-x-3">
                <Calculator className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Valoraciones Precisas</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Análisis de Mercado</span>
              </div>
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Reportes Profesionales</span>
              </div>
            </div>
          </div>

          {/* Auth Form */}
          <div className="flex-1 max-w-md w-full">
            <Card className="shadow-xl border-border/50">
              <CardHeader className="text-center">
                <CardTitle>Accede a la plataforma</CardTitle>
                <CardDescription>
                  Inicia sesión o crea tu cuenta para comenzar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                    <TabsTrigger value="signup">Registrarse</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="tu@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Contraseña</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name">Nombre completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Juan Pérez"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-company">Empresa (opcional)</Label>
                        <Input
                          id="signup-company"
                          type="text"
                          placeholder="Consultores & Asociados"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="tu@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Contraseña</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoading}
                      >
                        {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;