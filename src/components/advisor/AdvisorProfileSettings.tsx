import { useState, useEffect } from 'react';
import { useAdvisorProfile } from '@/hooks/useAdvisorProfile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Upload, X, Building2, Mail, Phone, Globe } from 'lucide-react';

export function AdvisorProfileSettings() {
  const { profile, loading, updateProfile, uploadLogo, deleteLogo } = useAdvisorProfile();
  const [formData, setFormData] = useState({
    business_name: '',
    professional_title: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    brand_color: '#3b82f6',
    footer_disclaimer: '',
  });
  const [uploading, setUploading] = useState(false);

  // Sync form data with profile when it loads
  useEffect(() => {
    if (profile) {
      setFormData({
        business_name: profile.business_name || '',
        professional_title: profile.professional_title || '',
        contact_email: profile.contact_email || '',
        contact_phone: profile.contact_phone || '',
        website: profile.website || '',
        brand_color: profile.brand_color || '#3b82f6',
        footer_disclaimer: profile.footer_disclaimer || '',
      });
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = await updateProfile(formData);
    if (updatedProfile) {
      setFormData({
        business_name: updatedProfile.business_name || '',
        professional_title: updatedProfile.professional_title || '',
        contact_email: updatedProfile.contact_email || '',
        contact_phone: updatedProfile.contact_phone || '',
        website: updatedProfile.website || '',
        brand_color: updatedProfile.brand_color || '#3b82f6',
        footer_disclaimer: updatedProfile.footer_disclaimer || '',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    await uploadLogo(file, formData.business_name);
    setUploading(false);
  };

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información de Negocio */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Negocio</CardTitle>
          <CardDescription>
            Esta información aparecerá en los informes PDF generados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business_name" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Nombre del Negocio *
            </Label>
            <Input
              id="business_name"
              required
              placeholder="Tu Asesoría S.L."
              value={formData.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="professional_title">Título Profesional</Label>
            <Input
              id="professional_title"
              placeholder="Asesor M&A Senior"
              value={formData.professional_title}
              onChange={(e) => updateField('professional_title', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email de Contacto
              </Label>
              <Input
                id="contact_email"
                type="email"
                placeholder="contacto@tuasesoria.com"
                value={formData.contact_email}
                onChange={(e) => updateField('contact_email', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                id="contact_phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={formData.contact_phone}
                onChange={(e) => updateField('contact_phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Sitio Web
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.tuasesoria.com"
              value={formData.website}
              onChange={(e) => updateField('website', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>
            Personaliza la apariencia de tus informes profesionales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {profile?.logo_url ? (
                <div className="relative group">
                  <img
                    src={profile.logo_url}
                    alt="Logo"
                    className="h-20 w-20 object-contain border rounded-lg bg-card"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={deleteLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading || !formData.business_name}
                  className="hidden"
                  id="logo-upload"
                />
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" disabled={uploading || !formData.business_name} asChild>
                    <span>
                      {uploading ? 'Subiendo...' : 'Seleccionar Imagen'}
                    </span>
                  </Button>
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {!formData.business_name 
                    ? 'Primero guarda el "Nombre del Negocio"'
                    : 'PNG, JPG hasta 2MB'}
                </p>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label htmlFor="brand_color">Color de Marca</Label>
            <div className="flex items-center gap-4">
              <Input
                id="brand_color"
                type="color"
                value={formData.brand_color}
                onChange={(e) => updateField('brand_color', e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.brand_color}
                onChange={(e) => updateField('brand_color', e.target.value)}
                placeholder="#3b82f6"
                className="flex-1"
              />
              <div
                className="w-10 h-10 rounded border"
                style={{ backgroundColor: formData.brand_color }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración Legal */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración Legal</CardTitle>
          <CardDescription>
            Añade avisos legales o disclaimers que aparecerán en los informes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="footer_disclaimer">Aviso Legal / Disclaimer</Label>
            <Textarea
              id="footer_disclaimer"
              placeholder="Este informe es confidencial y está destinado únicamente a uso interno. Las valoraciones presentadas son estimaciones basadas en la información proporcionada..."
              value={formData.footer_disclaimer}
              onChange={(e) => updateField('footer_disclaimer', e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Guardar Configuración
        </Button>
      </div>
    </form>
  );
}
