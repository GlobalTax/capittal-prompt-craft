import { Building2, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { ValuationType } from '@/hooks/useValuations';

interface ValuationListHeaderProps {
  filterType?: ValuationType;
  totalCount: number;
  inProgressCount: number;
  completedCount: number;
  totalEBITDA: number;
  onNewClick: () => void;
}

export function ValuationListHeader({
  filterType,
  totalCount,
  inProgressCount,
  completedCount,
  totalEBITDA,
  onNewClick,
}: ValuationListHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOwnBusiness = filterType === 'own_business';
  const isClientBusiness = filterType === 'client_business';
  const currentTab = isClientBusiness ? 'clients' : 'own';

  // Configuración de estilo según el tipo
  const config = isClientBusiness
    ? {
        gradient: 'from-success/10 via-success/5 to-background',
        icon: Users,
        iconColor: 'text-success',
        title: 'Valoraciones de Clientes',
        accentColor: 'text-success',
      }
    : {
        gradient: 'from-primary/10 via-primary/5 to-background',
        icon: Building2,
        iconColor: 'text-primary',
        title: 'Mis Valoraciones',
        accentColor: 'text-primary',
      };

  const Icon = config.icon;

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      {/* Tabs de navegación */}
      <div className="border-b bg-muted/30">
        <div className="container px-4">
          <Tabs value={currentTab} className="w-full">
            <TabsList className="w-full justify-start h-12 bg-transparent border-0 rounded-none">
              <TabsTrigger
                value="own"
                onClick={() => navigate('/valuations')}
                className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <Building2 className="h-4 w-4" />
                Mis Valoraciones
              </TabsTrigger>
              <TabsTrigger
                value="clients"
                onClick={() => navigate('/valuations/clients')}
                className="gap-2 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-success data-[state=active]:text-success rounded-none"
              >
                <Users className="h-4 w-4" />
                Valoraciones de Clientes
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Header con gradient */}
      <div className={`bg-gradient-to-r ${config.gradient} border-b`}>
        <div className="container px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center ${config.iconColor}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h1 className={`text-2xl font-semibold ${config.accentColor}`}>
                {config.title}
              </h1>
            </div>
            <Button onClick={onNewClick} className="gap-2">
              <Plus className="h-4 w-4" />
              Nueva Valoración
            </Button>
          </div>

          {/* Mini KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background/50 backdrop-blur rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
            <div className="bg-background/50 backdrop-blur rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">En Progreso</p>
              <p className="text-2xl font-bold text-primary">{inProgressCount}</p>
            </div>
            <div className="bg-background/50 backdrop-blur rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">Completadas</p>
              <p className="text-2xl font-bold text-success">{completedCount}</p>
            </div>
            <div className="bg-background/50 backdrop-blur rounded-lg p-4 border">
              <p className="text-sm text-muted-foreground mb-1">EBITDA Total</p>
              <p className="text-2xl font-bold">{totalEBITDA.toLocaleString()}€</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
