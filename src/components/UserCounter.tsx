import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCountUp } from '@/hooks/useCountUp';
import { Users, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
  const { data: userCount, isLoading } = useQuery({
    queryKey: ['user-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const { count } = useCountUp({
    end: userCount || 0,
    duration: 2500,
    start: 0,
  });

  if (variant === 'hero') {
    return (
      <div className="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-xl backdrop-blur-sm animate-fade-in">
        <div className="p-3 bg-primary/20 rounded-full">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {count.toLocaleString()}
            </span>
            {showBadge && (
              <Badge variant="success" className="text-xs animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-success-foreground mr-1"></span>
                Activos
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground font-medium mt-1">
            Profesionales confiando en Capittal
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
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Comunidad Capittal</p>
              <p className="text-3xl font-bold text-primary">{count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-1">usuarios activos</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <Users className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border">
      <Users className="w-5 h-5 text-primary" />
      <div>
        <p className="text-2xl font-bold">{count.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">usuarios</p>
      </div>
    </div>
  );
}
