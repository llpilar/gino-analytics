import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Trash2, Edit, X, Check } from 'lucide-react';
import { WhiteboardColumn, WhiteboardCard } from '@/hooks/useWhiteboard';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: WhiteboardColumn;
  cards: WhiteboardCard[];
  onAddCard: (columnId: string, title: string) => void;
  onEditCard: (card: WhiteboardCard) => void;
  onDeleteCard: (id: string) => void;
  onUpdateColumn: (id: string, title: string) => void;
  onDeleteColumn: (id: string) => void;
  onDragStart: (card: WhiteboardCard) => void;
  onDragOver: (e: React.DragEvent, columnId: string) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  isDragOver: boolean;
}

export const KanbanColumn = ({
  column,
  cards,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onUpdateColumn,
  onDeleteColumn,
  onDragStart,
  onDragOver,
  onDrop,
  isDragOver,
}: KanbanColumnProps) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);

  const handleAddCard = () => {
    if (newCardTitle.trim()) {
      onAddCard(column.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    }
  };

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateColumn(column.id, editedTitle.trim());
      setIsEditingTitle(false);
    }
  };

  const columnCards = cards.filter(c => c.column_id === column.id).sort((a, b) => a.position - b.position);

  return (
    <div
      className={cn(
        "flex flex-col w-72 min-w-[18rem] bg-card/30 backdrop-blur-sm rounded-xl border transition-all duration-200",
        isDragOver ? "border-primary bg-primary/5" : "border-border"
      )}
      onDragOver={(e) => onDragOver(e, column.id)}
      onDrop={(e) => onDrop(e, column.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2 flex-1">
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: column.color || '#3b82f6' }}
          />
          
          {isEditingTitle ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              />
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSaveTitle}>
                <Check className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setIsEditingTitle(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className="font-medium text-sm">{column.title}</span>
          )}
          
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {columnCards.length}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsEditingTitle(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Renomear
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteColumn(column.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[calc(100vh-300px)]">
        {columnCards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            onEdit={onEditCard}
            onDelete={onDeleteCard}
            onDragStart={onDragStart}
          />
        ))}
        
        {/* Add Card Form */}
        {isAddingCard ? (
          <div className="p-2 bg-background/50 rounded-lg border space-y-2">
            <Input
              placeholder="Título do card..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAddCard()}
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddCard} className="flex-1">
                Adicionar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingCard(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar card
          </Button>
        )}
      </div>
    </div>
  );
};
