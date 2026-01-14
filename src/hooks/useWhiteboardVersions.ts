import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WhiteboardVersion {
  id: string;
  board_id: string;
  version_number: number;
  drawing_data: string;
  created_by: string;
  created_at: string;
  description: string | null;
}

export function useWhiteboardVersions(boardId: string) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<WhiteboardVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    if (!boardId) return;
    
    try {
      const { data, error } = await supabase
        .from('whiteboard_versions')
        .select('*')
        .eq('board_id', boardId)
        .order('version_number', { ascending: false })
        .limit(50);

      if (error) throw error;
      setVersions(data || []);
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [boardId]);

  // Save new version
  const saveVersion = useCallback(async (drawingData: string, description?: string) => {
    if (!boardId || !user) return null;
    
    setIsSaving(true);
    try {
      // Get next version number
      const nextVersion = versions.length > 0 
        ? Math.max(...versions.map(v => v.version_number)) + 1 
        : 1;

      const { data, error } = await supabase
        .from('whiteboard_versions')
        .insert({
          board_id: boardId,
          version_number: nextVersion,
          drawing_data: drawingData,
          created_by: user.id,
          description: description || `Versão ${nextVersion}`
        })
        .select()
        .single();

      if (error) throw error;

      setVersions(prev => [data, ...prev]);
      toast.success(`Versão ${nextVersion} salva com sucesso!`);
      return data;
    } catch (error) {
      console.error('Error saving version:', error);
      toast.error('Erro ao salvar versão');
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [boardId, user, versions]);

  // Restore version
  const restoreVersion = useCallback(async (versionId: string): Promise<string | null> => {
    try {
      const version = versions.find(v => v.id === versionId);
      if (!version) {
        toast.error('Versão não encontrada');
        return null;
      }

      toast.success(`Versão ${version.version_number} restaurada!`);
      return version.drawing_data;
    } catch (error) {
      console.error('Error restoring version:', error);
      toast.error('Erro ao restaurar versão');
      return null;
    }
  }, [versions]);

  // Delete version
  const deleteVersion = useCallback(async (versionId: string) => {
    try {
      const { error } = await supabase
        .from('whiteboard_versions')
        .delete()
        .eq('id', versionId);

      if (error) throw error;

      setVersions(prev => prev.filter(v => v.id !== versionId));
      toast.success('Versão excluída');
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Erro ao excluir versão');
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`versions-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whiteboard_versions',
          filter: `board_id=eq.${boardId}`
        },
        () => {
          fetchVersions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, fetchVersions]);

  return {
    versions,
    isLoading,
    isSaving,
    saveVersion,
    restoreVersion,
    deleteVersion,
    refetch: fetchVersions
  };
}
