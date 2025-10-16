import { useCountUp } from '@/hooks/useCountUp';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoCapittal from '@/assets/logo-capittal.png';

interface UserCounterProps {
  variant?: 'default' | 'hero' | 'compact';
  showBadge?: boolean;
  showTrend?: boolean;
}

export function UserCounter({ 
  variant = 'default', 
  showBadge = true,
  showTrend = false 
}: UserCounterProps) {
  // Función para calcular el número de asesores basado en la fecha
  const calculateAdvisorCount = (): number => {
    const BASE_COUNT = 223;
    const START_DATE = new Date('2025-10-16');
    const today = new Date();
    
    const diffTime = Math.abs(today.getTime() - START_DATE.getTime());
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Crecimiento pseudo-aleatorio pero determinístico
    let totalIncrement = 0;
    for (let day = 1; day <= daysPassed; day++) {
      // Usar el día como seed para pseudo-random
      const seed = day * 9301 + 49297; // Números primos
      const random = (seed % 233) / 233; // Valor entre 0-1
      const dayIncrement = random < 0.3 ? 1 : 2; // 30% días +1, 70% días +2
      totalIncrement += dayIncrement;
    }
    
    return BASE_COUNT + totalIncrement;
  };

  const currentCount = calculateAdvisorCount();

  const { count } = useCountUp({
    end: currentCount,
    duration: 2500,
    start: 0,
  });

  if (variant === 'hero') {
    return (
      <div className="inline-flex items-center gap-4 px-6 py-4 bg-background rounded-2xl border-2 border-border shadow-lg animate-fade-in">
        <div className="p-3 bg-muted rounded-full">
          <img src={logoCapittal} alt="Capittal" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-foreground">
              {count.toLocaleString()}
            </span>
            {showBadge && (
              <Badge variant="success" className="text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1"></span>
                Activos
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Asesores usando Capittal de manera habitual
          </p>
          {showTrend && (
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +12% este mes
            </p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className="bg-card border-border hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Asesores Activos</p>
              <p className="text-3xl font-bold text-primary">{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">usando Capittal</p>
            </div>
            <div className="p-3 bg-muted rounded-full">
              <img src={logoCapittal} alt="Capittal" className="w-6 h-6 object-contain" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted rounded-lg border border-border">
      <img src={logoCapittal} alt="Capittal" className="w-5 h-5 object-contain" />
      <div>
        <p className="text-2xl font-bold">{count.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">asesores</p>
      </div>
    </div>
  );
}
