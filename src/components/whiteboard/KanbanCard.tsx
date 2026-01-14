import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreHorizontal, 
  Trash2, 
  Edit, 
  Calendar,
  GripVertical
} from 'lucide-react';
import { WhiteboardCard } from '@/hooks/useWhiteboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KanbanCardProps {
  card: WhiteboardCard;
  onEdit: (card: WhiteboardCard) => void;
  onDelete: (id: string) => void;
  onDragStart: (card: WhiteboardCard) => void;
}

const CARD_COLORS: Record<string, { bg: string; border: string }> = {
  '#fbbf24': { bg: 'bg-amber-500/20', border: 'border-amber-500/30' },
  '#22c55e': { bg: 'bg-green-500/20', border: 'border-green-500/30' },
  '#3b82f6': { bg: 'bg-blue-500/20', border: 'border-blue-500/30' },
  '#ef4444': { bg: 'bg-red-500/20', border: 'border-red-500/30' },
  '#a855f7': { bg: 'bg-purple-500/20', border: 'border-purple-500/30' },
  '#ec4899': { bg: 'bg-pink-500/20', border: 'border-pink-500/30' },
  '#14b8a6': { bg: 'bg-teal-500/20', border: 'border-teal-500/30' },
};

export const KanbanCard = ({ card, onEdit, onDelete, onDragStart }: KanbanCardProps) => {
  const colorStyle = CARD_COLORS[card.color || '#fbbf24'] || CARD_COLORS['#fbbf24'];
  
  return (
    <Card
      draggable
      onDragStart={() => onDragStart(card)}
      className={`group cursor-grab active:cursor-grabbing p-3 ${colorStyle.bg} ${colorStyle.border} border hover:shadow-lg transition-all duration-200`}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">{card.title}</h4>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(card)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(card.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {card.content && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
              {card.content}
            </p>
          )}
          
          <div className="flex flex-wrap items-center gap-1 mt-2">
            {card.tags?.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {card.tags && card.tags.length > 3 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                +{card.tags.length - 3}
              </Badge>
            )}
          </div>
          
          {card.due_date && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {format(new Date(card.due_date), 'dd MMM', { locale: ptBR })}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
