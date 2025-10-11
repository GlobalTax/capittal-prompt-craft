import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Valuation, ValuationType } from '@/hooks/useValuations';

interface ClientInfoFormProps {
  valuation: Valuation;
  onUpdate: (field: keyof Valuation, value: any) => void;
}

export function ClientInfoForm({ valuation, onUpdate }: ClientInfoFormProps) {
  if (valuation.valuation_type === 'own_business') {
    return null;
  }

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
        </div>
      )}
    </div>
  );
}
