import { useState, useRef, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Settings, DollarSign, ImageIcon, X, Eye, Loader2, Download, Wallet, TrendingUp, ArrowDownCircle, Receipt, ChevronDown, ChevronUp } from "lucide-react";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

// CSV Export utilities
const downloadCSV = (data: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptFilePath, setReceiptFilePath] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: "", category: "" });
  const [withdrawalAmount, setWithdrawalAmount] = useState({ partner1: "", partner2: "" });
  const [activePartnerForm, setActivePartnerForm] = useState<string | null>(null);
  
  // Collapsible states
  const [showExpenses, setShowExpenses] = useState(true);
  const [showWithdrawals, setShowWithdrawals] = useState(false);
  const [showFixedExpenses, setShowFixedExpenses] = useState(false);

  // Config dialog
  const [configDialog, setConfigDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({ partner1_name: "", partner2_name: "" });

  // Fixed expense form
  const [fixedForm, setFixedForm] = useState({ description: "", amount: "", paid_by: "" });

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

  const handleAddExpense = async (partnerName: string) => {
    if (!expenseForm.description || !expenseForm.amount) return;
    
    setIsUploading(true);
    let receiptUrl: string | null = null;

    if (selectedFile) {
      receiptUrl = await uploadReceipt(selectedFile);
    }
    
    addExpense.mutate({
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      paid_by: partnerName,
      category: expenseForm.category || null,
      expense_date: format(new Date(), "yyyy-MM-dd"),
      receipt_url: receiptUrl,
    });
    
    setExpenseForm({ description: "", amount: "", category: "" });
    setActivePartnerForm(null);
    clearSelectedFile();
    setIsUploading(false);
  };

  const handleAddWithdrawal = (partnerName: string, amount: string) => {
    if (!amount) return;
    
    addWithdrawal.mutate({
      partner_name: partnerName,
      amount: parseFloat(amount),
      description: null,
      withdrawal_date: format(new Date(), "yyyy-MM-dd"),
    });
    
    setWithdrawalAmount({ partner1: "", partner2: "" });
  };

  const handleUpdateConfig = () => {
    if (!newConfig.partner1_name || !newConfig.partner2_name) return;
    updateConfig.mutate(newConfig);
    setConfigDialog(false);
  };

  const handleAddFixedExpense = () => {
    if (!fixedForm.description || !fixedForm.amount || !fixedForm.paid_by) return;
    
    addFixedExpense.mutate({
      description: fixedForm.description,
      amount: parseFloat(fixedForm.amount),
      paid_by: fixedForm.paid_by,
      category: null,
      is_active: true,
    });
    
    setFixedForm({ description: "", amount: "", paid_by: "" });
  };

  // Calculate totals per partner
  const partner1Expenses = expenses?.filter(e => e.paid_by === partner1).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  const partner2Expenses = expenses?.filter(e => e.paid_by === partner2).reduce((sum, e) => sum + Number(e.amount), 0) || 0;
  
  const partner1Withdrawals = withdrawals?.filter(w => w.partner_name === partner1).reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  const partner2Withdrawals = withdrawals?.filter(w => w.partner_name === partner2).reduce((sum, w) => sum + Number(w.amount), 0) || 0;
  
  const partner1Available = partner1Expenses - partner1Withdrawals;
  const partner2Available = partner2Expenses - partner2Withdrawals;

  // Fixed expenses
  const activeFixedExpenses = fixedExpenses?.filter(e => e.is_active) || [];
  const fixedExpensesTotal = activeFixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Export all
  const exportAllToCSV = () => {
    let csv = '';
    csv += 'RESUMO FINANCEIRO\n';
    csv += `Data;${format(new Date(), 'dd/MM/yyyy HH:mm')}\n\n`;
    
    csv += 'POR SÓCIO\n';
    csv += `Sócio;Gastos;Saques;Disponível\n`;
    csv += `${partner1};${partner1Expenses.toFixed(2).replace('.', ',')};${partner1Withdrawals.toFixed(2).replace('.', ',')};${partner1Available.toFixed(2).replace('.', ',')}\n`;
    csv += `${partner2};${partner2Expenses.toFixed(2).replace('.', ',')};${partner2Withdrawals.toFixed(2).replace('.', ',')};${partner2Available.toFixed(2).replace('.', ',')}\n\n`;
    
    csv += 'DESPESAS\n';
    csv += 'Data;Descrição;Categoria;Pago Por;Valor\n';
    expenses?.forEach(e => {
      csv += `${format(new Date(e.expense_date), 'dd/MM/yyyy')};${escapeCSV(e.description)};${escapeCSV(e.category || 'Outros')};${escapeCSV(e.paid_by)};${Number(e.amount).toFixed(2).replace('.', ',')}\n`;
    });
    csv += '\n';
    
    csv += 'SAQUES\n';
    csv += 'Data;Quem;Valor\n';
    withdrawals?.forEach(w => {
      csv += `${format(new Date(w.withdrawal_date), 'dd/MM/yyyy')};${escapeCSV(w.partner_name)};${Number(w.amount).toFixed(2).replace('.', ',')}\n`;
    });
    
    downloadCSV(csv, `financeiro_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success('Exportado!');
  };

  if (expensesLoading || configLoading || fixedLoading || withdrawalsLoading) {
    return (
      <DashboardWrapper>
        <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-10 w-48 bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 bg-muted rounded-xl" />
            <Skeleton className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  const PartnerCard = ({ 
    name, 
    expenses: partnerExpenses, 
    withdrawals: partnerWithdrawals, 
    available,
    isPartner1 
  }: { 
    name: string; 
    expenses: number; 
    withdrawals: number; 
    available: number;
    isPartner1: boolean;
  }) => {
    const partnerKey = isPartner1 ? 'partner1' : 'partner2';
    const isFormActive = activePartnerForm === name;
    
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
        </div>
        
        {/* Stats */}
        <div className="p-5 space-y-4">
          {/* Gastos */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Receipt className="h-4 w-4" />
              <span className="text-sm">Gastos</span>
            </div>
            <span className="font-mono font-semibold text-foreground">{formatBRL(partnerExpenses)}</span>
          </div>
          
          {/* Saques */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ArrowDownCircle className="h-4 w-4" />
              <span className="text-sm">Saques</span>
            </div>
            <span className="font-mono font-semibold text-orange-500">{formatBRL(partnerWithdrawals)}</span>
          </div>
          
          {/* Divider */}
          <div className="border-t border-border" />
          
          {/* Disponível */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wallet className="h-4 w-4" />
              <span className="text-sm font-medium">Disponível</span>
            </div>
            <span className={cn(
              "font-mono text-lg font-bold",
              available > 0 ? "text-emerald-500" : available < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {formatBRL(available)}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="px-5 pb-5 space-y-3">
          {/* Quick Withdrawal */}
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Valor do saque"
              value={isPartner1 ? withdrawalAmount.partner1 : withdrawalAmount.partner2}
              onChange={(e) => setWithdrawalAmount(prev => ({ 
                ...prev, 
                [partnerKey]: e.target.value 
              }))}
              className="flex-1 h-9 text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddWithdrawal(name, isPartner1 ? withdrawalAmount.partner1 : withdrawalAmount.partner2)}
              disabled={addWithdrawal.isPending || !(isPartner1 ? withdrawalAmount.partner1 : withdrawalAmount.partner2)}
              className="h-9 px-3"
            >
              <ArrowDownCircle className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Add Expense Button */}
          {!isFormActive ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActivePartnerForm(name)}
              className="w-full h-9 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar gasto
            </Button>
          ) : (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border">
              <Input
                placeholder="Descrição"
                value={expenseForm.description}
                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                className="h-9 text-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Valor"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="flex-1 h-9 text-sm"
                />
                <Select 
                  value={expenseForm.category} 
                  onValueChange={(v) => setExpenseForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger className="w-28 h-9 text-sm">
                    <SelectValue placeholder="Cat." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Receipt upload */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id={`receipt-${partnerKey}`}
                />
                <label
                  htmlFor={`receipt-${partnerKey}`}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-background cursor-pointer hover:bg-muted transition-colors"
                >
                  <ImageIcon className="h-3 w-3" />
                  Anexar
                </label>
                {previewUrl && (
                  <div className="relative">
                    <img src={previewUrl} alt="Preview" className="h-7 w-7 object-cover rounded border border-border" />
                    <button
                      onClick={clearSelectedFile}
                      className="absolute -top-1 -right-1 p-0.5 bg-destructive rounded-full"
                    >
                      <X className="h-2 w-2 text-destructive-foreground" />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setActivePartnerForm(null);
                    setExpenseForm({ description: "", amount: "", category: "" });
                    clearSelectedFile();
                  }}
                  className="flex-1 h-8"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAddExpense(name)}
                  disabled={addExpense.isPending || isUploading || !expenseForm.description || !expenseForm.amount}
                  className="flex-1 h-8"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <DashboardWrapper>
      <div className="w-full max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-12 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
              <p className="text-sm text-muted-foreground">Controle de gastos e saques</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportAllToCSV}
              className="border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Dialog open={configDialog} onOpenChange={setConfigDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setNewConfig({ partner1_name: partner1, partner2_name: partner2 })}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-background border-border">
                <DialogHeader>
                  <DialogTitle>Configurar Sócios</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Sócio 1</label>
                    <Input
                      value={newConfig.partner1_name}
                      onChange={(e) => setNewConfig({ ...newConfig, partner1_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Sócio 2</label>
                    <Input
                      value={newConfig.partner2_name}
                      onChange={(e) => setNewConfig({ ...newConfig, partner2_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <Button onClick={handleUpdateConfig} className="w-full">
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Partner Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PartnerCard 
            name={partner1} 
            expenses={partner1Expenses} 
            withdrawals={partner1Withdrawals} 
            available={partner1Available}
            isPartner1={true}
          />
          <PartnerCard 
            name={partner2} 
            expenses={partner2Expenses} 
            withdrawals={partner2Withdrawals} 
            available={partner2Available}
            isPartner1={false}
          />
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="font-medium text-foreground">Total Geral</span>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-primary">
                {formatBRL(partner1Expenses + partner2Expenses)}
              </div>
              <div className="text-xs text-muted-foreground">
                em gastos · {formatBRL(partner1Available + partner2Available)} disponível
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-3">
          {/* Expenses List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowExpenses(!showExpenses)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Histórico de Gastos</span>
                <span className="text-xs text-muted-foreground">({expenses?.length || 0})</span>
              </div>
              {showExpenses ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showExpenses && (
              <div className="border-t border-border">
                {expenses?.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum gasto registrado
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {expenses?.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">{expense.description}</span>
                            {expense.receipt_url && (
                              <button
                                onClick={() => setReceiptFilePath(expense.receipt_url)}
                                className="text-primary hover:text-primary/80"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{format(new Date(expense.expense_date), "dd/MM")}</span>
                            <span>·</span>
                            <span className="text-primary">{expense.paid_by}</span>
                            {expense.category && (
                              <>
                                <span>·</span>
                                <span>{expense.category}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-foreground">
                            {formatBRL(Number(expense.amount))}
                          </span>
                          <button
                            onClick={() => deleteExpense.mutate(expense.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Withdrawals List */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowWithdrawals(!showWithdrawals)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Histórico de Saques</span>
                <span className="text-xs text-muted-foreground">({withdrawals?.length || 0})</span>
              </div>
              {showWithdrawals ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showWithdrawals && (
              <div className="border-t border-border">
                {withdrawals?.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum saque registrado
                  </div>
                ) : (
                  <div className="divide-y divide-border max-h-60 overflow-y-auto">
                    {withdrawals?.map((withdrawal) => (
                      <div key={withdrawal.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div>
                          <span className="font-medium text-foreground">{withdrawal.partner_name}</span>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(withdrawal.withdrawal_date), "dd/MM/yyyy")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-orange-500">
                            {formatBRL(Number(withdrawal.amount))}
                          </span>
                          <button
                            onClick={() => deleteWithdrawal.mutate(withdrawal.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fixed Expenses */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowFixedExpenses(!showFixedExpenses)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Gastos Fixos Mensais</span>
                <span className="text-xs text-amber-500 font-medium">{formatBRL(fixedExpensesTotal)}/mês</span>
              </div>
              {showFixedExpenses ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {showFixedExpenses && (
              <div className="border-t border-border">
                {/* Add Fixed Expense Form */}
                <div className="p-3 bg-muted/30 border-b border-border">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Descrição"
                      value={fixedForm.description}
                      onChange={(e) => setFixedForm(prev => ({ ...prev, description: e.target.value }))}
                      className="flex-1 h-9 text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Valor"
                      value={fixedForm.amount}
                      onChange={(e) => setFixedForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-24 h-9 text-sm"
                    />
                    <Select 
                      value={fixedForm.paid_by} 
                      onValueChange={(v) => setFixedForm(prev => ({ ...prev, paid_by: v }))}
                    >
                      <SelectTrigger className="w-28 h-9 text-sm">
                        <SelectValue placeholder="Quem" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value={partner1}>{partner1}</SelectItem>
                        <SelectItem value={partner2}>{partner2}</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleAddFixedExpense}
                      disabled={addFixedExpense.isPending || !fixedForm.description || !fixedForm.amount || !fixedForm.paid_by}
                      className="h-9 px-3"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {fixedExpenses?.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum gasto fixo registrado
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {fixedExpenses?.map((fixed) => (
                      <div key={fixed.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleFixedExpense.mutate({ id: fixed.id, is_active: !fixed.is_active })}
                            className={cn(
                              "w-5 h-5 rounded border-2 transition-colors",
                              fixed.is_active 
                                ? "bg-primary border-primary" 
                                : "bg-transparent border-muted-foreground"
                            )}
                          >
                            {fixed.is_active && (
                              <svg className="w-full h-full text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                          <div className={cn(!fixed.is_active && "opacity-50")}>
                            <span className="font-medium text-foreground">{fixed.description}</span>
                            <div className="text-xs text-muted-foreground">{fixed.paid_by}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "font-mono font-semibold",
                            fixed.is_active ? "text-amber-500" : "text-muted-foreground"
                          )}>
                            {formatBRL(Number(fixed.amount))}
                          </span>
                          <button
                            onClick={() => deleteFixedExpense.mutate(fixed.id)}
                            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Receipt Viewer Dialog */}
        <Dialog open={!!receiptFilePath} onOpenChange={() => setReceiptFilePath(null)}>
          <DialogContent className="bg-background border-border max-w-lg">
            <DialogHeader>
              <DialogTitle>Comprovante</DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center min-h-[200px]">
              {isLoadingReceipt ? (
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              ) : viewReceiptUrl ? (
                <img src={viewReceiptUrl} alt="Comprovante" className="max-w-full max-h-[60vh] rounded-lg" />
              ) : (
                <p className="text-muted-foreground">Não foi possível carregar o comprovante</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardWrapper>
  );
}
