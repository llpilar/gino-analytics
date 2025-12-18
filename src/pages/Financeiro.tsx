import { useState, useRef, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Settings, DollarSign, TrendingUp, TrendingDown, Users, ImageIcon, X, Eye, Loader2, Calendar, ToggleLeft, ToggleRight, Banknote, ArrowDownCircle } from "lucide-react";
import { 
  useExpenses, 
  usePartnersConfig, 
  useAddExpense, 
  useDeleteExpense, 
  useUpdatePartnersConfig, 
  uploadReceipt, 
  getReceiptSignedUrl, 
  useFixedExpenses, 
  useAddFixedExpense, 
  useDeleteFixedExpense, 
  useToggleFixedExpense,
  useWithdrawals,
  useAddWithdrawal,
  useDeleteWithdrawal
} from "@/hooks/useExpenses";
import { StatsCard, SectionCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const CATEGORIES = [
  "Marketing",
  "Produtos",
  "Frete",
  "Impostos",
  "Ferramentas",
  "Outros",
];

export default function Financeiro() {
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: partnersConfig, isLoading: configLoading } = usePartnersConfig();
  const { data: fixedExpenses, isLoading: fixedLoading } = useFixedExpenses();
  const { data: withdrawals, isLoading: withdrawalsLoading } = useWithdrawals();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const updateConfig = useUpdatePartnersConfig();
  const addFixedExpense = useAddFixedExpense();
  const deleteFixedExpense = useDeleteFixedExpense();
  const toggleFixedExpense = useToggleFixedExpense();
  const addWithdrawal = useAddWithdrawal();
  const deleteWithdrawal = useDeleteWithdrawal();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paid_by: "",
    category: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptFilePath, setReceiptFilePath] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  const [newWithdrawal, setNewWithdrawal] = useState({
    partner_name: "",
    amount: "",
    description: "",
    withdrawal_date: format(new Date(), "yyyy-MM-dd"),
  });

  useEffect(() => {
    const loadSignedUrl = async () => {
      if (receiptFilePath) {
        setIsLoadingReceipt(true);
        const signedUrl = await getReceiptSignedUrl(receiptFilePath);
        setViewReceiptUrl(signedUrl);
        setIsLoadingReceipt(false);
      } else {
        setViewReceiptUrl(null);
      }
    };
    loadSignedUrl();
  }, [receiptFilePath]);

  const [configDialog, setConfigDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({
    partner1_name: "",
    partner2_name: "",
  });

  const [newFixedExpense, setNewFixedExpense] = useState({
    description: "",
    amount: "",
    paid_by: "",
    category: "",
  });

  const handleAddFixedExpense = () => {
    if (!newFixedExpense.description || !newFixedExpense.amount || !newFixedExpense.paid_by) return;
    
    addFixedExpense.mutate({
      description: newFixedExpense.description,
      amount: parseFloat(newFixedExpense.amount),
      paid_by: newFixedExpense.paid_by,
      category: newFixedExpense.category || null,
      is_active: true,
    });
    
    setNewFixedExpense({
      description: "",
      amount: "",
      paid_by: "",
      category: "",
    });
  };

  const handleAddWithdrawal = () => {
    if (!newWithdrawal.partner_name || !newWithdrawal.amount) return;
    
    addWithdrawal.mutate({
      partner_name: newWithdrawal.partner_name,
      amount: parseFloat(newWithdrawal.amount),
      description: newWithdrawal.description || null,
      withdrawal_date: newWithdrawal.withdrawal_date,
    });
    
    setNewWithdrawal({
      partner_name: "",
      amount: "",
      description: "",
      withdrawal_date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const partner1 = partnersConfig?.partner1_name || "Sócio 1";
  const partner2 = partnersConfig?.partner2_name || "Sócio 2";

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paid_by) return;
    
    setIsUploading(true);
    let receiptUrl: string | null = null;

    if (selectedFile) {
      receiptUrl = await uploadReceipt(selectedFile);
    }
    
    addExpense.mutate({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paid_by: newExpense.paid_by,
      category: newExpense.category || null,
      expense_date: newExpense.expense_date,
      receipt_url: receiptUrl,
    });
    
    setNewExpense({
      description: "",
      amount: "",
      paid_by: "",
      category: "",
      expense_date: format(new Date(), "yyyy-MM-dd"),
    });
    clearSelectedFile();
    setIsUploading(false);
  };

  const handleUpdateConfig = () => {
    if (!newConfig.partner1_name || !newConfig.partner2_name) return;
    updateConfig.mutate(newConfig);
    setConfigDialog(false);
  };

  // Calculate totals and balance
  const partner1Total = expenses?.filter(e => e.paid_by === partner1).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const partner2Total = expenses?.filter(e => e.paid_by === partner2).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const totalExpenses = partner1Total + partner2Total;
  const fairShare = totalExpenses / 2;
  const partner1Balance = partner1Total - fairShare;
  const partner2Balance = partner2Total - fairShare;

  // Calculate fixed expenses total (only active ones)
  const activeFixedExpenses = fixedExpenses?.filter(e => e.is_active) || [];
  const fixedExpensesTotal = activeFixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Calculate withdrawals totals
  const partner1Withdrawals = withdrawals?.filter(w => w.partner_name === partner1).reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  const partner2Withdrawals = withdrawals?.filter(w => w.partner_name === partner2).reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  const totalWithdrawals = partner1Withdrawals + partner2Withdrawals;

  // Calculate open balance (what each partner still needs to withdraw to reimburse their expenses)
  const partner1OpenBalance = partner1Total - partner1Withdrawals;
  const partner2OpenBalance = partner2Total - partner2Withdrawals;
  
  // Determine who should withdraw next
  const nextToWithdraw = partner1OpenBalance > partner2OpenBalance ? partner1 : partner2;
  const nextWithdrawAmount = Math.max(partner1OpenBalance, partner2OpenBalance);

  if (expensesLoading || configLoading || fixedLoading || withdrawalsLoading) {
    return (
      <DashboardWrapper>
        <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 min-h-screen">
          <Skeleton className="h-10 w-48 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-muted" />
            ))}
          </div>
          <Skeleton className="h-96 mt-8 bg-muted" />
        </div>
      </DashboardWrapper>
    );
  }

  const statCards: { title: string; value: string; subtitle?: string; subtitleColor?: string; icon: LucideIcon; color: CardColorVariant }[] = [
    {
      title: "Total Despesas",
      value: formatBRL(totalExpenses),
      icon: DollarSign,
      color: "cyan",
    },
    {
      title: "Total Saques",
      value: formatBRL(totalWithdrawals),
      subtitle: `${partner1}: ${formatBRL(partner1Withdrawals)} | ${partner2}: ${formatBRL(partner2Withdrawals)}`,
      subtitleColor: 'text-muted-foreground',
      icon: Banknote,
      color: "orange",
    },
    {
      title: partner1,
      value: formatBRL(partner1Total),
      subtitle: partner1Balance > 0 ? `Receber ${formatBRL(partner1Balance)}` : partner1Balance < 0 ? `Deve ${formatBRL(Math.abs(partner1Balance))}` : 'Equilibrado',
      subtitleColor: partner1Balance > 0 ? 'text-chart-2' : partner1Balance < 0 ? 'text-destructive' : 'text-muted-foreground',
      icon: Users,
      color: "purple",
    },
    {
      title: "Acerto",
      value: partner1Balance === 0 ? "Tudo certo!" : partner1Balance > 0 
        ? `${partner2} → ${partner1}` 
        : `${partner1} → ${partner2}`,
      subtitle: partner1Balance !== 0 ? formatBRL(Math.abs(partner1Balance)) : undefined,
      subtitleColor: 'text-chart-2',
      icon: partner1Balance >= 0 ? TrendingUp : TrendingDown,
      color: "green",
    }
  ];

  return (
    <DashboardWrapper>
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-4 md:py-6 lg:py-8 min-h-screen pb-24 md:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <PageHeader 
            title="Financeiro"
            subtitle="Controle de despesas, saques e divisão entre sócios"
          />
          <Dialog open={configDialog} onOpenChange={setConfigDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setNewConfig({ partner1_name: partner1, partner2_name: partner2 })}
                className="bg-card/80 border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 w-full sm:w-auto"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Sócios
              </Button>
            </DialogTrigger>
              <DialogContent className="bg-popover/95 border-2 border-border backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-primary">
                  Configurar Nomes dos Sócios
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-muted-foreground">Nome do Sócio 1</Label>
                  <Input
                    value={newConfig.partner1_name}
                    onChange={(e) => setNewConfig({ ...newConfig, partner1_name: e.target.value })}
                    placeholder="Nome do primeiro sócio"
                    className="bg-card/60 border-border text-foreground focus:border-primary"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Nome do Sócio 2</Label>
                  <Input
                    value={newConfig.partner2_name}
                    onChange={(e) => setNewConfig({ ...newConfig, partner2_name: e.target.value })}
                    placeholder="Nome do segundo sócio"
                    className="bg-card/60 border-border text-foreground focus:border-primary"
                  />
                </div>
                <Button 
                  onClick={handleUpdateConfig} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          {statCards.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              subtitleColor={stat.subtitleColor}
              icon={stat.icon}
              color={stat.color}
            />
          ))}
        </div>

        {/* Saldo em Aberto - Open Balance Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
          <div className="bg-card/60 border border-border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <div className="ml-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saldo em Aberto - {partner1}</p>
              <p className={`text-2xl font-black ${partner1OpenBalance > 0 ? 'text-purple-400' : 'text-chart-2'}`}>
                {formatBRL(partner1OpenBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gastou {formatBRL(partner1Total)} • Sacou {formatBRL(partner1Withdrawals)}
              </p>
            </div>
          </div>

          <div className="bg-card/60 border border-border rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
            <div className="ml-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Saldo em Aberto - {partner2}</p>
              <p className={`text-2xl font-black ${partner2OpenBalance > 0 ? 'text-orange-400' : 'text-chart-2'}`}>
                {formatBRL(partner2OpenBalance)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gastou {formatBRL(partner2Total)} • Sacou {formatBRL(partner2Withdrawals)}
              </p>
            </div>
          </div>

          <div className="bg-card/60 border-2 border-primary/30 rounded-xl p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="ml-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Próximo Saque</p>
              {nextWithdrawAmount > 0 ? (
                <>
                  <p className="text-2xl font-black text-primary">{nextToWithdraw}</p>
                  <p className="text-xs text-chart-2 mt-1 font-semibold">
                    <ArrowDownCircle className="inline h-3 w-3 mr-1" />
                    {formatBRL(nextWithdrawAmount)} a receber
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-black text-chart-2">Equilibrado!</p>
                  <p className="text-xs text-muted-foreground mt-1">Ambos já receberam o que gastaram</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for different sections */}
        <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList className="bg-card/60 border border-border">
            <TabsTrigger value="expenses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-4 w-4 mr-2" />
              Despesas
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Banknote className="h-4 w-4 mr-2" />
              Saques
            </TabsTrigger>
            <TabsTrigger value="fixed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Gastos Fixos
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-6">
            <SectionCard title="Nova Despesa" icon={Plus} color="cyan">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4 mb-4">
                <div className="sm:col-span-2 lg:col-span-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</Label>
                  <Input
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Ex: Facebook Ads"
                    className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="0,00"
                    className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Pago por</Label>
                  <Select value={newExpense.paid_by} onValueChange={(v) => setNewExpense({ ...newExpense, paid_by: v })}>
                    <SelectTrigger className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 border-primary/30">
                      <SelectItem value={partner1} className="text-foreground hover:bg-primary/20">{partner1}</SelectItem>
                      <SelectItem value={partner2} className="text-foreground hover:bg-primary/20">{partner2}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Categoria</Label>
                  <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                    <SelectTrigger className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 border-primary/30">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="text-foreground hover:bg-primary/20">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <Button 
                    onClick={handleAddExpense} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    disabled={addExpense.isPending || isUploading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Adicionar'}
                  </Button>
                </div>
              </div>

              {/* Receipt Upload Section */}
              <div className="mt-4 p-4 rounded-xl bg-card/40 border border-border">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider mb-2 block">Comprovante (opcional)</Label>
                <div className="flex items-center gap-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Anexar Imagem</span>
                  </label>
                  
                  {previewUrl && (
                    <div className="relative">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="h-16 w-16 object-cover rounded-lg border border-primary/30"
                      />
                      <button
                        onClick={clearSelectedFile}
                        className="absolute -top-2 -right-2 p-1 bg-destructive rounded-full hover:bg-destructive/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-destructive-foreground" />
                      </button>
                    </div>
                  )}
                  
                  {selectedFile && (
                    <span className="text-sm text-muted-foreground">{selectedFile.name}</span>
                  )}
                </div>
              </div>
            </SectionCard>

            {/* Expenses Table */}
            <SectionCard title="Histórico de Despesas" icon={DollarSign} color="purple">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Data</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Categoria</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Pago por</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Valor</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-center">Comprovante</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses?.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                            <span>Nenhuma despesa registrada ainda</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses?.map((expense) => (
                        <TableRow key={expense.id} className="border-b border-border hover:bg-accent/50">
                          <TableCell className="text-muted-foreground">
                            {format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-medium text-foreground">{expense.description}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/30">
                              {expense.category || "Outros"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">
                              {expense.paid_by}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-chart-2 font-bold">
                            {formatBRL(Number(expense.amount))}
                          </TableCell>
                          <TableCell className="text-center">
                            {expense.receipt_url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReceiptFilePath(expense.receipt_url)}
                                className="hover:bg-primary/20 text-primary"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteExpense.mutate(expense.id)}
                              disabled={deleteExpense.isPending}
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-6">
            <SectionCard title="Novo Saque" icon={ArrowDownCircle} color="orange">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Quem Sacou</Label>
                  <Select value={newWithdrawal.partner_name} onValueChange={(v) => setNewWithdrawal({ ...newWithdrawal, partner_name: v })}>
                    <SelectTrigger className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 border-primary/30">
                      <SelectItem value={partner1} className="text-foreground hover:bg-primary/20">{partner1}</SelectItem>
                      <SelectItem value={partner2} className="text-foreground hover:bg-primary/20">{partner2}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newWithdrawal.amount}
                    onChange={(e) => setNewWithdrawal({ ...newWithdrawal, amount: e.target.value })}
                    placeholder="0,00"
                    className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Data</Label>
                  <Input
                    type="date"
                    value={newWithdrawal.withdrawal_date}
                    onChange={(e) => setNewWithdrawal({ ...newWithdrawal, withdrawal_date: e.target.value })}
                    className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Descrição (opcional)</Label>
                  <Input
                    value={newWithdrawal.description}
                    onChange={(e) => setNewWithdrawal({ ...newWithdrawal, description: e.target.value })}
                    placeholder="Ex: Pró-labore"
                    className="bg-card/60 border-primary/30 text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddWithdrawal} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    disabled={addWithdrawal.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Saque
                  </Button>
                </div>
              </div>
            </SectionCard>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-card/60 border border-border">
                <p className="text-muted-foreground text-sm mb-1">Saques de {partner1}</p>
                <p className="text-2xl font-bold text-primary">{formatBRL(partner1Withdrawals)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {withdrawals?.filter(w => w.partner_name === partner1).length || 0} saques
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card/60 border border-border">
                <p className="text-muted-foreground text-sm mb-1">Saques de {partner2}</p>
                <p className="text-2xl font-bold text-primary">{formatBRL(partner2Withdrawals)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {withdrawals?.filter(w => w.partner_name === partner2).length || 0} saques
                </p>
              </div>
              <div className="p-4 rounded-xl bg-card/60 border border-border">
                <p className="text-muted-foreground text-sm mb-1">Diferença</p>
                <p className="text-2xl font-bold text-chart-2">
                  {formatBRL(Math.abs(partner1Withdrawals - partner2Withdrawals))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {partner1Withdrawals > partner2Withdrawals 
                    ? `${partner1} sacou mais` 
                    : partner2Withdrawals > partner1Withdrawals 
                      ? `${partner2} sacou mais` 
                      : 'Saques iguais'}
                </p>
              </div>
            </div>

            {/* Withdrawals Table */}
            <SectionCard title="Histórico de Saques" icon={Banknote} color="orange">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Data</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Quem Sacou</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</TableHead>
                      <TableHead className="text-muted-foreground text-xs uppercase tracking-wider text-right">Valor</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals?.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                          <div className="flex flex-col items-center gap-2">
                            <Banknote className="h-12 w-12 text-muted-foreground/50" />
                            <span>Nenhum saque registrado ainda</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawals?.map((withdrawal) => (
                        <TableRow key={withdrawal.id} className="border-b border-border hover:bg-accent/50">
                          <TableCell className="text-muted-foreground">
                            {format(new Date(withdrawal.withdrawal_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-primary">
                              {withdrawal.partner_name}
                            </span>
                          </TableCell>
                          <TableCell className="text-foreground">
                            {withdrawal.description || "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-chart-2 font-bold">
                            {formatBRL(Number(withdrawal.amount))}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteWithdrawal.mutate(withdrawal.id)}
                              disabled={deleteWithdrawal.isPending}
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </SectionCard>
          </TabsContent>

          {/* Fixed Expenses Tab */}
          <TabsContent value="fixed" className="space-y-6">
            <SectionCard title="Gastos Fixos Mensais" icon={Calendar} color="green">
              <p className="text-muted-foreground text-xs md:text-sm mb-4">
                Despesas que se repetem todo mês. Total mensal: <span className="text-primary font-bold">{formatBRL(fixedExpensesTotal)}</span>
              </p>
              
              {/* Add Fixed Expense Form */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
                <div className="sm:col-span-2 lg:col-span-2">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Descrição</Label>
                  <Input
                    value={newFixedExpense.description}
                    onChange={(e) => setNewFixedExpense({ ...newFixedExpense, description: e.target.value })}
                    placeholder="Ex: Hospedagem, Ferramentas"
                    className="bg-card/60 border-border text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Valor Mensal</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newFixedExpense.amount}
                    onChange={(e) => setNewFixedExpense({ ...newFixedExpense, amount: e.target.value })}
                    placeholder="0,00"
                    className="bg-card/60 border-border text-foreground focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider">Pago por</Label>
                  <Select value={newFixedExpense.paid_by} onValueChange={(v) => setNewFixedExpense({ ...newFixedExpense, paid_by: v })}>
                    <SelectTrigger className="bg-card/60 border-border text-foreground focus:border-primary mt-1">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 border-border">
                      <SelectItem value={partner1} className="text-foreground hover:bg-primary/20">{partner1}</SelectItem>
                      <SelectItem value={partner2} className="text-foreground hover:bg-primary/20">{partner2}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleAddFixedExpense} 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                    disabled={addFixedExpense.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Fixed Expenses List */}
              <div className="space-y-3">
                {fixedExpenses?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <span>Nenhum gasto fixo cadastrado</span>
                  </div>
                ) : (
                  fixedExpenses?.map((expense) => (
                    <div 
                      key={expense.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        expense.is_active 
                          ? 'bg-primary/5 border-primary/30' 
                          : 'bg-muted/50 border-border opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleFixedExpense.mutate({ id: expense.id, is_active: !expense.is_active })}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {expense.is_active ? (
                            <ToggleRight className="h-6 w-6 text-primary" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                        <div>
                          <p className={`font-medium ${expense.is_active ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {expense.description}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Pago por: <span className="text-primary">{expense.paid_by}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-mono font-bold ${expense.is_active ? 'text-chart-2' : 'text-muted-foreground'}`}>
                          {formatBRL(Number(expense.amount))}/mês
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteFixedExpense.mutate(expense.id)}
                          disabled={deleteFixedExpense.isPending}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>
          </TabsContent>
        </Tabs>

        {/* Receipt View Dialog */}
        <Dialog open={!!receiptFilePath} onOpenChange={() => setReceiptFilePath(null)}>
          <DialogContent className="bg-popover/95 border-2 border-primary/30 backdrop-blur-xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-primary">
                Comprovante
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center min-h-[200px] items-center">
              {isLoadingReceipt ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <span className="text-muted-foreground text-sm">Carregando...</span>
                </div>
              ) : viewReceiptUrl ? (
                <img 
                  src={viewReceiptUrl} 
                  alt="Comprovante" 
                  className="max-w-full max-h-[70vh] rounded-lg border border-primary/30"
                />
              ) : (
                <span className="text-muted-foreground">Erro ao carregar comprovante</span>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardWrapper>
  );
}