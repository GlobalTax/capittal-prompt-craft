import { supabase } from '@/integrations/supabase/client';

export interface SectorMultiples {
  id: string;
  sector_code: string;
  sector_name: string;
  revenue_multiple_min: number;
  revenue_multiple_avg: number;
  revenue_multiple_max: number;
  ebitda_multiple_min: number;
  ebitda_multiple_avg: number;
  ebitda_multiple_max: number;
  pe_ratio_min: number;
  pe_ratio_avg: number;
  pe_ratio_max: number;
}

export class SectorDataRepository {
  async findAll(): Promise<SectorMultiples[]> {
    const { data, error } = await supabase
      .from('sector_multiples')
      .select('*')
      .order('sector_name');
    
    if (error) throw new Error(error.message);
    return data as SectorMultiples[];
  }
  
  async findBySectorCode(code: string): Promise<SectorMultiples | null> {
    const { data, error } = await supabase
      .from('sector_multiples')
      .select('*')
      .eq('sector_code', code)
      .maybeSingle();
    
    if (error) throw new Error(error.message);
    return data as SectorMultiples | null;
  }
}

export const sectorDataRepository = new SectorDataRepository();
