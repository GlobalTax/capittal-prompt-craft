import { Document, Page, Text, View, StyleSheet, Image, pdf, Font } from '@react-pdf/renderer';
import { Valuation } from '@/hooks/useValuations';
import { AdvisorProfile } from '@/hooks/useAdvisorProfile';
import { ValuationYear } from '@/repositories/ValuationYearRepository';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Register default font
Font.register({
  family: 'Roboto',
  src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
});

interface PDFProps {
  valuation: Valuation;
  profile: AdvisorProfile;
  valuationYears: ValuationYear[];
}

const createStyles = (brandColor: string) => StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 11,
    color: '#333',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: brandColor,
    paddingBottom: 15,
  },
  logo: {
    width: 100,
    height: 50,
    objectFit: 'contain',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: brandColor,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  section: {
    marginTop: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: brandColor,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#555',
  },
  value: {
    width: '60%',
    color: '#333',
  },
  valoracionBox: {
    backgroundColor: brandColor,
    color: '#fff',
    padding: 15,
    borderRadius: 5,
    marginVertical: 15,
  },
  valoracionTitle: {
    fontSize: 14,
    marginBottom: 5,
    opacity: 0.9,
  },
  valoracionAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold',
  },
  tableCol: {
    flex: 1,
    fontSize: 10,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  disclaimer: {
    fontSize: 8,
    color: '#999',
    marginTop: 10,
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: brandColor,
    color: '#fff',
    padding: '4 8',
    borderRadius: 3,
    fontSize: 9,
    alignSelf: 'flex-start',
  },
});

const ValuationPDFDocument = ({ valuation, profile, valuationYears }: PDFProps) => {
  const brandColor = profile.brand_color || '#3b82f6';
  const styles = createStyles(brandColor);

  // Usar valuation_years si existen, sino usar campos legacy
  const useLegacyData = !valuationYears || valuationYears.length === 0;
  const year1Data = useLegacyData ? null : valuationYears[0];
  const year2Data = useLegacyData ? null : valuationYears[1];

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'own_business': return 'Mi Negocio';
      case 'client_business': return 'Cliente';
      case 'potential_acquisition': return 'Objetivo de Adquisición';
      default: return type;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '0 €';
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Cálculos derivados usando valuation_years o datos legacy
  const totalRevenue1 = year1Data 
    ? year1Data.revenue
    : (valuation.revenue_1 || 0) + 
      (valuation.fiscal_recurring_1 || 0) + 
      (valuation.accounting_recurring_1 || 0) + 
      (valuation.labor_recurring_1 || 0) + 
      (valuation.other_revenue_1 || 0);
  
  const totalRevenue2 = year2Data
    ? year2Data.revenue
    : (valuation.revenue_2 || 0) + 
      (valuation.fiscal_recurring_2 || 0) + 
      (valuation.accounting_recurring_2 || 0) + 
      (valuation.labor_recurring_2 || 0) + 
      (valuation.other_revenue_2 || 0);

  const personnelCosts1 = year1Data ? year1Data.personnel_costs : (valuation.personnel_costs_1 || 0);
  const personnelCosts2 = year2Data ? year2Data.personnel_costs : (valuation.personnel_costs_2 || 0);
  const otherCosts1 = year1Data ? year1Data.other_costs : (valuation.other_costs_1 || 0);
  const otherCosts2 = year2Data ? year2Data.other_costs : (valuation.other_costs_2 || 0);
  const ownerSalary1 = year1Data ? year1Data.owner_salary : (valuation.owner_salary_1 || 0);
  const ownerSalary2 = year2Data ? year2Data.owner_salary : (valuation.owner_salary_2 || 0);

  // EBITDA Ajustado: suma el sueldo del propietario de vuelta
  const ebitda1 = totalRevenue1 - personnelCosts1 - otherCosts1 + ownerSalary1;
  const ebitda2 = totalRevenue2 - personnelCosts2 - otherCosts2 + ownerSalary2;

  const avgEbitda = (ebitda1 + ebitda2) / 2;
  
  // Obtener años reales o usar valores por defecto
  const yearLabel1 = year1Data?.year || valuation.year_1 || 'Año 1';
  const yearLabel2 = year2Data?.year || valuation.year_2 || 'Año 2';
  const employees1 = year1Data ? year1Data.employees : (valuation.employees_1 || 0);
  const employees2 = year2Data ? year2Data.employees : (valuation.employees_2 || 0);
  const estimatedMultiple = 5; // Múltiplo estándar, puede ser configurable
  const estimatedValuation = avgEbitda * estimatedMultiple;

  return (
    <Document>
      {/* Portada */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {profile.logo_url && (
            <Image src={profile.logo_url} style={styles.logo} />
          )}
          <Text style={styles.title}>INFORME DE VALORACIÓN</Text>
          <Text style={styles.subtitle}>{valuation.title}</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.badge}>{getTypeLabel(valuation.valuation_type || 'own_business')}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información General</Text>
          
          {valuation.valuation_type === 'client_business' && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Cliente:</Text>
                <Text style={styles.value}>{valuation.client_name || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Empresa:</Text>
                <Text style={styles.value}>{valuation.client_company || '-'}</Text>
              </View>
              {valuation.client_email && (
                <View style={styles.row}>
                  <Text style={styles.label}>Email:</Text>
                  <Text style={styles.value}>{valuation.client_email}</Text>
                </View>
              )}
              {valuation.client_phone && (
                <View style={styles.row}>
                  <Text style={styles.label}>Teléfono:</Text>
                  <Text style={styles.value}>{valuation.client_phone}</Text>
                </View>
              )}
            </>
          )}

          {valuation.valuation_type === 'potential_acquisition' && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Empresa Objetivo:</Text>
                <Text style={styles.value}>{valuation.target_company_name || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Sector:</Text>
                <Text style={styles.value}>{valuation.target_industry || '-'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Ubicación:</Text>
                <Text style={styles.value}>{valuation.target_location || '-'}</Text>
              </View>
            </>
          )}

          <View style={styles.row}>
            <Text style={styles.label}>Fecha de Valoración:</Text>
            <Text style={styles.value}>{formatDate(valuation.created_at)}</Text>
          </View>
        </View>

        {/* Resumen de Valoración */}
        <View style={styles.valoracionBox}>
          <Text style={styles.valoracionTitle}>VALORACIÓN ESTIMADA (EBITDA x {estimatedMultiple})</Text>
          <Text style={styles.valoracionAmount}>{formatCurrency(estimatedValuation)}</Text>
        </View>

        {/* Indicadores Clave */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores Clave</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>EBITDA Ajustado Promedio:</Text>
            <Text style={styles.value}>{formatCurrency(avgEbitda)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>EBITDA Ajustado {yearLabel1}:</Text>
            <Text style={styles.value}>{formatCurrency(ebitda1)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>EBITDA Ajustado {yearLabel2}:</Text>
            <Text style={styles.value}>{formatCurrency(ebitda2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Múltiplo Aplicado:</Text>
            <Text style={styles.value}>{estimatedMultiple}x</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ingresos {yearLabel1}:</Text>
            <Text style={styles.value}>{formatCurrency(totalRevenue1)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Ingresos {yearLabel2}:</Text>
            <Text style={styles.value}>{formatCurrency(totalRevenue2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Empleados {yearLabel1}:</Text>
            <Text style={styles.value}>{employees1 || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Empleados {yearLabel2}:</Text>
            <Text style={styles.value}>{employees2 || '-'}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Elaborado por: {profile.business_name}
          </Text>
          {profile.professional_title && (
            <Text style={styles.footerText}>{profile.professional_title}</Text>
          )}
          {profile.contact_email && (
            <Text style={styles.footerText}>Email: {profile.contact_email}</Text>
          )}
          {profile.contact_phone && (
            <Text style={styles.footerText}>Teléfono: {profile.contact_phone}</Text>
          )}
          {profile.website && (
            <Text style={styles.footerText}>Web: {profile.website}</Text>
          )}
          {profile.footer_disclaimer && (
            <Text style={styles.disclaimer}>{profile.footer_disclaimer}</Text>
          )}
          <Text style={[styles.footerText, { marginTop: 10 }]}>
            Fecha de generación: {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>

      {/* Página 2: Cuenta de Resultados */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {profile.logo_url && (
            <Image src={profile.logo_url} style={styles.logo} />
          )}
          <Text style={styles.title}>CUENTA DE RESULTADOS</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado de Pérdidas y Ganancias</Text>
          
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Concepto</Text>
              <Text style={styles.tableCol}>{yearLabel1}</Text>
              <Text style={styles.tableCol}>{yearLabel2}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Ingresos Totales</Text>
              <Text style={styles.tableCol}>{formatCurrency(totalRevenue1)}</Text>
              <Text style={styles.tableCol}>{formatCurrency(totalRevenue2)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Costes de Personal</Text>
              <Text style={styles.tableCol}>{formatCurrency(personnelCosts1)}</Text>
              <Text style={styles.tableCol}>{formatCurrency(personnelCosts2)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Otros Costes</Text>
              <Text style={styles.tableCol}>{formatCurrency(otherCosts1)}</Text>
              <Text style={styles.tableCol}>{formatCurrency(otherCosts2)}</Text>
            </View>

            <View style={styles.tableRow}>
              <Text style={[styles.tableCol, { flex: 2 }]}>Salario del Propietario</Text>
              <Text style={styles.tableCol}>{formatCurrency(ownerSalary1)}</Text>
              <Text style={styles.tableCol}>{formatCurrency(ownerSalary2)}</Text>
            </View>

            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCol, { flex: 2 }]}>EBITDA Ajustado</Text>
              <Text style={styles.tableCol}>{formatCurrency(ebitda1)}</Text>
              <Text style={styles.tableCol}>{formatCurrency(ebitda2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {profile.business_name} - Página 2
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export async function generateValuationPDF(valuation: Valuation, profile: AdvisorProfile, valuationYears: ValuationYear[] = []) {
  const blob = await pdf(<ValuationPDFDocument valuation={valuation} profile={profile} valuationYears={valuationYears} />).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `valoracion-${valuation.title.replace(/\s+/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function previewValuationPDF(valuation: Valuation, profile: AdvisorProfile, valuationYears: ValuationYear[] = []) {
  const blob = await pdf(<ValuationPDFDocument valuation={valuation} profile={profile} valuationYears={valuationYears} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Note: We don't revoke the URL immediately since the window needs it
}
