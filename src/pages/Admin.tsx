import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Users, CheckCircle, XCircle, Clock, ShieldCheck, Settings, 
  Eye, Ban, UserCheck, Trash2, Plus, Save, RefreshCw
} from "lucide-react";

type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  approved_at: string | null;
}

interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

const INTEGRATION_TYPES = [
  { value: 'shopify', label: 'Shopify', fields: ['access_token', 'store_domain'] },
  { value: 'vturb', label: 'VTurb', fields: ['api_key'] },
  { value: 'hoko', label: 'Hoko', fields: ['email', 'password'] },
  { value: 'facebook', label: 'Facebook Ads', fields: ['access_token', 'app_id'] },
  { value: 'ga4', label: 'Google Analytics 4', fields: ['property_id', 'service_account_json'] },
];

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [newIntegration, setNewIntegration] = useState({ type: '', config: {} as Record<string, string> });

  // Buscar todos os usuários
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserProfile[];
    }
  });

  // Buscar integrações do usuário selecionado
  const { data: userIntegrations, isLoading: loadingIntegrations } = useQuery({
    queryKey: ['admin-user-integrations', selectedUser?.id],
    queryFn: async () => {
      if (!selectedUser) return [];
      const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', selectedUser.id);
      
      if (error) throw error;
      return data as UserIntegration[];
    },
    enabled: !!selectedUser
  });

  // Mutation para atualizar status do usuário
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: UserStatus }) => {
      const updateData: any = { status };
      if (status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  });

  // Mutation para adicionar/atualizar integração
  const upsertIntegrationMutation = useMutation({
    mutationFn: async ({ userId, integrationType, config }: { userId: string; integrationType: string; config: Record<string, string> }) => {
      const { error } = await supabase
        .from('user_integrations')
        .upsert({
          user_id: userId,
          integration_type: integrationType,
          config,
          configured_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,integration_type'
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-integrations'] });
      setIntegrationDialogOpen(false);
      setNewIntegration({ type: '', config: {} });
      toast.success('Integração salva com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao salvar integração: ' + error.message);
    }
  });

  // Mutation para deletar integração
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('id', integrationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-integrations'] });
      toast.success('Integração removida!');
    },
    onError: (error) => {
      toast.error('Erro ao remover integração: ' + error.message);
    }
  });

  const pendingUsers = users?.filter(u => u.status === 'pending') || [];
  const approvedUsers = users?.filter(u => u.status === 'approved') || [];
  const blockedUsers = users?.filter(u => u.status === 'rejected' || u.status === 'suspended') || [];

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-amber-500 border-amber-500"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-500 border-green-500"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-500 border-red-500"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="text-orange-500 border-orange-500"><Ban className="w-3 h-3 mr-1" />Suspenso</Badge>;
    }
  };

  const UserCard = ({ userProfile }: { userProfile: UserProfile }) => (
    <Card 
      className={`cursor-pointer transition-all hover:border-primary ${selectedUser?.id === userProfile.id ? 'border-primary ring-1 ring-primary' : ''}`}
      onClick={() => setSelectedUser(userProfile)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{userProfile.name || 'Sem nome'}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(userProfile.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
          {getStatusBadge(userProfile.status)}
        </div>
      </CardContent>
    </Card>
  );

  const selectedIntegrationType = INTEGRATION_TYPES.find(t => t.value === newIntegration.type);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="w-8 h-8" />
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">Gerencie usuários e configure integrações</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/10">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedUsers.length}</p>
                <p className="text-sm text-muted-foreground">Aprovados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-red-500/10">
                <Ban className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{blockedUsers.length}</p>
                <p className="text-sm text-muted-foreground">Bloqueados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Lista de usuários */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Usuários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="pending" className="text-xs">
                    Pendentes ({pendingUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs">
                    Ativos ({approvedUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="blocked" className="text-xs">
                    Bloqueados ({blockedUsers.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                  {pendingUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário pendente</p>
                  ) : (
                    pendingUsers.map(u => <UserCard key={u.id} userProfile={u} />)
                  )}
                </TabsContent>
                <TabsContent value="approved" className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                  {approvedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário aprovado</p>
                  ) : (
                    approvedUsers.map(u => <UserCard key={u.id} userProfile={u} />)
                  )}
                </TabsContent>
                <TabsContent value="blocked" className="space-y-2 mt-4 max-h-96 overflow-y-auto">
                  {blockedUsers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário bloqueado</p>
                  ) : (
                    blockedUsers.map(u => <UserCard key={u.id} userProfile={u} />)
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Detalhes do usuário selecionado */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {selectedUser ? `Gerenciar: ${selectedUser.name || 'Usuário'}` : 'Selecione um usuário'}
              </CardTitle>
              {selectedUser && (
                <CardDescription>
                  Criado em {new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!selectedUser ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Eye className="w-12 h-12 mb-4 opacity-50" />
                  <p>Selecione um usuário na lista para gerenciar</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Ações de status */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Status da Conta</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={selectedUser.status === 'approved' ? 'default' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'approved' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <UserCheck className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUser.status === 'suspended' ? 'destructive' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'suspended' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Suspender
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUser.status === 'rejected' ? 'destructive' : 'outline'}
                        onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'rejected' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>

                  {/* Integrações */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-sm font-medium">Integrações Configuradas</Label>
                      <Dialog open={integrationDialogOpen} onOpenChange={setIntegrationDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Plus className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configurar Integração</DialogTitle>
                            <DialogDescription>
                              Configure uma integração para {selectedUser.name || 'este usuário'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label>Tipo de Integração</Label>
                              <Select 
                                value={newIntegration.type}
                                onValueChange={(value) => setNewIntegration({ type: value, config: {} })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {INTEGRATION_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {selectedIntegrationType && selectedIntegrationType.fields.map(field => (
                              <div key={field}>
                                <Label className="capitalize">{field.replace('_', ' ')}</Label>
                                <Input
                                  type={field.includes('password') || field.includes('token') || field.includes('key') ? 'password' : 'text'}
                                  value={newIntegration.config[field] || ''}
                                  onChange={(e) => setNewIntegration(prev => ({
                                    ...prev,
                                    config: { ...prev.config, [field]: e.target.value }
                                  }))}
                                  placeholder={`Digite ${field.replace('_', ' ')}`}
                                />
                              </div>
                            ))}

                            <Button 
                              className="w-full"
                              disabled={!newIntegration.type || upsertIntegrationMutation.isPending}
                              onClick={() => upsertIntegrationMutation.mutate({
                                userId: selectedUser.id,
                                integrationType: newIntegration.type,
                                config: newIntegration.config
                              })}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Salvar Integração
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {loadingIntegrations ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : userIntegrations?.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground border rounded-lg border-dashed">
                        <p>Nenhuma integração configurada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {userIntegrations?.map(integration => {
                          const intType = INTEGRATION_TYPES.find(t => t.value === integration.integration_type);
                          return (
                            <div key={integration.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div>
                                <p className="font-medium">{intType?.label || integration.integration_type}</p>
                                <p className="text-xs text-muted-foreground">
                                  {integration.is_active ? 'Ativo' : 'Inativo'} • {new Date(integration.created_at).toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setNewIntegration({ type: integration.integration_type, config: integration.config as Record<string, string> });
                                    setIntegrationDialogOpen(true);
                                  }}
                                >
                                  <Settings className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
