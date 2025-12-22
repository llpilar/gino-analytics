import { useState, useEffect } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface VslPlayer {
  id: string;
  name: string;
}

interface VslPlayerSelectorProps {
  players: VslPlayer[];
  selectedPlayerId: string | undefined;
  onPlayerChange: (playerId: string | undefined) => void;
  isLoading?: boolean;
}

export function VslPlayerSelector({
  players,
  selectedPlayerId,
  onPlayerChange,
  isLoading = false,
}: VslPlayerSelectorProps) {
  const { effectiveUserId, integrations } = useUserIntegrations();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [playerNames, setPlayerNames] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Load custom names from integration config
  useEffect(() => {
    const vturbIntegration = integrations?.find(i => i.integration_type === 'vturb');
    if (vturbIntegration?.config?.player_names) {
      setPlayerNames(vturbIntegration.config.player_names as Record<string, string>);
    }
  }, [integrations]);

  const getPlayerDisplayName = (player: VslPlayer): string => {
    return playerNames[player.id] || player.name || player.id;
  };

  const getSelectedDisplayName = (): string => {
    if (!selectedPlayerId) return "Todas as VSLs";
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) return "Selecione a VSL";
    return getPlayerDisplayName(player);
  };

  const handleStartEdit = (e: React.MouseEvent, player: VslPlayer) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(player.id);
    setEditName(playerNames[player.id] || player.name || player.id);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveName = async (playerId: string) => {
    if (!effectiveUserId || !editName.trim()) return;
    
    setIsSaving(true);
    try {
      const vturbIntegration = integrations?.find(i => i.integration_type === 'vturb');
      if (!vturbIntegration) {
        toast.error("Integração VTurb não encontrada");
        return;
      }

      const updatedPlayerNames = {
        ...playerNames,
        [playerId]: editName.trim(),
      };

      const updatedConfig = {
        ...vturbIntegration.config,
        player_names: updatedPlayerNames,
      };

      const { error } = await supabase
        .from('user_integrations')
        .update({ config: updatedConfig })
        .eq('id', vturbIntegration.id);

      if (error) throw error;

      setPlayerNames(updatedPlayerNames);
      setEditingId(null);
      setEditName("");
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] });
      
      toast.success("Nome atualizado!");
    } catch (error) {
      console.error('Error saving player name:', error);
      toast.error("Erro ao salvar nome");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPlayer = (playerId: string | undefined) => {
    if (editingId) return; // Don't select while editing
    onPlayerChange(playerId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] md:w-[280px] h-8 text-xs md:text-sm bg-background/50 justify-between"
          disabled={isLoading}
        >
          <span className="truncate">
            {isLoading ? "Carregando..." : getSelectedDisplayName()}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] md:w-[320px] p-0 bg-popover border border-border shadow-lg z-50" align="end">
        <div className="max-h-[300px] overflow-y-auto">
          {/* All VSLs option */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent transition-colors",
              !selectedPlayerId && "bg-accent"
            )}
            onClick={() => handleSelectPlayer(undefined)}
          >
            <Check className={cn("h-4 w-4", !selectedPlayerId ? "opacity-100" : "opacity-0")} />
            <span className="text-sm">Todas as VSLs</span>
          </div>
          
          {/* Separator */}
          <div className="h-px bg-border mx-2" />
          
          {/* Player list */}
          {Array.isArray(players) && players.map((player) => (
            <div
              key={player.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 group",
                editingId !== player.id && "cursor-pointer hover:bg-accent transition-colors",
                selectedPlayerId === player.id && "bg-accent"
              )}
              onClick={() => editingId !== player.id && handleSelectPlayer(player.id)}
            >
              {editingId === player.id ? (
                <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 text-sm flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveName(player.id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleSaveName(player.id)}
                    disabled={isSaving}
                  >
                    <Check className="h-4 w-4 text-green-500" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <Check className={cn("h-4 w-4 shrink-0", selectedPlayerId === player.id ? "opacity-100" : "opacity-0")} />
                  <span className="text-sm flex-1 truncate">{getPlayerDisplayName(player)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleStartEdit(e, player)}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </>
              )}
            </div>
          ))}
          
          {(!players || players.length === 0) && !isLoading && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nenhuma VSL encontrada
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}