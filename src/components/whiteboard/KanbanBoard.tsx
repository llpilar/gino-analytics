import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, X, LayoutList, Pencil, Star } from 'lucide-react';
import { 
  WhiteboardBoard, 
  WhiteboardCard,
  useWhiteboardColumns, 
  useWhiteboardCards 
} from '@/hooks/useWhiteboard';
import { KanbanColumn } from './KanbanColumn';
import { CardEditDialog } from './CardEditDialog';
import { InfiniteCanvas } from './InfiniteCanvas';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KanbanBoardProps {
  board: WhiteboardBoard;
  onBack: () => void;
}

export const KanbanBoard = ({ board, onBack }: KanbanBoardProps) => {
  const { columns, createColumn, updateColumn, deleteColumn } = useWhiteboardColumns(board.id);
  const { cards, createCard, updateCard, deleteCard, moveCard } = useWhiteboardCards(board.id);
  
  const [mode, setMode] = useState<'kanban' | 'draw'>('draw');
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingCard, setEditingCard] = useState<WhiteboardCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<WhiteboardCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [drawingData, setDrawingData] = useState<string | undefined>();
  const [drawingId, setDrawingId] = useState<string | null>(null);

  // Load existing drawing data
  useEffect(() => {
    const loadDrawing = async () => {
      const { data, error } = await supabase
        .from('whiteboard_drawings')
        .select('*')
        .eq('board_id', board.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data && !error) {
        setDrawingData(data.drawing_data);
        setDrawingId(data.id);
      }
    };
    
    loadDrawing();
  }, [board.id]);

  const handleSaveDrawing = async (data: string) => {
    try {
      if (drawingId) {
        const { error } = await supabase
          .from('whiteboard_drawings')
          .update({ drawing_data: data })
          .eq('id', drawingId);
        
        if (error) throw error;
      } else {
        const { data: newDrawing, error } = await supabase
          .from('whiteboard_drawings')
          .insert({
            board_id: board.id,
            drawing_data: data,
          })
          .select()
          .single();
        
        if (error) throw error;
        if (newDrawing) setDrawingId(newDrawing.id);
      }
      
      toast.success('Salvo!');
    } catch (error) {
      console.error('Error saving drawing:', error);
      toast.error('Erro ao salvar');
    }
  };

  const handleAddColumn = () => {
    if (newColumnTitle.trim()) {
      createColumn.mutate({ title: newColumnTitle.trim() });
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleAddCard = (columnId: string, title: string) => {
    createCard.mutate({ column_id: columnId, title });
  };

  const handleDragStart = (card: WhiteboardCard) => {
    setDraggedCard(card);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedCard && draggedCard.column_id !== columnId) {
      const columnCards = cards?.filter(c => c.column_id === columnId) || [];
      const maxPosition = columnCards.reduce((max, c) => Math.max(max, c.position), -1);
      
      moveCard.mutate({
        cardId: draggedCard.id,
        newColumnId: columnId,
        newPosition: maxPosition + 1,
      });
    }
    setDraggedCard(null);
    setDragOverColumn(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">{board.title}</h1>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Star className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mode Toggle */}
        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="draw" className="gap-1.5 text-xs">
              <Pencil className="w-3.5 h-3.5" />
              Canvas
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5 text-xs">
              <LayoutList className="w-3.5 h-3.5" />
              Kanban
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on mode */}
      {mode === 'draw' ? (
        <div className="flex-1 min-h-0">
          <InfiniteCanvas 
            initialData={drawingData} 
            onSave={handleSaveDrawing}
            boardTitle={board.title}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto p-4">
          <div className="flex gap-4 pb-4 min-h-full">
            {columns?.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={cards || []}
                onAddCard={handleAddCard}
                onEditCard={setEditingCard}
                onDeleteCard={(id) => deleteCard.mutate(id)}
                onUpdateColumn={(id, title) => updateColumn.mutate({ id, title })}
                onDeleteColumn={(id) => deleteColumn.mutate(id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDragOver={dragOverColumn === column.id}
              />
            ))}

            {/* Add Column */}
            <div className="w-72 min-w-[18rem] flex-shrink-0">
              {isAddingColumn ? (
                <div className="p-3 bg-card/30 backdrop-blur-sm rounded-xl border space-y-2">
                  <Input
                    placeholder="Nome da coluna..."
                    value={newColumnTitle}
                    onChange={(e) => setNewColumnTitle(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddColumn} className="flex-1">
                      Adicionar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingColumn(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-12 border-dashed"
                  onClick={() => setIsAddingColumn(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Coluna
                </Button>
              )}
            </div>
          </div>

          {/* Card Edit Dialog */}
          <CardEditDialog
            card={editingCard}
            open={!!editingCard}
            onClose={() => setEditingCard(null)}
            onSave={(card) => updateCard.mutate(card)}
          />
        </div>
      )}
    </div>
  );
};
