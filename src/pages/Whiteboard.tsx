import { useState } from 'react';
import { DashboardWrapper } from '@/components/DashboardWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  LayoutGrid, 
  Search,
  Users,
  Lock,
  Loader2
} from 'lucide-react';
import { useWhiteboardBoards, WhiteboardBoard } from '@/hooks/useWhiteboard';
import { BoardCard } from '@/components/whiteboard/BoardCard';
import { BoardEditDialog } from '@/components/whiteboard/BoardEditDialog';
import { KanbanBoard } from '@/components/whiteboard/KanbanBoard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const Whiteboard = () => {
  const { boards, isLoading, createBoard, updateBoard, deleteBoard } = useWhiteboardBoards();
  
  const [selectedBoard, setSelectedBoard] = useState<WhiteboardBoard | null>(null);
  const [editingBoard, setEditingBoard] = useState<WhiteboardBoard | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'personal' | 'shared'>('all');
  
  // Create board form
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardShared, setNewBoardShared] = useState(false);

  const handleCreateBoard = () => {
    if (newBoardTitle.trim()) {
      createBoard.mutate({
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || undefined,
        is_shared: newBoardShared,
      });
      setNewBoardTitle('');
      setNewBoardDescription('');
      setNewBoardShared(false);
      setIsCreateDialogOpen(false);
    }
  };

  const filteredBoards = boards?.filter(board => {
    const matchesSearch = board.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          board.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'personal') return matchesSearch && !board.is_shared;
    if (filter === 'shared') return matchesSearch && board.is_shared;
    return matchesSearch;
  });

  // If a board is selected, show the Kanban view
  if (selectedBoard) {
    return (
      <DashboardWrapper>
        <div className="p-4 md:p-6 lg:p-8 h-[calc(100vh-64px)]">
          <KanbanBoard 
            board={selectedBoard} 
            onBack={() => setSelectedBoard(null)} 
          />
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Whiteboard</h1>
              <p className="text-sm text-muted-foreground">
                Organize tarefas e ideias com seu time
              </p>
            </div>
          </div>
          
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Board
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="personal" className="gap-1.5">
                <Lock className="w-3 h-3" />
                Pessoais
              </TabsTrigger>
              <TabsTrigger value="shared" className="gap-1.5">
                <Users className="w-3 h-3" />
                Compartilhados
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Boards Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredBoards?.length === 0 ? (
          <div className="text-center py-12">
            <LayoutGrid className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum board encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'Tente uma busca diferente' : 'Crie seu primeiro board para começar'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Board
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredBoards?.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onSelect={setSelectedBoard}
                onEdit={setEditingBoard}
                onDelete={(id) => deleteBoard.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Create Board Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Board</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome do Board</Label>
                <Input
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Ex: Sprint Planning, Ideias de Marketing..."
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Descreva o propósito deste board..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label className="cursor-pointer">Compartilhar com Time</Label>
                  <p className="text-xs text-muted-foreground">
                    Todos os usuários poderão ver e editar
                  </p>
                </div>
                <Switch checked={newBoardShared} onCheckedChange={setNewBoardShared} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)} 
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateBoard} 
                  className="flex-1"
                  disabled={!newBoardTitle.trim()}
                >
                  Criar Board
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Board Dialog */}
        <BoardEditDialog
          board={editingBoard}
          open={!!editingBoard}
          onClose={() => setEditingBoard(null)}
          onSave={(board) => updateBoard.mutate(board)}
        />
      </div>
    </DashboardWrapper>
  );
};

export default Whiteboard;
