import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Calculator } from "lucide-react";

interface ContactData {
  fullName: string;
  email: string;
  phone: string;
}

interface CompanyData {
  companyName: string;
  cif: string;
  sector: string;
  employees: string;
}

interface FinancialData {
  annualRevenue: string;
  ebitda: string;
}

interface FormData {
  contact: ContactData;
  company: CompanyData;
  financial: FinancialData;
}

const BusinessValuationWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    contact: {
      fullName: "",
      email: "",
      phone: ""
    },
    company: {
      companyName: "",
      cif: "",
      sector: "",
      employees: ""
    },
    financial: {
      annualRevenue: "",
      ebitda: ""
    }
  });

  const updateContactData = (field: keyof ContactData, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact: { ...prev.contact, [field]: value }
    }));
  };

  const updateCompanyData = (field: keyof CompanyData, value: string) => {
    setFormData(prev => ({
      ...prev,
      company: { ...prev.company, [field]: value }
    }));
  };

  const updateFinancialData = (field: keyof FinancialData, value: string) => {
    setFormData(prev => ({
      ...prev,
      financial: { ...prev.financial, [field]: value }
    }));
  };

  const calculateValuation = () => {
    const revenue = parseFloat(formData.financial.annualRevenue) || 0;
    const ebitda = parseFloat(formData.financial.ebitda) || 0;
    
    // Simple valuation calculation for demo
    const revenueMultiple = revenue * 0.8;
    const ebitdaMultiple = ebitda * 5;
    const estimatedValue = (revenueMultiple + ebitdaMultiple) / 2;
    
    return estimatedValue;
  };

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate and show results
      console.log("Calculate valuation:", calculateValuation());
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepNames = ["Datos de la empresa", "Resultado"];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Calculadora de Valoració Empresarial
          </h1>
          <p className="text-muted-foreground">
            Obtè una valoració estimada de la teva empresa en pocs passos
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {stepNames.map((stepName, index) => {
              const stepNumber = index + 1;
              const isActive = stepNumber === currentStep;
              const isCompleted = stepNumber < currentStep;
              
              return (
                <div key={stepNumber} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        ${isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : isCompleted 
                            ? 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }
                      `}
                    >
                      {stepNumber}
                    </div>
                    <span className={`mt-2 text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {stepName}
                    </span>
                  </div>
                  {index < stepNames.length - 1 && (
                    <div className="w-16 h-px bg-border ml-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Información de Contacto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nombre completo *</Label>
                      <Input
                        id="fullName"
                        placeholder="Tu nombre completo"
                        value={formData.contact.fullName}
                        onChange={(e) => updateContactData('fullName', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email corporativo *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={formData.contact.email}
                        onChange={(e) => updateContactData('email', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
                      <Input
                        id="phone"
                        placeholder="+34 600 000 000"
                        value={formData.contact.phone}
                        onChange={(e) => updateContactData('phone', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Data */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Datos de la Empresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la empresa *</Label>
                      <Input
                        id="companyName"
                        placeholder="Nombre de tu empresa"
                        value={formData.company.companyName}
                        onChange={(e) => updateCompanyData('companyName', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cif">CIF/NIF</Label>
                      <Input
                        id="cif"
                        placeholder="B12345678"
                        value={formData.company.cif}
                        onChange={(e) => updateCompanyData('cif', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sector">Sector de actividad *</Label>
                      <Select value={formData.company.sector} onValueChange={(value) => updateCompanyData('sector', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el sector" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asesoria-fiscal">Asesoría Fiscal</SelectItem>
                          <SelectItem value="asesoria-laboral">Asesoría Laboral</SelectItem>
                          <SelectItem value="asesoria-contable">Asesoría Contable</SelectItem>
                          <SelectItem value="consultoria">Consultoría</SelectItem>
                          <SelectItem value="juridico">Jurídico</SelectItem>
                          <SelectItem value="otros">Otros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employees">Número de empleados *</Label>
                      <Select value={formData.company.employees} onValueChange={(value) => updateCompanyData('employees', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el rango" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-5">1-5 empleados</SelectItem>
                          <SelectItem value="6-10">6-10 empleados</SelectItem>
                          <SelectItem value="11-25">11-25 empleados</SelectItem>
                          <SelectItem value="26-50">26-50 empleados</SelectItem>
                          <SelectItem value="50+">Más de 50 empleados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Financial Data */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Datos Financieros
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Información del último ejercicio fiscal completo
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="revenue">Facturación anual *</Label>
                      <Input
                        id="revenue"
                        placeholder="500.000"
                        value={formData.financial.annualRevenue}
                        onChange={(e) => updateFinancialData('annualRevenue', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ebitda">EBITDA *</Label>
                      <Input
                        id="ebitda"
                        placeholder="75.000"
                        value={formData.financial.ebitda}
                        onChange={(e) => updateFinancialData('ebitda', e.target.value)}
                        className="bg-background"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-primary-light rounded-lg">
                    <h4 className="text-sm font-medium text-primary mb-2">
                      Información sobre estos datos financieros
                    </h4>
                    <ul className="text-sm text-primary space-y-1">
                      <li>• Los ingresos incluyen todas las ventas y servicios facturados</li>
                      <li>• El EBITDA es el beneficio antes de intereses, impuestos, depreciación y amortización</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center mb-6">
                  <Calculator className="h-16 w-16 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  Valoración Estimada
                </h3>
                <div className="text-4xl font-bold text-primary">
                  {calculateValuation().toLocaleString('es-ES')}€
                </div>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Esta valoración es una estimación basada en los datos proporcionados y múltiplos del sector.
                  Para una valoración más precisa, nuestros expertos realizarán un análisis detallado.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="outline" 
            onClick={previousStep}
            disabled={currentStep === 1}
            className="flex items-center"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>
          
          <div className="text-sm text-muted-foreground">
            Paso {currentStep} de 2
          </div>
          
          <Button 
            onClick={nextStep}
            className="flex items-center"
            disabled={currentStep === 2}
          >
            <Calculator className="h-4 w-4 mr-2" />
            {currentStep === 1 ? 'Calcular' : 'Finalizar'}
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Al calcular acepto que Capittal procese mis datos para la valoración y envío por WhatsApp si proporciono mi teléfono.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BusinessValuationWizard;