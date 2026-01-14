import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { History, RotateCcw, Trash2, Clock, Save, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useWhiteboardVersions, WhiteboardVersion } from '@/hooks/useWhiteboardVersions';
import { cn } from '@/lib/utils';

interface VersionHistoryPanelProps {
  boardId: string;
  currentData: string;
  onRestore: (data: string) => void;
}

export function VersionHistoryPanel({ boardId, currentData, onRestore }: VersionHistoryPanelProps) {
  const { versions, isLoading, isSaving, saveVersion, restoreVersion, deleteVersion } = useWhiteboardVersions(boardId);
  const [isOpen, setIsOpen] = useState(false);
  const [versionDescription, setVersionDescription] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<WhiteboardVersion | null>(null);

  const handleSaveVersion = async () => {
    if (!currentData) return;
    await saveVersion(currentData, versionDescription || undefined);
    setVersionDescription('');
  };

  const handleRestore = async (version: WhiteboardVersion) => {
    const data = await restoreVersion(version.id);
    if (data) {
      onRestore(data);
      setIsOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}min atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <History className="w-4 h-4" />
          Histórico
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de Versões
          </SheetTitle>
          <SheetDescription>
            Salve e restaure versões anteriores do seu whiteboard
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Save new version */}
          <div className="p-4 bg-muted/50 rounded-lg border space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Save className="w-4 h-4" />
              Salvar Nova Versão
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Descrição (opcional)"
                value={versionDescription}
                onChange={(e) => setVersionDescription(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSaveVersion} 
                disabled={isSaving}
                size="sm"
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>

          {/* Version list */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              Versões Salvas ({versions.length})
            </h4>

            <ScrollArea className="h-[calc(100vh-320px)]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Carregando versões...
                </div>
              ) : versions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mb-2 opacity-20" />
                  <p>Nenhuma versão salva ainda</p>
                  <p className="text-xs">Salve uma versão para começar</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all cursor-pointer group",
                        selectedVersion?.id === version.id
                          ? "border-primary bg-primary/5"
                          : "hover:border-primary/50 hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedVersion(
                        selectedVersion?.id === version.id ? null : version
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              v{version.version_number}
                            </span>
                            {index === 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                Mais recente
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {version.description || `Versão ${version.version_number}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(version.created_at)}
                            <span className="mx-1">•</span>
                            {getRelativeTime(version.created_at)}
                          </p>
                        </div>
                        <ChevronRight className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          selectedVersion?.id === version.id && "rotate-90"
                        )} />
                      </div>

                      {/* Expanded actions */}
                      {selectedVersion?.id === version.id && (
                        <div className="mt-3 pt-3 border-t flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="default" size="sm" className="flex-1 gap-2">
                                <RotateCcw className="w-4 h-4" />
                                Restaurar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Restaurar versão?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Isso substituirá o conteúdo atual do whiteboard pela versão {version.version_number}.
                                  Recomendamos salvar a versão atual antes de restaurar.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRestore(version)}>
                                  Restaurar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir versão?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. A versão {version.version_number} será permanentemente excluída.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteVersion(version.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
