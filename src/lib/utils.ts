import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitiza errores para prevenir exposición de detalles técnicos
 * @param error - Error original
 * @param userMessage - Mensaje amigable opcional para el usuario
 * @returns Mensaje sanitizado seguro para mostrar
 */
export const sanitizeError = (error: any, userMessage?: string): string => {
  // Si hay un mensaje personalizado, usarlo
  if (userMessage) return userMessage;

  // Extraer mensaje del error
  const errorMessage = error?.message || error?.toString() || 'Error desconocido';

  // Lista de patrones que indican errores técnicos que NO deben mostrarse
  const technicalPatterns = [
    /database/i,
    /sql/i,
    /postgres/i,
    /supabase/i,
    /row.*security/i,
    /rls/i,
    /constraint/i,
    /foreign key/i,
    /unique/i,
    /null value/i,
    /column.*does not exist/i,
    /table.*does not exist/i,
    /function.*does not exist/i,
    /permission denied/i,
    /violates/i,
    /duplicate key/i,
    /syntax error/i,
    /invalid input/i,
    /relation.*does not exist/i,
    /schema.*does not exist/i,
    /JWT/i,
    /token/i,
    /authentication/i,
    /authorization/i,
  ];

  // Si el mensaje contiene patrones técnicos, devolver mensaje genérico
  const isTechnical = technicalPatterns.some(pattern => pattern.test(errorMessage));
  
  if (isTechnical) {
    // Mapear algunos errores comunes a mensajes amigables
    if (/authentication|jwt|token/i.test(errorMessage)) {
      return 'Sesión expirada. Por favor, inicia sesión nuevamente.';
    }
    if (/permission|authorization|security/i.test(errorMessage)) {
      return 'No tienes permisos para realizar esta acción.';
    }
    if (/duplicate key|unique/i.test(errorMessage)) {
      return 'Este registro ya existe en el sistema.';
    }
    if (/foreign key|constraint/i.test(errorMessage)) {
      return 'No se puede completar la operación debido a dependencias existentes.';
    }
    if (/null value/i.test(errorMessage)) {
      return 'Faltan datos requeridos para completar la operación.';
    }
    
    // Mensaje genérico para otros errores técnicos
    return 'Ha ocurrido un error. Por favor, intenta nuevamente o contacta con soporte.';
  }

  // Si el mensaje NO es técnico, permitir mostrarlo
  return errorMessage;
};

/**
 * Registra errores en consola solo en desarrollo
 * @param error - Error a registrar
 * @param context - Contexto adicional del error
 */
export const logError = (error: any, context?: string) => {
  if (import.meta.env.DEV) {
    console.error(context ? `[${context}]` : '[Error]', error);
  }
};
