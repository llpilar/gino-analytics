import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WhiteboardBoard } from '@/hooks/useWhiteboard';
import { cn } from '@/lib/utils';

interface BoardEditDialogProps {
  board: WhiteboardBoard | null;
  open: boolean;
  onClose: () => void;
  onSave: (board: Partial<WhiteboardBoard> & { id: string }) => void;
}

const BOARD_COLORS = [
  '#1a1a2e',
  '#16213e',
  '#1b4332',
  '#3c1642',
  '#4a1c40',
  '#1d3557',
  '#2d3436',
  '#1e1e1e',
];

export const BoardEditDialog = ({ board, open, onClose, onSave }: BoardEditDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');

  useEffect(() => {
    if (board) {
      setTitle(board.title);
      setDescription(board.description || '');
      setIsShared(board.is_shared);
      setBackgroundColor(board.background_color || '#1a1a2e');
    }
  }, [board]);

  const handleSave = () => {
    if (!board || !title.trim()) return;
    
    onSave({
      id: board.id,
      title: title.trim(),
      description: description.trim() || null,
      is_shared: isShared,
      background_color: backgroundColor,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Board</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Board</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do board"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o propósito deste board..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor de Fundo</Label>
            <div className="flex gap-2">
              {BOARD_COLORS.map((color) => (
                <button
                  key={color}
                  className={cn(
                    "w-8 h-8 rounded-lg transition-all border border-border",
                    backgroundColor === color ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setBackgroundColor(color)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label className="cursor-pointer">Compartilhar com Time</Label>
              <p className="text-xs text-muted-foreground">
                Todos os usuários poderão ver e editar este board
              </p>
            </div>
            <Switch checked={isShared} onCheckedChange={setIsShared} />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
