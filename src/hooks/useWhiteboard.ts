import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface WhiteboardBoard {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_shared: boolean;
  background_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhiteboardColumn {
  id: string;
  board_id: string;
  title: string;
  color: string | null;
  position: number;
  created_at: string;
}

export interface WhiteboardCard {
  id: string;
  column_id: string;
  board_id: string;
  title: string;
  content: string | null;
  color: string | null;
  tags: string[];
  position: number;
  created_by: string;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useWhiteboardBoards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: boards, isLoading } = useQuery({
    queryKey: ['whiteboard-boards', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whiteboard_boards')
        .select('*')
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as WhiteboardBoard[];
    },
    enabled: !!user,
  });

  const createBoard = useMutation({
    mutationFn: async (board: { title: string; description?: string; is_shared?: boolean }) => {
      const { data, error } = await supabase
        .from('whiteboard_boards')
        .insert({
          user_id: user!.id,
          title: board.title,
          description: board.description || null,
          is_shared: board.is_shared || false,
        })
        .select()
        .single();
      
      if (error) throw error;

      // Create default columns
      const defaultColumns = [
        { board_id: data.id, title: 'A Fazer', color: '#ef4444', position: 0 },
        { board_id: data.id, title: 'Em Progresso', color: '#f59e0b', position: 1 },
        { board_id: data.id, title: 'Concluído', color: '#22c55e', position: 2 },
      ];

      await supabase.from('whiteboard_columns').insert(defaultColumns);

      return data as WhiteboardBoard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-boards'] });
      toast.success('Board criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar board: ' + error.message);
    },
  });

  const updateBoard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhiteboardBoard> & { id: string }) => {
      const { data, error } = await supabase
        .from('whiteboard_boards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as WhiteboardBoard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-boards'] });
    },
  });

  const deleteBoard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whiteboard_boards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-boards'] });
      toast.success('Board excluído!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir board: ' + error.message);
    },
  });

  return { boards, isLoading, createBoard, updateBoard, deleteBoard };
};

export const useWhiteboardColumns = (boardId: string | null) => {
  const queryClient = useQueryClient();

  const { data: columns, isLoading } = useQuery({
    queryKey: ['whiteboard-columns', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whiteboard_columns')
        .select('*')
        .eq('board_id', boardId!)
        .order('position');
      
      if (error) throw error;
      return data as WhiteboardColumn[];
    },
    enabled: !!boardId,
  });

  const createColumn = useMutation({
    mutationFn: async (column: { title: string; color?: string }) => {
      const maxPosition = columns?.reduce((max, col) => Math.max(max, col.position), -1) ?? -1;
      
      const { data, error } = await supabase
        .from('whiteboard_columns')
        .insert({
          board_id: boardId!,
          title: column.title,
          color: column.color || '#3b82f6',
          position: maxPosition + 1,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as WhiteboardColumn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-columns', boardId] });
    },
  });

  const updateColumn = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhiteboardColumn> & { id: string }) => {
      const { data, error } = await supabase
        .from('whiteboard_columns')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as WhiteboardColumn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-columns', boardId] });
    },
  });

  const deleteColumn = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whiteboard_columns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-columns', boardId] });
      toast.success('Coluna excluída!');
    },
  });

  return { columns, isLoading, createColumn, updateColumn, deleteColumn };
};

export const useWhiteboardCards = (boardId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cards, isLoading } = useQuery({
    queryKey: ['whiteboard-cards', boardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whiteboard_cards')
        .select('*')
        .eq('board_id', boardId!)
        .order('position');
      
      if (error) throw error;
      return data as WhiteboardCard[];
    },
    enabled: !!boardId,
  });

  const createCard = useMutation({
    mutationFn: async (card: { column_id: string; title: string; content?: string; color?: string; tags?: string[] }) => {
      const columnCards = cards?.filter(c => c.column_id === card.column_id) || [];
      const maxPosition = columnCards.reduce((max, c) => Math.max(max, c.position), -1);
      
      const { data, error } = await supabase
        .from('whiteboard_cards')
        .insert({
          board_id: boardId!,
          column_id: card.column_id,
          title: card.title,
          content: card.content || null,
          color: card.color || '#fbbf24',
          tags: card.tags || [],
          position: maxPosition + 1,
          created_by: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as WhiteboardCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-cards', boardId] });
    },
  });

  const updateCard = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WhiteboardCard> & { id: string }) => {
      const { data, error } = await supabase
        .from('whiteboard_cards')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as WhiteboardCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-cards', boardId] });
    },
  });

  const deleteCard = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whiteboard_cards')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-cards', boardId] });
    },
  });

  const moveCard = useMutation({
    mutationFn: async ({ cardId, newColumnId, newPosition }: { cardId: string; newColumnId: string; newPosition: number }) => {
      const { data, error } = await supabase
        .from('whiteboard_cards')
        .update({ column_id: newColumnId, position: newPosition })
        .eq('id', cardId)
        .select()
        .single();
      
      if (error) throw error;
      return data as WhiteboardCard;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whiteboard-cards', boardId] });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!boardId) return;

    const channel = supabase
      .channel(`whiteboard-cards-${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whiteboard_cards',
          filter: `board_id=eq.${boardId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['whiteboard-cards', boardId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [boardId, queryClient]);

  return { cards, isLoading, createCard, updateCard, deleteCard, moveCard };
};
