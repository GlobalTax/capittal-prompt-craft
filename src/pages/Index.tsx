import Header from "@/components/Header";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto p-6">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Bienvenido</h1>
          <p className="text-muted-foreground">Usa el menú lateral para navegar</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
