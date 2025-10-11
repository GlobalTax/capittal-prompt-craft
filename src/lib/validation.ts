import { z } from 'zod';

/**
 * Esquema de validación para datos financieros básicos
 */
export const financialDataSchema = z.object({
  revenue: z.number().min(0, 'Los ingresos deben ser positivos').optional(),
  ebitda: z.number().optional(),
  netIncome: z.number().optional(),
  employees: z.number().int().min(0, 'El número de empleados debe ser positivo').optional(),
  growthRate: z.number().min(-100).max(1000, 'Tasa de crecimiento fuera de rango').optional(),
});

/**
 * Esquema de validación para una valoración completa
 */
export const valuationSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  title: z.string().min(1, 'El título es requerido').max(200, 'El título es demasiado largo'),
  client_name: z.string().max(200).optional().nullable(),
  company_name: z.string().max(200).optional().nullable(),
  valuation_type: z.enum(['ebitda_multiple', 'subscriber_based', 'hybrid']).default('ebitda_multiple'),
  status: z.enum(['draft', 'in_progress', 'completed', 'archived']).default('draft'),
  tags: z.array(z.string()).optional().nullable(),
  
  // Campos financieros
  ebitda_amount: z.number().min(0).optional().nullable(),
  ebitda_multiple: z.number().min(0).max(100).optional().nullable(),
  residential_clients: z.number().int().min(0).optional().nullable(),
  residential_monthly_fee: z.number().min(0).optional().nullable(),
  residential_months: z.number().int().min(1).max(120).optional().nullable(),
  business_clients: z.number().int().min(0).optional().nullable(),
  business_monthly_fee: z.number().min(0).optional().nullable(),
  business_months: z.number().int().min(1).max(120).optional().nullable(),
  
  final_valuation: z.number().min(0).optional().nullable(),
  
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
});

/**
 * Esquema de validación para configuración de reportes
 */
export const reportConfigSchema = z.object({
  valuation_id: z.string().uuid('ID de valoración inválido'),
  report_type: z.enum(['ejecutivo', 'due-diligence', 'comparativo', 'valoracion-rapida']),
  title: z.string().min(1, 'El título es requerido').max(200),
  client_name: z.string().max(200).optional(),
  content: z.record(z.any()).optional(),
  branding: z.object({
    company_name: z.string().min(1, 'El nombre de la empresa es requerido'),
    primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color inválido'),
    footer: z.string().max(500),
    logo_url: z.string().url().optional(),
  }),
});

/**
 * Esquema para datos de entrada DCF
 */
export const dcfInputSchema = z.object({
  initialCashFlow: z.number().min(0, 'El flujo de caja inicial debe ser positivo'),
  growthRate: z.number().min(0).max(100, 'Tasa de crecimiento entre 0-100%'),
  terminalGrowthRate: z.number().min(0).max(10, 'Tasa terminal entre 0-10%'),
  discountRate: z.number().min(0).max(50, 'Tasa de descuento entre 0-50%'),
  projectionYears: z.number().int().min(1).max(20, 'Años de proyección entre 1-20'),
});

/**
 * Esquema para datos de empresa en análisis de múltiplos
 */
export const companyDataSchema = z.object({
  revenue: z.number().min(0, 'Los ingresos deben ser positivos'),
  ebitda: z.number().optional(),
  netIncome: z.number().optional(),
  employees: z.number().int().min(0).optional(),
  sector: z.string().min(1, 'El sector es requerido'),
});

/**
 * Valida y sanitiza un objeto según un esquema Zod
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
  return { success: false, errors };
}

type ValidationResult<T> = { success: true; data: T } | { success: false; errors: string[] };

/**
 * Valida datos financieros y retorna errores formateados
 */
export function validateFinancialData(data: unknown): string[] {
  const result = validateData(financialDataSchema, data);
  return result.success ? [] : (result as { success: false; errors: string[] }).errors;
}

export function validateValuation(data: unknown): string[] {
  const result = validateData(valuationSchema, data);
  return result.success ? [] : (result as { success: false; errors: string[] }).errors;
}
