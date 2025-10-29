import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Valuation, ValuationType } from '@/hooks/useValuations';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSectorMultiples } from '@/hooks/useSectorMultiples';
import { Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientInfoFormProps {
  valuation: Valuation;
  onUpdate: (field: keyof Valuation, value: any) => void;
}

export function ClientInfoForm({ valuation, onUpdate }: ClientInfoFormProps) {
  const { sectorMultiples, loading: loadingSectors } = useSectorMultiples();
  const { toast } = useToast();

  if (valuation.valuation_type === 'own_business') {
    return null;
  }

  const handleSectorChange = (sectorCode: string) => {
    const sector = sectorMultiples.find(s => s.sector_code === sectorCode);
    if (!sector) return;

    // Guardar el código del sector
    const currentMetadata = valuation.metadata || {};
    onUpdate('metadata', {
      ...currentMetadata,
      sectorCode: sectorCode,
      valuationMethods: {
        ebitda: { enabled: true, multiplier: sector.ebitda_multiple_avg },
        revenue: { enabled: true, multiplier: sector.revenue_multiple_avg },
        netProfit: { enabled: false, multiplier: sector.pe_ratio_avg }
      }
    });

    toast({
      title: 'Múltiplos aplicados',
      description: `Se han aplicado los múltiplos promedio del sector ${sector.sector_name}`,
    });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <h3 className="font-semibold text-lg">
        {valuation.valuation_type === 'client_business' 
          ? 'Información del Cliente' 
          : 'Información del Objetivo'}
      </h3>

      {valuation.valuation_type === 'client_business' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Nombre del Cliente</Label>
            <Input
              id="client_name"
              value={valuation.client_name || ''}
              onChange={(e) => onUpdate('client_name', e.target.value)}
              placeholder="Juan Pérez"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client_company">Empresa del Cliente</Label>
            <Input
              id="client_company"
              value={valuation.client_company || ''}
              onChange={(e) => onUpdate('client_company', e.target.value)}
              placeholder="Asesoría López S.L."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client_email">Email</Label>
            <Input
              id="client_email"
              type="email"
              value={valuation.client_email || ''}
              onChange={(e) => onUpdate('client_email', e.target.value)}
              placeholder="juan@ejemplo.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="client_phone">Teléfono</Label>
            <Input
              id="client_phone"
              value={valuation.client_phone || ''}
              onChange={(e) => onUpdate('client_phone', e.target.value)}
              placeholder="+34 600 000 000"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cnae_code">CNAE</Label>
            <Input
              id="cnae_code"
              value={valuation.cnae_code || ''}
              onChange={(e) => onUpdate('cnae_code', e.target.value)}
              placeholder="Ej: 6920 - Actividades de contabilidad, teneduría de libros..."
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="sector">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sector de Actividad
              </div>
            </Label>
            <Select 
              value={valuation.metadata?.sectorCode || ''} 
              onValueChange={handleSectorChange}
              disabled={loadingSectors}
            >
              <SelectTrigger id="sector">
                <SelectValue placeholder="Selecciona el sector para aplicar múltiplos automáticamente..." />
              </SelectTrigger>
              <SelectContent>
                {sectorMultiples.map(sector => (
                  <SelectItem key={sector.sector_code} value={sector.sector_code}>
                    {sector.sector_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {valuation.metadata?.sectorCode && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-green-600">✓</span>
                Múltiplos aplicados automáticamente del sector seleccionado
              </p>
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="business_description">Descripción de la Actividad</Label>
            <Input
              id="business_description"
              value={valuation.business_description || ''}
              onChange={(e) => onUpdate('business_description', e.target.value)}
              placeholder="Breve descripción del negocio y su actividad principal"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="target_company_name">Nombre de la Empresa</Label>
            <Input
              id="target_company_name"
              value={valuation.target_company_name || ''}
              onChange={(e) => onUpdate('target_company_name', e.target.value)}
              placeholder="Empresa Target S.L."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target_industry">Sector</Label>
            <Input
              id="target_industry"
              value={valuation.target_industry || ''}
              onChange={(e) => onUpdate('target_industry', e.target.value)}
              placeholder="Servicios profesionales"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target_location">Ubicación</Label>
            <Input
              id="target_location"
              value={valuation.target_location || ''}
              onChange={(e) => onUpdate('target_location', e.target.value)}
              placeholder="Madrid"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_person">Persona de Contacto</Label>
            <Input
              id="contact_person"
              value={valuation.contact_person || ''}
              onChange={(e) => onUpdate('contact_person', e.target.value)}
              placeholder="María García"
            />
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="cnae_code">CNAE</Label>
            <Input
              id="cnae_code"
              value={valuation.cnae_code || ''}
              onChange={(e) => onUpdate('cnae_code', e.target.value)}
              placeholder="Ej: 6920 - Actividades de contabilidad"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="sector">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Sector de Actividad
              </div>
            </Label>
            <Select 
              value={valuation.metadata?.sectorCode || ''} 
              onValueChange={handleSectorChange}
              disabled={loadingSectors}
            >
              <SelectTrigger id="sector">
                <SelectValue placeholder="Selecciona el sector para aplicar múltiplos automáticamente..." />
              </SelectTrigger>
              <SelectContent>
                {sectorMultiples.map(sector => (
                  <SelectItem key={sector.sector_code} value={sector.sector_code}>
                    {sector.sector_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {valuation.metadata?.sectorCode && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="text-green-600">✓</span>
                Múltiplos aplicados automáticamente del sector seleccionado
              </p>
            )}
          </div>
          
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="business_description">Descripción de la Actividad</Label>
            <Input
              id="business_description"
              value={valuation.business_description || ''}
              onChange={(e) => onUpdate('business_description', e.target.value)}
              placeholder="Descripción del negocio objetivo"
            />
          </div>
        </div>
      )}
    </div>
  );
}
