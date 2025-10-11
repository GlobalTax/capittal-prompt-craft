import { supabase } from '@/integrations/supabase/client';

export interface ValuationComment {
  id: string;
  valuation_id: string;
  author_id: string;
  content: string;
  section: string | null;
  comment_type: string;
  created_at: string;
  updated_at: string;
}

export interface ValuationTask {
  id: string;
  valuation_id: string;
  title: string;
  assignee_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export class CollaborationRepository {
  async getComments(valuationId: string): Promise<ValuationComment[]> {
    const { data, error } = await supabase
      .from('valuation_comments')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data as ValuationComment[];
  }

  async createComment(comment: Partial<ValuationComment>): Promise<ValuationComment> {
    const { data, error } = await supabase
      .from('valuation_comments')
      .insert([comment as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as ValuationComment;
  }

  async updateComment(id: string, content: string): Promise<void> {
    const { error } = await supabase
      .from('valuation_comments')
      .update({ content })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await supabase
      .from('valuation_comments')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }

  async getTasks(valuationId: string): Promise<ValuationTask[]> {
    const { data, error } = await supabase
      .from('valuation_tasks')
      .select('*')
      .eq('valuation_id', valuationId)
      .order('due_date', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data as ValuationTask[];
  }

  async createTask(task: Partial<ValuationTask>): Promise<ValuationTask> {
    const { data, error } = await supabase
      .from('valuation_tasks')
      .insert([task as any])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as ValuationTask;
  }

  async updateTaskStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('valuation_tasks')
      .update({ status })
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('valuation_tasks')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(error.message);
  }
}

export const collaborationRepository = new CollaborationRepository();
