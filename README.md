# Sistema de Valoración de Empresas

Sistema profesional para la valoración de empresas, generación de reportes y gestión de clientes, construido con React, TypeScript, Tailwind CSS y Supabase.

## 🚀 Características Principales

### 📊 Valoraciones
- **Múltiples Métodos de Valoración**
  - EBITDA Multiple
  - Subscriber-Based (MRR/ARR)
  - Hybrid (combinación de métodos)
  
- **Calculadoras Avanzadas**
  - DCF (Discounted Cash Flow) con proyecciones
  - Análisis de Múltiplos Comparables por sector
  - Histórico de cálculos guardados

- **Gestión de Valoraciones**
  - Estados: Draft, In Progress, Completed, Archived
  - Due Diligence integrado
  - Tags y categorización

### 📄 Generación de Reportes
- **Tipos de Reportes**
  - Ejecutivo
  - Due Diligence
  - Comparativo
  - Valoración Rápida

- **Personalización**
  - Branding corporativo (logo, colores)
  - Selección de secciones
  - Exportación a PDF

- **Histórico**
  - Repositorio de reportes generados
  - Descarga de reportes anteriores

### 👥 Colaboración
- Sistema de comentarios por valoración
- Tareas colaborativas con asignación
- Notificaciones en tiempo real
- Compartir valoraciones

### 📈 Dashboard Ejecutivo
- KPIs en tiempo real
- Análisis de tendencias
- Distribución por sectores
- Alertas configurables

## 🏗️ Arquitectura

### Frontend
```
src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── valuation/      # Componentes de valoración
│   ├── reports/        # Generación de reportes
│   └── auth/           # Autenticación
├── hooks/              # Custom React hooks
├── repositories/       # Capa de acceso a datos
├── lib/                # Utilidades y validaciones
└── pages/              # Páginas principales
```

### Backend (Supabase)
```
Database:
├── valuations          # Valoraciones principales
├── valuation_comments  # Sistema de comentarios
├── valuation_tasks     # Tareas colaborativas
├── valuation_reports   # Reportes generados
├── dashboard_kpis      # Métricas del dashboard
├── sector_data         # Datos de múltiplos por sector
└── due_diligence_items # Items de due diligence

Row Level Security (RLS):
- Políticas por usuario
- Seguridad a nivel de fila
- Validaciones server-side
```

## 🛠️ Stack Tecnológico

- **Frontend Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query + Context API
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Charts**: Recharts
- **PDF Generation**: @react-pdf/renderer
- **Forms**: React Hook Form + Zod
- **Routing**: React Router v6

## 📦 Instalación

### Prerrequisitos
- Node.js 18+ 
- npm o bun
- Cuenta de Supabase

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd valuation-system
```

2. **Instalar dependencias**
```bash
npm install
# o
bun install
```

3. **Configurar variables de entorno**
```bash
# El proyecto ya incluye las credenciales de Supabase en:
# src/integrations/supabase/client.ts
```

4. **Ejecutar migraciones de base de datos**
Las migraciones se aplican automáticamente desde el dashboard de Lovable/Supabase.

5. **Iniciar servidor de desarrollo**
```bash
npm run dev
# o
bun run dev
```

El sistema estará disponible en `http://localhost:8080`

## 🗄️ Esquema de Base de Datos

### Tabla: valuations
```sql
- id: uuid (PK)
- user_id: uuid (FK -> auth.users)
- title: text
- client_name: text
- company_name: text
- valuation_type: enum ('ebitda_multiple', 'subscriber_based', 'hybrid')
- status: enum ('draft', 'in_progress', 'completed', 'archived')
- final_valuation: numeric
- dcf_results: jsonb              # Resultados de DCF
- comparable_multiples_results: jsonb  # Resultados de múltiplos
- last_dcf_calculation: timestamp
- last_multiples_calculation: timestamp
- created_at: timestamp
- updated_at: timestamp
```

### Tabla: valuation_reports
```sql
- id: uuid (PK)
- valuation_id: uuid (FK)
- report_type: enum
- title: text
- content: jsonb
- branding: jsonb
- generated_at: timestamp
- generated_by: uuid (FK)
```

## 🔐 Seguridad

### Row Level Security (RLS)
Todas las tablas principales implementan RLS:

```sql
-- Ejemplo: Solo el creador puede ver sus valoraciones
CREATE POLICY "Users can view own valuations"
ON valuations FOR SELECT
USING (auth.uid() = user_id);
```

### Validación de Datos
- Esquemas Zod para validación client-side
- Triggers de validación server-side
- Sanitización de inputs

### Autenticación
- Supabase Auth con email/password
- Sesiones seguras con JWT
- Protected routes en frontend

## 📊 Uso

### Crear una Valoración
1. Click en "Nueva Valoración"
2. Seleccionar tipo de valoración
3. Ingresar datos financieros
4. Opcionalmente usar calculadoras (DCF, Múltiplos)
5. Guardar valoración

### Generar Reporte
1. Seleccionar valoración existente
2. Elegir tipo de reporte
3. Personalizar secciones y branding
4. Generar y descargar PDF

### Usar Calculadoras
1. Dentro de una valoración, ir a pestaña "Calculadoras"
2. DCF: Ingresar flujo de caja inicial, tasas, años
3. Múltiplos: Ingresar datos de empresa y seleccionar sector
4. Guardar resultados en la valoración

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e
```

## 📈 Performance

### Optimizaciones Implementadas
- React.memo() en componentes pesados
- Lazy loading de calculadoras
- Paginación en listas largas
- Índices de base de datos
- Query optimization con React Query

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto es privado y confidencial.

## 👨‍💻 Soporte

Para soporte, contactar al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: 2024
