import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useImpersonate } from "@/contexts/ImpersonateContext";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, CheckCircle, XCircle, Clock, ShieldCheck, Settings, 
  Eye, Ban, UserCheck, Trash2, Plus, Save, RefreshCw, Search,
  Mail, Calendar, Activity, Zap, Store, BarChart3, Globe, 
  ExternalLink, Copy, MoreVertical, Sparkles, LogIn, History,
  TrendingUp, Pencil, X, Camera, Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

interface UserProfile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  created_at: string;
  approved_at: string | null;
  email?: string;
  last_login_at?: string | null;
  login_count?: number | null;
  last_active_at?: string | null;
}

interface UserIntegration {
  id: string;
  user_id: string;
  integration_type: string;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_user_id: string | null;
  details: Record<string, any>;
  created_at: string;
}

const INTEGRATION_TYPES = [
  { value: 'shopify', label: 'Shopify', icon: Store, color: 'text-green-500', fields: ['access_token', 'store_domain'] },
  { value: 'vturb', label: 'VTurb', icon: Activity, color: 'text-blue-500', fields: ['api_key'] },
  { value: 'hoko', label: 'Hoko', icon: Zap, color: 'text-purple-500', fields: ['email', 'password'] },
  { value: 'facebook', label: 'Facebook Ads', icon: BarChart3, color: 'text-blue-600', fields: ['access_token', 'app_id'] },
  { value: 'ga4', label: 'Google Analytics', icon: Globe, color: 'text-orange-500', fields: ['property_id', 'service_account_json'] },
];

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: XCircle },
  suspended: { label: 'Suspenso', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: Ban },
};

export default function Admin() {
  const { user } = useAuth();
  const { startImpersonating } = useImpersonate();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [newIntegration, setNewIntegration] = useState({ type: '', config: {} as Record<string, string> });
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleViewAsUser = (userProfile: UserProfile) => {
    startImpersonating({ id: userProfile.id, name: userProfile.name });
    toast.success(`Visualizando como ${userProfile.name || 'usuário'}`);
    navigate('/');
  };

  // Buscar todos os usuários com email
  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Buscar profiles
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return profiles as UserProfile[];
    }
  });

  // Buscar logs de atividade
  const { data: activityLogs } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ActivityLog[];
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

  // Função para registrar atividade
  const logActivity = async (action: string, targetUserId: string | null, details: Record<string, any> = {}) => {
    if (!user) return;
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id: user.id,
        action,
        target_user_id: targetUserId,
        details
      });
    queryClient.invalidateQueries({ queryKey: ['admin-activity-logs'] });
  };

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ userId, status, userName }: { userId: string; status: UserStatus; userName?: string }) => {
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
      
      // Registrar log de atividade
      await logActivity(`user_${status}`, userId, { user_name: userName });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, status });
      }
      toast.success(`Usuário ${status === 'approved' ? 'aprovado' : status === 'suspended' ? 'suspenso' : 'atualizado'} com sucesso!`);
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

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
      toast.success('Integração configurada!');
    },
    onError: (error) => {
      toast.error('Erro: ' + error.message);
    }
  });

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
    }
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', userId);
      
      if (error) throw error;
      
      await logActivity('user_name_updated', userId, { new_name: name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (selectedUser) {
        setSelectedUser({ ...selectedUser, name: editedName });
      }
      setIsEditingName(false);
      toast.success('Nome atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar nome: ' + error.message);
    }
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUser) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedUser.id}/avatar.${fileExt}`;

      // Delete old avatar if exists
      await supabase.storage.from('avatars').remove([
        `${selectedUser.id}/avatar.jpg`, 
        `${selectedUser.id}/avatar.png`, 
        `${selectedUser.id}/avatar.webp`
      ]);

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newAvatarUrl = publicUrl + '?t=' + Date.now();

      // Update profile with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Update local state
      setSelectedUser({ ...selectedUser, avatar_url: newAvatarUrl });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      
      await logActivity('user_avatar_updated', selectedUser.id, { user_name: selectedUser.name });
      toast.success('Foto atualizada com sucesso!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar foto: ' + error.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Filtros
  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const pendingUsers = filteredUsers.filter(u => u.status === 'pending');
  const approvedUsers = filteredUsers.filter(u => u.status === 'approved');
  const blockedUsers = filteredUsers.filter(u => u.status === 'rejected' || u.status === 'suspended');

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const selectedIntegrationType = INTEGRATION_TYPES.find(t => t.value === newIntegration.type);

  const UserListItem = ({ userProfile }: { userProfile: UserProfile }) => {
    const config = statusConfig[userProfile.status];
    const isSelected = selectedUser?.id === userProfile.id;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          group p-3 rounded-xl cursor-pointer transition-all duration-200
          ${isSelected 
            ? 'bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5' 
            : 'hover:bg-muted/50 border border-transparent'
          }
        `}
        onClick={() => setSelectedUser(userProfile)}
      >
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
            <AvatarImage src={userProfile.avatar_url || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-sm">
              {getInitials(userProfile.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userProfile.name || 'Sem nome'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {new Date(userProfile.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </p>
          </div>
          
          <Badge variant="outline" className={`${config.color} text-xs px-2 py-0.5 shrink-0`}>
            <config.icon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </motion.div>
    );
  };

  const IntegrationCard = ({ integration }: { integration: UserIntegration }) => {
    const intType = INTEGRATION_TYPES.find(t => t.value === integration.integration_type);
    const Icon = intType?.icon || Zap;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="group relative p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 hover:border-primary/30 transition-all duration-200"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg bg-background shadow-sm ${intType?.color || 'text-muted-foreground'}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">{intType?.label || integration.integration_type}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 text-xs ${integration.is_active ? 'text-green-500' : 'text-muted-foreground'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${integration.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  {integration.is_active ? 'Ativo' : 'Inativo'}
                </span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(integration.updated_at || integration.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setNewIntegration({ type: integration.integration_type, config: integration.config as Record<string, string> });
                setIntegrationDialogOpen(true);
              }}>
                <Settings className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => deleteIntegrationMutation.mutate(integration.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              Painel Admin
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie usuários e configure integrações</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetchUsers()}
            className="w-fit"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[
            { label: 'Pendentes', value: pendingUsers.length, icon: Clock, color: 'amber' },
            { label: 'Aprovados', value: approvedUsers.length, icon: CheckCircle, color: 'green' },
            { label: 'Bloqueados', value: blockedUsers.length, icon: Ban, color: 'red' },
            { label: 'Total', value: users?.length || 0, icon: Users, color: 'primary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-${stat.color}-500/10`}>
                      <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-5">
          {/* Users List */}
          <Card className="lg:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Usuários
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {filteredUsers.length}
                </Badge>
              </div>
              
              {/* Search */}
              <div className="relative mt-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-9">
                  <TabsTrigger value="pending" className="text-xs data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-500">
                    Pendentes ({pendingUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" className="text-xs data-[state=active]:bg-green-500/10 data-[state=active]:text-green-500">
                    Ativos ({approvedUsers.length})
                  </TabsTrigger>
                  <TabsTrigger value="blocked" className="text-xs data-[state=active]:bg-red-500/10 data-[state=active]:text-red-500">
                    Bloqueados ({blockedUsers.length})
                  </TabsTrigger>
                </TabsList>
                
                <ScrollArea className="h-[400px] mt-4 pr-2">
                  <TabsContent value="pending" className="space-y-2 mt-0">
                    {pendingUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Sparkles className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">Nenhum pendente</p>
                      </div>
                    ) : (
                      pendingUsers.map(u => <UserListItem key={u.id} userProfile={u} />)
                    )}
                  </TabsContent>
                  <TabsContent value="approved" className="space-y-2 mt-0">
                    {approvedUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Users className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">Nenhum aprovado</p>
                      </div>
                    ) : (
                      approvedUsers.map(u => <UserListItem key={u.id} userProfile={u} />)
                    )}
                  </TabsContent>
                  <TabsContent value="blocked" className="space-y-2 mt-0">
                    {blockedUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Ban className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">Nenhum bloqueado</p>
                      </div>
                    ) : (
                      blockedUsers.map(u => <UserListItem key={u.id} userProfile={u} />)
                    )}
                  </TabsContent>
                </ScrollArea>
              </Tabs>
            </CardContent>
          </Card>

          {/* User Details */}
          <Card className="lg:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {!selectedUser ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[500px] text-muted-foreground"
                >
                  <div className="p-6 rounded-full bg-muted/30 mb-4">
                    <Eye className="w-12 h-12 opacity-30" />
                  </div>
                  <p className="font-medium">Selecione um usuário</p>
                  <p className="text-sm opacity-70">Clique em um usuário na lista para gerenciar</p>
                </motion.div>
              ) : (
                <motion.div
                  key={selectedUser.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative group/avatar">
                          <Avatar className="h-16 w-16 border-4 border-background shadow-xl">
                            <AvatarImage src={selectedUser.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/50 text-primary-foreground text-xl font-bold">
                              {getInitials(selectedUser.name)}
                            </AvatarFallback>
                          </Avatar>
                          <button
                            type="button"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={uploadingAvatar}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                          >
                            {uploadingAvatar ? (
                              <Loader2 className="h-5 w-5 text-white animate-spin" />
                            ) : (
                              <Camera className="h-5 w-5 text-white" />
                            )}
                          </button>
                          <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarUpload}
                            className="hidden"
                          />
                        </div>
                        <div className="flex-1">
                          {isEditingName ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                placeholder="Nome do usuário"
                                className="h-9 text-lg font-semibold"
                                autoFocus
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                onClick={() => updateNameMutation.mutate({ userId: selectedUser.id, name: editedName })}
                                disabled={updateNameMutation.isPending || !editedName.trim()}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                                onClick={() => {
                                  setIsEditingName(false);
                                  setEditedName(selectedUser.name || '');
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/name">
                              <CardTitle className="text-xl">{selectedUser.name || 'Sem nome'}</CardTitle>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 opacity-0 group-hover/name:opacity-100 transition-opacity"
                                onClick={() => {
                                  setEditedName(selectedUser.name || '');
                                  setIsEditingName(true);
                                }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={statusConfig[selectedUser.status].color}>
                              {statusConfig[selectedUser.status].label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(selectedUser.id)}
                        title="Copiar ID"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* User Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-4 rounded-xl bg-muted/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Cadastro
                        </span>
                        <span className="text-sm font-medium">{new Date(selectedUser.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      {selectedUser.approved_at && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Aprovado
                          </span>
                          <span className="text-sm font-medium">{new Date(selectedUser.approved_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <LogIn className="w-3 h-3" />
                          Último login
                        </span>
                        <span className="text-sm font-medium">
                          {selectedUser.last_login_at 
                            ? new Date(selectedUser.last_login_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Nunca'
                          }
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          Total logins
                        </span>
                        <span className="text-sm font-medium">{selectedUser.login_count || 0}</span>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* View as User Button */}
                    {selectedUser.status === 'approved' && (
                      <Button
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                        onClick={() => handleViewAsUser(selectedUser)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Dashboard como {selectedUser.name?.split(' ')[0] || 'Usuário'}
                      </Button>
                    )}

                    {/* Status Actions */}
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Ações Rápidas</Label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={selectedUser.status === 'approved' ? 'default' : 'outline'}
                          className={selectedUser.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                          onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'approved', userName: selectedUser.name || undefined })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <UserCheck className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedUser.status === 'suspended' ? 'destructive' : 'outline'}
                          onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'suspended', userName: selectedUser.name || undefined })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Suspender
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedUser.status === 'rejected' ? 'destructive' : 'outline'}
                          onClick={() => updateStatusMutation.mutate({ userId: selectedUser.id, status: 'rejected', userName: selectedUser.name || undefined })}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Integrations */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-sm font-semibold">Integrações</Label>
                        <Dialog open={integrationDialogOpen} onOpenChange={setIntegrationDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                              <Plus className="w-4 h-4" />
                              Adicionar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-primary" />
                                Nova Integração
                              </DialogTitle>
                              <DialogDescription>
                                Configure uma integração para {selectedUser.name || 'este usuário'}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div>
                                <Label>Serviço</Label>
                                <Select 
                                  value={newIntegration.type}
                                  onValueChange={(value) => setNewIntegration({ type: value, config: {} })}
                                >
                                  <SelectTrigger className="mt-1.5">
                                    <SelectValue placeholder="Selecione o serviço..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {INTEGRATION_TYPES.map(type => {
                                      const Icon = type.icon;
                                      return (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center gap-2">
                                            <Icon className={`w-4 h-4 ${type.color}`} />
                                            {type.label}
                                          </div>
                                        </SelectItem>
                                      );
                                    })}
                                  </SelectContent>
                                </Select>
                              </div>

                              {selectedIntegrationType && selectedIntegrationType.fields.map(field => (
                                <div key={field}>
                                  <Label className="capitalize">{field.replace(/_/g, ' ')}</Label>
                                  <Input
                                    className="mt-1.5"
                                    type={field.includes('password') || field.includes('token') || field.includes('key') ? 'password' : 'text'}
                                    value={newIntegration.config[field] || ''}
                                    onChange={(e) => setNewIntegration(prev => ({
                                      ...prev,
                                      config: { ...prev.config, [field]: e.target.value }
                                    }))}
                                    placeholder={`Digite ${field.replace(/_/g, ' ')}`}
                                  />
                                </div>
                              ))}

                              <Button 
                                className="w-full mt-4"
                                disabled={!newIntegration.type || upsertIntegrationMutation.isPending}
                                onClick={() => upsertIntegrationMutation.mutate({
                                  userId: selectedUser.id,
                                  integrationType: newIntegration.type,
                                  config: newIntegration.config
                                })}
                              >
                                {upsertIntegrationMutation.isPending ? (
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4 mr-2" />
                                )}
                                Salvar Integração
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {loadingIntegrations ? (
                        <div className="flex items-center justify-center py-12">
                          <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : userIntegrations?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/50 rounded-xl">
                          <Zap className="w-10 h-10 text-muted-foreground/30 mb-3" />
                          <p className="text-muted-foreground text-sm">Nenhuma integração configurada</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => setIntegrationDialogOpen(true)}
                          >
                            Adicionar primeira integração
                          </Button>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {userIntegrations?.map(integration => (
                            <IntegrationCard key={integration.id} integration={integration} />
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>

        {/* Activity Logs */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                Logs de Atividade
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                Últimos {activityLogs?.length || 0}
              </Badge>
            </div>
            <CardDescription>Histórico de ações administrativas</CardDescription>
          </CardHeader>
          <CardContent>
            {!activityLogs || activityLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Nenhuma atividade registrada</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {activityLogs.map((log) => {
                    const targetUser = users?.find(u => u.id === log.target_user_id);
                    const actionLabels: Record<string, { label: string; color: string }> = {
                      user_approved: { label: 'Aprovou usuário', color: 'text-green-500' },
                      user_suspended: { label: 'Suspendeu usuário', color: 'text-orange-500' },
                      user_rejected: { label: 'Rejeitou usuário', color: 'text-red-500' },
                      user_pending: { label: 'Pendenciou usuário', color: 'text-amber-500' },
                      integration_added: { label: 'Adicionou integração', color: 'text-blue-500' },
                      integration_removed: { label: 'Removeu integração', color: 'text-red-500' },
                    };
                    const actionInfo = actionLabels[log.action] || { label: log.action, color: 'text-muted-foreground' };
                    
                    return (
                      <div key={log.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className={`p-2 rounded-lg bg-background ${actionInfo.color}`}>
                          <Activity className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">
                            <span className={`font-medium ${actionInfo.color}`}>{actionInfo.label}</span>
                            {targetUser && (
                              <span className="text-muted-foreground"> • {targetUser.name || 'Usuário'}</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleDateString('pt-BR', { 
                              day: '2-digit', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
