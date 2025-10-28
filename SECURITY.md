# Arquitectura de Seguridad

Este documento describe la arquitectura de seguridad implementada en el proyecto Capittal Valoraciones.

## Defensa en Profundidad (Defense in Depth)

Este proyecto implementa múltiples capas de seguridad para proteger los datos y operaciones:

### Capa 1: Frontend (UX)
- **Ubicación:** `src/components/auth/AdminRoute.tsx`, `src/hooks/useUserRole.ts`
- **Propósito:** Mejorar experiencia de usuario mostrando/ocultando elementos UI según roles
- **⚠️ IMPORTANTE:** NO es una barrera de seguridad - Puede bypassearse con DevTools
- **Protección:** Ninguna protección real de datos, solo UX

### Capa 2: Row Level Security (RLS) - **PRINCIPAL BARRERA**
- **Ubicación:** Políticas RLS en Supabase PostgreSQL
- **Propósito:** Bloquear acceso a datos a nivel de base de datos
- **Características:**
  - Todas las tablas críticas tienen políticas RLS habilitadas
  - Las políticas usan `auth.uid()` para validar identidad del usuario
  - **NO puede bypassearse desde el frontend** - Se ejecuta en el servidor PostgreSQL
  - Incluso con acceso directo a la API de Supabase, RLS previene acceso no autorizado

**Ejemplo de política RLS:**
```sql
CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
USING (auth.uid() = user_id);
```

### Capa 3: Funciones SECURITY DEFINER
- **Ubicación:** Funciones PostgreSQL con `SECURITY DEFINER`
- **Propósito:** Validar permisos complejos que requieren consultas a otras tablas
- **Características:**
  - `has_role_secure()` - Valida si usuario tiene rol requerido
  - `SET search_path = public` - Previene schema poisoning attacks
  - Validación de `auth.uid()` en todas las funciones administrativas
  - Se ejecutan con privilegios elevados pero de forma segura

**Ejemplo de función:**
```sql
CREATE OR REPLACE FUNCTION public.has_role_secure(
  _user_id uuid,
  _required_role text
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id
    AND role = _required_role
  );
$$;
```

### Capa 4: Edge Functions
- **Ubicación:** `supabase/functions/`
- **Propósito:** Validar permisos en operaciones administrativas y procesamiento de webhooks
- **Características:**
  - Validación con `validateUserRole()` en todas las funciones admin
  - Rate limiting en endpoints públicos
  - Sanitización de inputs con Zod
  - CORS configurado restrictivamente

**Ejemplo de validación:**
```typescript
const authResult = await validateUserRole(req, supabase, 'admin');
if (!authResult.authenticated || !authResult.hasRole) {
  return new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
```

### Capa 5: Sanitización de Errores
- **Ubicación:** `src/lib/utils.ts` - funciones `sanitizeError()` y `logError()`
- **Propósito:** Prevenir exposición de detalles técnicos al usuario
- **Características:**
  - Detecta mensajes de error técnicos (SQL, JWT, constraint violations, etc.)
  - Los reemplaza con mensajes amigables y genéricos
  - Registra errores técnicos en consola solo en desarrollo
  - En producción, `console.log` se eliminan automáticamente

**Ejemplo de uso:**
```typescript
catch (error: any) {
  logError(error, 'useAuth.signIn');
  toast.error(sanitizeError(error, 'Error al iniciar sesión'));
}
```

---

## Matriz de Acceso por Roles

| Recurso | Usuario | Advisor | Admin | Superadmin | Global Admin |
|---------|---------|---------|-------|------------|--------------|
| **Sesiones** |
| user_sessions | ✅ Propios | ✅ Propios | ✅ Org | ✅ Todos | ✅ Todos |
| user_mfa_factors | ✅ Propios | ✅ Propios | ❌ | ❌ | ❌ |
| **Valoraciones** |
| valuations | ✅ Propios | ✅ Org | ✅ Org | ✅ Todos | ✅ Todos |
| valuation_years | ✅ Propios | ✅ Org | ✅ Org | ✅ Todos | ✅ Todos |
| monthly_budgets | ✅ Propios | ✅ Org | ✅ Org | ✅ Todos | ✅ Todos |
| **Administración** |
| security_logs | ❌ | ❌ | ✅ Org | ✅ Todos | ✅ Todos |
| user_roles | ❌ | ❌ | ✅ Org | ✅ Todos | ✅ Todos |
| organizations | ❌ | ❌ | ✅ Propios | ✅ Todos | ✅ Todos |
| global_admins | ❌ | ❌ | ❌ | ❌ | ✅ Gestión |
| audit_logs | ❌ | ❌ | ✅ Org | ✅ Todos | ✅ Todos |
| **Leads y Referidos** |
| sell_business_leads | ❌ | ✅ Propios | ✅ Org | ✅ Todos | ✅ Todos |
| referred_leads | ❌ | ✅ Referrer | ✅ Org | ✅ Todos | ✅ Todos |
| commissions | ❌ | ✅ Propios | ✅ Org | ✅ Todos | ✅ Todos |

**Leyenda:**
- ✅ **Propios:** Solo sus propios registros (WHERE user_id = auth.uid())
- ✅ **Org:** Todos los registros de su organización
- ✅ **Todos:** Acceso completo a todos los registros
- ✅ **Referrer:** Solo leads que ellos refirieron
- ✅ **Gestión:** Puede crear, ver y eliminar (solo global_admins)
- ❌ **Sin acceso**

---

## Validaciones de Seguridad Implementadas

### ✅ Autenticación y Sesiones
- [x] MFA (Multi-Factor Authentication) opcional para usuarios
- [x] Detección de cambios sospechosos de IP (`detect_suspicious_ip_change`)
- [x] Gestión de sesiones activas con tracking de IP y user agent
- [x] Revocación manual de sesiones por usuario
- [x] Tokens de sesión validados con `auth.uid()` en todas las operaciones

### ✅ Rate Limiting
- [x] Endpoints públicos tienen rate limiting implementado
- [x] Prevención de brute force en login
- [x] Throttling en creación de registros

### ✅ Validación de Inputs
- [x] Schemas Zod en Edge Functions
- [x] Validación de UUIDs antes de queries
- [x] Sanitización de parámetros de búsqueda

### ✅ XSS y Injection Prevention
- [x] Sanitización de errores para prevenir exposición de stack traces
- [x] HTML escaping en componentes React
- [x] Prepared statements en todas las queries (vía Supabase client)

### ✅ SQL Injection Prevention
- [x] Todas las queries usan Supabase client (prepared statements automáticos)
- [x] RLS previene acceso incluso con SQL injection exitoso
- [x] Funciones SECURITY DEFINER con `SET search_path = public`

### ✅ Password Security
- [x] Validación de fortaleza de contraseña (8+ caracteres, mayúsculas, números)
- [x] Hashing automático por Supabase Auth (bcrypt)
- [x] ⚠️ **Pendiente:** Habilitar "Leaked Password Protection" en Supabase Dashboard

### ✅ Audit y Logging
- [x] Tabla `audit_logs` registra operaciones administrativas
- [x] Tabla `security_logs` registra eventos de seguridad (login, MFA, etc.)
- [x] Logs accesibles solo por admins y superadmins
- [x] Función `cleanup-logs` para mantener logs recientes (últimos 90 días)

---

## Vulnerabilidades Conocidas y Mitigadas

### ✅ Vulnerabilidad: Bypass de validaciones frontend
- **Estado:** Mitigado
- **Cómo:** RLS en base de datos previene acceso real a datos
- **Verificación:** Tests de seguridad en `src/tests/security/` (opcional)

### ✅ Vulnerabilidad: Exposición de stack traces
- **Estado:** Mitigado
- **Cómo:** Función `sanitizeError()` reemplaza errores técnicos con mensajes amigables
- **Verificación:** 0 instancias de `error.message` expuestas directamente

### ✅ Vulnerabilidad: Schema poisoning en funciones SECURITY DEFINER
- **Estado:** Mitigado
- **Cómo:** Todas las funciones tienen `SET search_path = public`
- **Verificación:** Query SQL confirmó 30+ funciones con search_path configurado

### ✅ Vulnerabilidad: RLS deshabilitado en tablas críticas
- **Estado:** Mitigado
- **Cómo:** RLS habilitado en todas las tablas de `public` schema
- **Verificación:** Query SQL confirmó 0 tablas sin RLS

### ⚠️ Vulnerabilidad: Tokens OTP de larga duración
- **Estado:** Pendiente mitigación manual
- **Cómo:** Reducir OTP expiry de 24h a 1h en Supabase Dashboard
- **Impacto:** Bajo - Requiere acceso al email del usuario

---

## Configuraciones Pendientes (Acción Manual Requerida)

Estas configuraciones **NO pueden automatizarse** mediante código. Requieren acceso al Dashboard de Supabase:

### 1. Reducir OTP Expiry Time
- **Ubicación:** Authentication > Providers > Email > OTP Expiration
- **Estado Actual:** 86400 segundos (24 horas)
- **Recomendado:** 3600 segundos (1 hora) o menos
- **Pasos:**
  1. Ir a https://supabase.com/dashboard/project/nbvvdaprcecaqvvkqcto/auth/providers
  2. Seleccionar "Email"
  3. Cambiar "OTP Expiration" de 86400 a 3600
  4. Guardar cambios

### 2. Habilitar Leaked Password Protection
- **Ubicación:** Authentication > Providers > Email > Password Settings
- **Estado Actual:** Deshabilitado
- **Recomendado:** Habilitado
- **Pasos:**
  1. Ir a https://supabase.com/dashboard/project/nbvvdaprcecaqvvkqcto/auth/providers
  2. Seleccionar "Email"
  3. Activar "Enable leaked password protection"
  4. Guardar cambios

### 3. Actualizar PostgreSQL Version
- **Ubicación:** Settings > Database > PostgreSQL Version
- **Estado Actual:** PostgreSQL 15.1 (vulnerable)
- **Recomendado:** PostgreSQL 15.9+ o PostgreSQL 16.x
- **⚠️ IMPORTANTE:** Esta actualización requiere:
  - Backup completo de la base de datos
  - Ventana de mantenimiento (posible downtime)
  - Coordinación con Supabase Support
- **Pasos:**
  1. Crear backup completo desde dashboard
  2. Abrir ticket en https://supabase.com/dashboard/support
  3. Solicitar upgrade de PostgreSQL
  4. Coordinar ventana de mantenimiento

---

## Testing de Seguridad

### Tests Automatizados (Opcional)
Ubicación: `src/tests/security/rls-bypass.test.ts`

```typescript
// Test: Verificar que RLS bloquea acceso no autorizado
it('should block unauthorized access to user_roles', async () => {
  await supabase.auth.signOut();
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .limit(1);
  expect(error).toBeTruthy();
  expect(data).toBeNull();
});
```

### Tests Manuales Recomendados

1. **Test de bypass de AdminRoute:**
   - Abrir DevTools
   - Modificar código para ocultar validación de rol
   - Intentar acceder a `/admin/users`
   - ✅ **Resultado esperado:** Página se carga pero sin datos (RLS bloquea queries)

2. **Test de acceso a datos de otro usuario:**
   - Crear usuario A y usuario B
   - Login con usuario A
   - Intentar query directo: `supabase.from('valuations').select('*').eq('user_id', 'USER_B_ID')`
   - ✅ **Resultado esperado:** Error de RLS o 0 resultados

3. **Test de SQL injection:**
   - Intentar inyección en campo de búsqueda: `test' OR '1'='1`
   - ✅ **Resultado esperado:** Query falla o retorna solo datos autorizados (RLS activo)

4. **Test de exposición de errores técnicos:**
   - Forzar error de base de datos (insertar duplicado, violar constraint)
   - ✅ **Resultado esperado:** Mensaje amigable como "Este registro ya existe"

---

## Contacto y Reporte de Vulnerabilidades

Si encuentras una vulnerabilidad de seguridad, por favor:

1. **NO crear issue público** en GitHub
2. Contactar directamente al equipo de seguridad: security@capittal.com
3. Incluir:
   - Descripción detallada de la vulnerabilidad
   - Pasos para reproducir
   - Impacto potencial
   - (Opcional) Sugerencias de mitigación

---

## Historial de Auditorías

| Fecha | Versión | Auditor | Hallazgos Críticos | Estado |
|-------|---------|---------|-------------------|--------|
| 2025-01-28 | v1.0 | AI Security Scan | 52 | 96% Resueltos |
| - | - | - | - | - |

---

## Checklist de Seguridad para Nuevas Features

Al agregar nuevas funcionalidades, verificar:

- [ ] ¿Requiere nueva tabla? → Habilitar RLS y crear políticas
- [ ] ¿Nueva operación administrativa? → Validar rol con `has_role_secure()`
- [ ] ¿Nueva Edge Function? → Implementar `validateUserRole()`
- [ ] ¿Manejo de errores? → Usar `sanitizeError()` y `logError()`
- [ ] ¿Nueva función SECURITY DEFINER? → Agregar `SET search_path = public`
- [ ] ¿Inputs de usuario? → Validar con Zod antes de procesar
- [ ] ¿Endpoint público? → Implementar rate limiting

---

**Última actualización:** 2025-01-28  
**Versión del documento:** 1.0
