import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// ============================================
// SHARED ZOD SCHEMAS FOR EDGE FUNCTIONS
// ============================================

/**
 * Admin Delete User Input Schema
 */
export const AdminDeleteUserSchema = z.object({
  user_id: z.string().uuid("ID de usuario inválido")
});

/**
 * Send User Invitation Input Schema
 */
export const SendInvitationSchema = z.object({
  email: z.string()
    .email("Email inválido")
    .min(5, "Email demasiado corto")
    .max(255, "Email demasiado largo")
    .transform(val => val.toLowerCase().trim()),
  role: z.enum(['user', 'advisor', 'admin', 'superadmin'], {
    errorMap: () => ({ message: "Rol inválido. Debe ser: user, advisor, admin o superadmin" })
  }),
  app_url: z.string().url("URL inválida").optional()
});

/**
 * Link Invitation Input Schema
 */
export const LinkInvitationSchema = z.object({
  token: z.string()
    .uuid("Token de invitación inválido")
});

/**
 * Security Alert Payload Schema
 */
export const SecurityAlertSchema = z.object({
  event_id: z.string().uuid("Event ID inválido"),
  event_type: z.string().min(3, "Tipo de evento requerido").max(100),
  severity: z.enum(['critical', 'high', 'medium', 'low'], {
    errorMap: () => ({ message: "Severidad inválida" })
  }),
  description: z.string().min(10, "Descripción muy corta").max(500, "Descripción muy larga"),
  user_id: z.string().uuid().optional().nullable(),
  user_email: z.string().email().optional().nullable(),
  ip_address: z.string().ip({ version: "v4" }).optional().nullable(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime()
});

/**
 * Sell Business Lead Schema (already exists in send-sell-business-lead)
 */
export const SellBusinessSchema = z.object({
  companyName: z.string().trim().min(2, "El nombre de la empresa debe tener al menos 2 caracteres").max(200, "El nombre es demasiado largo"),
  sector: z.string().trim().min(2, "El sector es requerido").max(100),
  revenue: z.number().positive("La facturación debe ser positiva").max(999999999, "Valor demasiado grande"),
  contactName: z.string().trim().min(2, "El nombre de contacto es requerido").max(100),
  contactEmail: z.string().email("Email inválido").max(255),
  contactPhone: z.string().trim().min(9, "Teléfono inválido").max(20),
  message: z.string().trim().max(2000, "Mensaje demasiado largo").optional(),
  advisorUserId: z.string().uuid().optional(),
  valuationId: z.string().uuid().optional(),
});

/**
 * MFA Verify Input Schema
 */
export const MFAVerifySchema = z.object({
  token: z.string()
    .regex(/^\d{6}$/, "Token debe ser 6 dígitos numéricos"),
  factor_id: z.string().uuid("Factor ID inválido")
});

/**
 * Cleanup Logs Schema (no input needed, just validates auth)
 */
export const CleanupLogsSchema = z.object({});

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

/**
 * Generic validation function with error sanitization
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
  };
}

/**
 * Sanitize error messages for user display (F05 - Security)
 */
export function sanitizeError(error: any): string {
  console.error('[Internal Error]', error);
  
  // Map known errors to user-friendly messages
  if (error?.code === '23505') return 'Este registro ya existe';
  if (error?.code === '23503') return 'Referencia inválida';
  if (error?.code === '23502') return 'Campo requerido faltante';
  if (error?.code === '22P02') return 'Formato de dato inválido';
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message).join(', ');
  }
  
  // Never expose internal error details
  return 'Error al procesar la solicitud. Por favor contacta con soporte.';
}

/**
 * HTML escape function to prevent XSS (F06)
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Redact sensitive data from logs (F04)
 */
export function redactEmail(email: string): string {
  if (!email || !email.includes('@')) return 'unknown';
  const [local, domain] = email.split('@');
  const redactedLocal = local.length > 2 
    ? `${local[0]}${'*'.repeat(local.length - 2)}${local[local.length - 1]}`
    : '*'.repeat(local.length);
  return `${redactedLocal}@${domain}`;
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
