import { supabase } from '@/integrations/supabase/client';

export interface ValuationReport {
  id: string;
  valuation_id: string;
  report_type: 'ejecutivo' | 'due-diligence' | 'comparativo' | 'valoracion-rapida';
  title: string;
  client_name?: string;
  content: any;
  branding: {
    company_name: string;
    primary_color: string;
    footer: string;
    logo_url?: string;
  };
  generated_at: string;
  generated_by: string;
}

export class ReportRepository {
  async getReports(userId: string): Promise<ValuationReport[]> {
    const { data, error } = await supabase
      .from('valuation_reports')
      .select('*')
      .eq('generated_by', userId)
      .order('generated_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as ValuationReport[];
  }

  async getReportsByValuation(valuationId: string): Promise<ValuationReport[]> {
    const { data, error } = await supabase
      .from('valuation_reports')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('generated_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as ValuationReport[];
  }

  async createReport(report: Partial<ValuationReport>): Promise<ValuationReport> {
    const { data, error } = await supabase
      .from('valuation_reports')
      .insert([report as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as ValuationReport;
  }

  async deleteReport(reportId: string): Promise<void> {
    const { error } = await supabase
      .from('valuation_reports')
      .delete()
      .eq('id', reportId);
    
    if (error) throw new Error(error.message);
  }
}

export const reportRepository = new ReportRepository();
