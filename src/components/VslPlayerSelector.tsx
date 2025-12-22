import { useState, useEffect } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUserIntegrations } from "@/hooks/useUserIntegrations";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<VslPlayer | null>(null);
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

  const handleOpenEditDialog = (player: VslPlayer) => {
    setEditingPlayer(player);
    setEditName(playerNames[player.id] || player.name || player.id);
    setEditDialogOpen(true);
  };

  const handleSaveName = async () => {
    if (!effectiveUserId || !editName.trim() || !editingPlayer) return;
    
    setIsSaving(true);
    try {
      const vturbIntegration = integrations?.find(i => i.integration_type === 'vturb');
      if (!vturbIntegration) {
        toast.error("Integração VTurb não encontrada");
        return;
      }

      const updatedPlayerNames = {
        ...playerNames,
        [editingPlayer.id]: editName.trim(),
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
      setEditDialogOpen(false);
      setEditingPlayer(null);
      setEditName("");
      
      queryClient.invalidateQueries({ queryKey: ['user-integrations'] });
      
      toast.success("Nome atualizado!");
    } catch (error) {
      console.error('Error saving player name:', error);
      toast.error("Erro ao salvar nome");
    } finally {
      setIsSaving(false);
    }
  };

  const handleValueChange = (value: string) => {
    console.log("VslPlayerSelector: value changed to", value);
    console.log("VslPlayerSelector: players available", players);
    onPlayerChange(value === "all" ? undefined : value);
  };

  // Debug log
  useEffect(() => {
    console.log("VslPlayerSelector: players prop received", players);
  }, [players]);

  return (
    <>
      <div className="flex items-center gap-2">
        <Select 
          value={selectedPlayerId || "all"} 
          onValueChange={handleValueChange}
        >
          <SelectTrigger className="w-[180px] md:w-[240px] h-8 text-xs md:text-sm bg-background/80 border-border">
            <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione a VSL"}>
              {isLoading ? "Carregando..." : getSelectedDisplayName()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-xl z-[100]">
            <SelectItem value="all">Todas as VSLs</SelectItem>
            {Array.isArray(players) && players.length > 0 && players.map((player) => (
              <SelectItem key={player.id} value={player.id}>
                {getPlayerDisplayName(player)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Edit button - only show when a specific player is selected */}
        {selectedPlayerId && players.find(p => p.id === selectedPlayerId) && (
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => {
              const player = players.find(p => p.id === selectedPlayerId);
              if (player) handleOpenEditDialog(player);
            }}
            title="Renomear VSL"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renomear VSL</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="text-sm text-muted-foreground">
              ID: {editingPlayer?.id}
            </div>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nome da VSL"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveName();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveName}
                disabled={isSaving || !editName.trim()}
              >
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}