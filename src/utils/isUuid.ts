/**
 * Valida si una cadena tiene formato UUID v4 válido
 * @param v - String a validar
 * @returns true si es un UUID válido, false en caso contrario
 */
export const isUuid = (v: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
