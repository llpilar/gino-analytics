import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users, 
  Lock,
  LayoutGrid
} from 'lucide-react';
import { WhiteboardBoard } from '@/hooks/useWhiteboard';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BoardCardProps {
  board: WhiteboardBoard;
  onSelect: (board: WhiteboardBoard) => void;
  onEdit: (board: WhiteboardBoard) => void;
  onDelete: (id: string) => void;
}

export const BoardCard = ({ board, onSelect, onEdit, onDelete }: BoardCardProps) => {
  return (
    <Card 
      className="group cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/50 backdrop-blur-sm"
      onClick={() => onSelect(board)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: board.background_color || '#1a1a2e' }}
            >
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base font-medium line-clamp-1">
                {board.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Atualizado {formatDistanceToNow(new Date(board.updated_at), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(board); }}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(board.id); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="pt-2">
        {board.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {board.description}
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <Badge variant={board.is_shared ? 'default' : 'secondary'} className="text-xs">
            {board.is_shared ? (
              <>
                <Users className="w-3 h-3 mr-1" />
                Compartilhado
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 mr-1" />
                Pessoal
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
