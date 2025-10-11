import { useState, useEffect } from 'react';
import { collaborationRepository, ValuationComment, ValuationTask } from '@/repositories/CollaborationRepository';
import { useToast } from '@/hooks/use-toast';

export function useValuationCollaboration(valuationId: string | undefined, userId: string | undefined) {
  const [comments, setComments] = useState<ValuationComment[]>([]);
  const [tasks, setTasks] = useState<ValuationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (valuationId) {
      fetchData();
    }
  }, [valuationId]);

  const fetchData = async () => {
    if (!valuationId) return;
    
    try {
      setLoading(true);
      const [commentsData, tasksData] = await Promise.all([
        collaborationRepository.getComments(valuationId),
        collaborationRepository.getTasks(valuationId)
      ]);
      setComments(commentsData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error fetching collaboration data:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de colaboración',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (content: string, section?: string) => {
    if (!valuationId || !userId) return;

    try {
      const newComment = await collaborationRepository.createComment({
        valuation_id: valuationId,
        author_id: userId,
        content,
        section: section || null,
        comment_type: 'general'
      });
      setComments(prev => [newComment, ...prev]);
      toast({
        title: 'Comentario añadido',
        description: 'El comentario se ha guardado correctamente',
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'Error',
        description: 'No se pudo añadir el comentario',
        variant: 'destructive',
      });
    }
  };

  const addTask = async (title: string, priority: string, dueDate?: string) => {
    if (!valuationId) return;

    try {
      const newTask = await collaborationRepository.createTask({
        valuation_id: valuationId,
        title,
        priority,
        status: 'pending',
        due_date: dueDate || null,
        assignee_id: userId || null
      });
      setTasks(prev => [...prev, newTask]);
      toast({
        title: 'Tarea creada',
        description: 'La tarea se ha creado correctamente',
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la tarea',
        variant: 'destructive',
      });
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await collaborationRepository.updateTaskStatus(taskId, status);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status } : task
      ));
      toast({
        title: 'Tarea actualizada',
        description: 'El estado de la tarea se ha actualizado',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la tarea',
        variant: 'destructive',
      });
    }
  };

  return {
    comments,
    tasks,
    loading,
    addComment,
    addTask,
    updateTaskStatus,
    refetch: fetchData,
  };
}
