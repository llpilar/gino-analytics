import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { 
  WhiteboardBoard, 
  WhiteboardCard,
  useWhiteboardColumns, 
  useWhiteboardCards 
} from '@/hooks/useWhiteboard';
import { KanbanColumn } from './KanbanColumn';
import { CardEditDialog } from './CardEditDialog';

interface KanbanBoardProps {
  board: WhiteboardBoard;
  onBack: () => void;
}

export const KanbanBoard = ({ board, onBack }: KanbanBoardProps) => {
  const { columns, createColumn, updateColumn, deleteColumn } = useWhiteboardColumns(board.id);
  const { cards, createCard, updateCard, deleteCard, moveCard } = useWhiteboardCards(board.id);
  
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingCard, setEditingCard] = useState<WhiteboardCard | null>(null);
  const [draggedCard, setDraggedCard] = useState<WhiteboardCard | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg"
            style={{ backgroundColor: board.background_color || '#1a1a2e' }}
          />
          <div>
            <h1 className="text-xl font-bold">{board.title}</h1>
            {board.description && (
              <p className="text-sm text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex-1 overflow-x-auto">
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
      </div>

      {/* Card Edit Dialog */}
      <CardEditDialog
        card={editingCard}
        open={!!editingCard}
        onClose={() => setEditingCard(null)}
        onSave={(card) => updateCard.mutate(card)}
      />
    </div>
  );
};
