import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Mail, Phone, Handshake } from "lucide-react";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { trackFunnelEvent } from "@/lib/analytics";

const formSchema = z.object({
  companyName: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
  sector: z.string().min(2, "El sector es requerido"),
  revenue: z.string().min(1, "La facturación es requerida"),
  contactName: z.string().min(2, "El nombre de contacto es requerido"),
  contactEmail: z.string().email("Email inválido"),
  contactPhone: z.string().min(9, "Teléfono inválido"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

const SellBusinessContact = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const [searchParams] = useSearchParams();
  const valuationId = searchParams.get("valuation");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      sector: "",
      revenue: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      message: "",
    },
  });

  useEffect(() => {
    // Pre-fill form if coming from valuation
    if (valuationId) {
      fetchValuationData(valuationId);
    }
  }, [valuationId]);

  const fetchValuationData = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("valuations")
        .select("title")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data) {
        form.setValue("companyName", data.title || "");
      }
    } catch (error) {
      console.error("Error fetching valuation:", error);
    }
  };

  const handleFormStart = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackFunnelEvent("form_started", { valuationId: valuationId || undefined });
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();

      // Call edge function to create lead and send emails
      const { data, error } = await supabase.functions.invoke("send-sell-business-lead", {
        body: {
          companyName: values.companyName,
          sector: values.sector,
          revenue: parseFloat(values.revenue.replace(/[^0-9.]/g, "")),
          contactName: values.contactName,
          contactEmail: values.contactEmail,
          contactPhone: values.contactPhone,
          message: values.message,
          advisorUserId: user?.id || null,
          valuationId: valuationId || null,
        },
      });

      if (error) throw error;

      toast.success("¡Solicitud enviada con éxito! Nos pondremos en contacto pronto.");
      form.reset();
      setFormStarted(false);
    } catch (error: any) {
      console.error("Error submitting lead:", error);
      toast.error("Error al enviar la solicitud. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vender mi Empresa</h1>
        <p className="text-muted-foreground mt-2">
          Colabora con Capittal para maximizar el valor de la venta de tu empresa
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Solicitud de Colaboración</CardTitle>
              <CardDescription>
                Completa el formulario y nuestro equipo te contactará
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Mi Empresa S.L." 
                            className="pl-9" 
                            {...field} 
                            onFocus={handleFormStart}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sector</FormLabel>
                      <FormControl>
                        <Input placeholder="Tecnología, Servicios..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="revenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facturación Anual Aproximada</FormLabel>
                    <FormControl>
                      <Input placeholder="2000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold mb-4">Datos de Contacto</h3>
                
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Pérez" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="email@ejemplo.com" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="+34 600 000 000" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensaje / Información Adicional</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cuéntanos más sobre tu empresa y tus objetivos de venta..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Enviando..." : "Enviar Solicitud"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SellBusinessContact;