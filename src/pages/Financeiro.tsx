import { useState, useRef, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Settings, DollarSign, ImageIcon, X, Eye, Loader2, Calendar, ToggleLeft, ToggleRight, Banknote, ArrowDownCircle, FileSpreadsheet } from "lucide-react";
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

// Excel-style cell component
const ExcelCell = ({ 
  children, 
  className = "", 
  header = false,
  align = "left",
  width,
}: { 
  children: React.ReactNode; 
  className?: string; 
  header?: boolean;
  align?: "left" | "center" | "right";
  width?: string;
}) => {
  const alignClass = align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left";
  const baseClass = header 
    ? "bg-muted/80 font-semibold text-foreground text-xs uppercase tracking-wide" 
    : "bg-background text-foreground";
  
  return (
    <div 
      className={`border border-border px-3 py-2 ${baseClass} ${alignClass} ${className}`}
      style={width ? { width, minWidth: width } : {}}
    >
      {children}
    </div>
  );
};

// Excel-style input cell
const ExcelInputCell = ({ 
  value, 
  onChange, 
  placeholder,
  type = "text",
  className = "",
}: { 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  type?: string;
  className?: string;
}) => (
  <input 
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={`w-full h-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${className}`}
  />
);

// Excel-style select cell
const ExcelSelectCell = ({ 
  value, 
  onChange, 
  options,
  placeholder,
}: { 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[];
  placeholder?: string;
}) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger className="w-full h-full bg-background border border-border rounded-none text-sm focus:ring-2 focus:ring-primary">
      <SelectValue placeholder={placeholder} />
    </SelectTrigger>
    <SelectContent className="bg-popover border-border">
      {options.map((opt) => (
        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
      ))}
    </SelectContent>
  </Select>
);

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

  // Calculate open balance
  const partner1OpenBalance = partner1Total - partner1Withdrawals;
  const partner2OpenBalance = partner2Total - partner2Withdrawals;
  const nextToWithdraw = partner1OpenBalance > partner2OpenBalance ? partner1 : partner2;
  const nextWithdrawAmount = Math.max(partner1OpenBalance, partner2OpenBalance);

  if (expensesLoading || configLoading || fixedLoading || withdrawalsLoading) {
    return (
      <DashboardWrapper>
        <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 py-4 min-h-screen">
          <Skeleton className="h-10 w-48 bg-muted" />
          <div className="mt-6 space-y-2">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-10 bg-muted" />
            ))}
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="w-full max-w-[2400px] mx-auto px-3 sm:px-4 md:px-6 py-4 min-h-screen pb-24 md:pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-primary" />
            <PageHeader 
              title="Financeiro"
              subtitle="Planilha de controle financeiro"
            />
          </div>
          <Dialog open={configDialog} onOpenChange={setConfigDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setNewConfig({ partner1_name: partner1, partner2_name: partner2 })}
                className="border-border"
              >
                <Settings className="h-4 w-4 mr-2" />
                Sócios
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

        {/* Summary Spreadsheet */}
        <div className="mb-6 overflow-x-auto">
          <div className="inline-block min-w-full">
            <div className="grid grid-cols-6 border-2 border-border rounded-lg overflow-hidden bg-background">
              {/* Header Row */}
              <ExcelCell header>RESUMO</ExcelCell>
              <ExcelCell header align="center">{partner1}</ExcelCell>
              <ExcelCell header align="center">{partner2}</ExcelCell>
              <ExcelCell header align="right">TOTAL</ExcelCell>
              <ExcelCell header align="right">SALDO</ExcelCell>
              <ExcelCell header align="center">STATUS</ExcelCell>
              
              {/* Expenses Row */}
              <ExcelCell className="font-medium">Despesas</ExcelCell>
              <ExcelCell align="center" className="font-mono">{formatBRL(partner1Total)}</ExcelCell>
              <ExcelCell align="center" className="font-mono">{formatBRL(partner2Total)}</ExcelCell>
              <ExcelCell align="right" className="font-mono font-semibold text-primary">{formatBRL(totalExpenses)}</ExcelCell>
              <ExcelCell align="right" className="font-mono">-</ExcelCell>
              <ExcelCell align="center">-</ExcelCell>
              
              {/* Withdrawals Row */}
              <ExcelCell className="font-medium">Saques</ExcelCell>
              <ExcelCell align="center" className="font-mono">{formatBRL(partner1Withdrawals)}</ExcelCell>
              <ExcelCell align="center" className="font-mono">{formatBRL(partner2Withdrawals)}</ExcelCell>
              <ExcelCell align="right" className="font-mono font-semibold text-orange-500">{formatBRL(totalWithdrawals)}</ExcelCell>
              <ExcelCell align="right" className="font-mono">-</ExcelCell>
              <ExcelCell align="center">-</ExcelCell>
              
              {/* Open Balance Row */}
              <ExcelCell className="font-medium bg-muted/40">Saldo Aberto</ExcelCell>
              <ExcelCell align="center" className={`font-mono font-bold bg-muted/40 ${partner1OpenBalance > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {formatBRL(partner1OpenBalance)}
              </ExcelCell>
              <ExcelCell align="center" className={`font-mono font-bold bg-muted/40 ${partner2OpenBalance > 0 ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                {formatBRL(partner2OpenBalance)}
              </ExcelCell>
              <ExcelCell align="right" className="font-mono bg-muted/40">-</ExcelCell>
              <ExcelCell align="right" className="font-mono font-bold bg-muted/40 text-primary">
                {formatBRL(partner1OpenBalance + partner2OpenBalance)}
              </ExcelCell>
              <ExcelCell align="center" className="bg-muted/40 text-xs">
                {nextWithdrawAmount > 0 ? (
                  <span className="text-emerald-500 font-medium">{nextToWithdraw} saca</span>
                ) : (
                  <span className="text-muted-foreground">Equilibrado</span>
                )}
              </ExcelCell>
              
              {/* Balance Row */}
              <ExcelCell className="font-medium bg-primary/10">Acerto</ExcelCell>
              <ExcelCell align="center" className={`font-mono font-bold bg-primary/10 ${partner1Balance > 0 ? 'text-emerald-500' : partner1Balance < 0 ? 'text-destructive' : ''}`}>
                {partner1Balance > 0 ? `+${formatBRL(partner1Balance)}` : formatBRL(partner1Balance)}
              </ExcelCell>
              <ExcelCell align="center" className={`font-mono font-bold bg-primary/10 ${partner2Balance > 0 ? 'text-emerald-500' : partner2Balance < 0 ? 'text-destructive' : ''}`}>
                {partner2Balance > 0 ? `+${formatBRL(partner2Balance)}` : formatBRL(partner2Balance)}
              </ExcelCell>
              <ExcelCell align="right" className="bg-primary/10">-</ExcelCell>
              <ExcelCell align="right" className="bg-primary/10">-</ExcelCell>
              <ExcelCell align="center" className="bg-primary/10 text-xs font-medium">
                {partner1Balance === 0 ? '✓ OK' : partner1Balance > 0 ? `${partner2} deve` : `${partner1} deve`}
              </ExcelCell>
              
              {/* Fixed Expenses Row */}
              <ExcelCell className="font-medium border-t-2 border-border">Fixos/Mês</ExcelCell>
              <ExcelCell align="center" className="border-t-2 border-border">-</ExcelCell>
              <ExcelCell align="center" className="border-t-2 border-border">-</ExcelCell>
              <ExcelCell align="right" className="font-mono font-semibold text-amber-500 border-t-2 border-border">{formatBRL(fixedExpensesTotal)}</ExcelCell>
              <ExcelCell align="right" className="border-t-2 border-border">-</ExcelCell>
              <ExcelCell align="center" className="text-xs text-muted-foreground border-t-2 border-border">{activeFixedExpenses.length} ativos</ExcelCell>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList className="bg-muted border border-border h-auto p-1">
            <TabsTrigger value="expenses" className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4">
              <DollarSign className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Despesas</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4">
              <Banknote className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Saques</span>
            </TabsTrigger>
            <TabsTrigger value="fixed" className="data-[state=active]:bg-background text-xs sm:text-sm px-2 sm:px-4">
              <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Fixos</span>
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses" className="space-y-4">
            {/* New Expense Form - Excel Style */}
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <div className="bg-muted/60 border-b border-border px-4 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Despesa
                </span>
                {/* Receipt upload */}
                <div className="flex items-center gap-2">
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
                    className="flex items-center gap-1 px-2 py-1 text-xs rounded border border-border bg-background cursor-pointer hover:bg-muted transition-colors"
                  >
                    <ImageIcon className="h-3 w-3" />
                    Anexar
                  </label>
                  {previewUrl && (
                    <div className="relative">
                      <img src={previewUrl} alt="Preview" className="h-8 w-8 object-cover rounded border border-border" />
                      <button
                        onClick={clearSelectedFile}
                        className="absolute -top-1 -right-1 p-0.5 bg-destructive rounded-full"
                      >
                        <X className="h-2 w-2 text-destructive-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-6 bg-background">
                <div className="col-span-2">
                  <ExcelInputCell 
                    value={newExpense.description}
                    onChange={(v) => setNewExpense({ ...newExpense, description: v })}
                    placeholder="Descrição..."
                  />
                </div>
                <div>
                  <ExcelInputCell 
                    type="number"
                    value={newExpense.amount}
                    onChange={(v) => setNewExpense({ ...newExpense, amount: v })}
                    placeholder="Valor"
                  />
                </div>
                <div>
                  <ExcelSelectCell
                    value={newExpense.paid_by}
                    onChange={(v) => setNewExpense({ ...newExpense, paid_by: v })}
                    options={[
                      { value: partner1, label: partner1 },
                      { value: partner2, label: partner2 },
                    ]}
                    placeholder="Pago por"
                  />
                </div>
                <div>
                  <ExcelSelectCell
                    value={newExpense.category}
                    onChange={(v) => setNewExpense({ ...newExpense, category: v })}
                    options={CATEGORIES.map(c => ({ value: c, label: c }))}
                    placeholder="Categoria"
                  />
                </div>
                <div>
                  <Button 
                    onClick={handleAddExpense}
                    disabled={addExpense.isPending || isUploading}
                    className="w-full h-full rounded-none"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {isUploading ? '...' : 'Add'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Expenses Table - Excel Style */}
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Header */}
                  <div className="grid grid-cols-[100px_1fr_120px_100px_120px_60px_50px] bg-muted/80 border-b-2 border-border">
                    <ExcelCell header>DATA</ExcelCell>
                    <ExcelCell header>DESCRIÇÃO</ExcelCell>
                    <ExcelCell header>CATEGORIA</ExcelCell>
                    <ExcelCell header>PAGO POR</ExcelCell>
                    <ExcelCell header align="right">VALOR</ExcelCell>
                    <ExcelCell header align="center">📎</ExcelCell>
                    <ExcelCell header align="center">🗑</ExcelCell>
                  </div>
                  
                  {/* Body */}
                  {expenses?.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground bg-background">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Nenhuma despesa registrada</p>
                    </div>
                  ) : (
                    expenses?.map((expense, idx) => (
                      <div 
                        key={expense.id} 
                        className={`grid grid-cols-[100px_1fr_120px_100px_120px_60px_50px] ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5 transition-colors`}
                      >
                        <ExcelCell className="font-mono text-xs text-muted-foreground">
                          {format(new Date(expense.expense_date), "dd/MM/yy")}
                        </ExcelCell>
                        <ExcelCell className="font-medium truncate">{expense.description}</ExcelCell>
                        <ExcelCell>
                          <span className="px-2 py-0.5 rounded text-xs bg-muted text-foreground">
                            {expense.category || "Outros"}
                          </span>
                        </ExcelCell>
                        <ExcelCell className="font-medium text-primary">{expense.paid_by}</ExcelCell>
                        <ExcelCell align="right" className="font-mono font-bold text-emerald-500">
                          {formatBRL(Number(expense.amount))}
                        </ExcelCell>
                        <ExcelCell align="center">
                          {expense.receipt_url ? (
                            <button
                              onClick={() => setReceiptFilePath(expense.receipt_url)}
                              className="text-primary hover:underline text-xs"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </ExcelCell>
                        <ExcelCell align="center">
                          <button
                            onClick={() => deleteExpense.mutate(expense.id)}
                            disabled={deleteExpense.isPending}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ExcelCell>
                      </div>
                    ))
                  )}
                  
                  {/* Footer Total */}
                  {expenses && expenses.length > 0 && (
                    <div className="grid grid-cols-[100px_1fr_120px_100px_120px_60px_50px] bg-muted/60 border-t-2 border-border">
                      <ExcelCell className="font-bold">TOTAL</ExcelCell>
                      <ExcelCell className="font-medium text-muted-foreground">{expenses.length} registros</ExcelCell>
                      <ExcelCell>-</ExcelCell>
                      <ExcelCell>-</ExcelCell>
                      <ExcelCell align="right" className="font-mono font-bold text-primary text-lg">
                        {formatBRL(totalExpenses)}
                      </ExcelCell>
                      <ExcelCell align="center">-</ExcelCell>
                      <ExcelCell align="center">-</ExcelCell>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Withdrawals Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            {/* New Withdrawal Form */}
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <div className="bg-muted/60 border-b border-border px-4 py-2">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4" />
                  Novo Saque
                </span>
              </div>
              <div className="grid grid-cols-5 bg-background">
                <div>
                  <ExcelSelectCell
                    value={newWithdrawal.partner_name}
                    onChange={(v) => setNewWithdrawal({ ...newWithdrawal, partner_name: v })}
                    options={[
                      { value: partner1, label: partner1 },
                      { value: partner2, label: partner2 },
                    ]}
                    placeholder="Quem sacou"
                  />
                </div>
                <div>
                  <ExcelInputCell 
                    type="number"
                    value={newWithdrawal.amount}
                    onChange={(v) => setNewWithdrawal({ ...newWithdrawal, amount: v })}
                    placeholder="Valor"
                  />
                </div>
                <div>
                  <input
                    type="date"
                    value={newWithdrawal.withdrawal_date}
                    onChange={(e) => setNewWithdrawal({ ...newWithdrawal, withdrawal_date: e.target.value })}
                    className="w-full h-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <ExcelInputCell 
                    value={newWithdrawal.description}
                    onChange={(v) => setNewWithdrawal({ ...newWithdrawal, description: v })}
                    placeholder="Descrição (opt)"
                  />
                </div>
                <div>
                  <Button 
                    onClick={handleAddWithdrawal}
                    disabled={addWithdrawal.isPending}
                    className="w-full h-full rounded-none"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Withdrawals Table */}
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="grid grid-cols-[100px_120px_1fr_150px_50px] bg-muted/80 border-b-2 border-border">
                    <ExcelCell header>DATA</ExcelCell>
                    <ExcelCell header>QUEM</ExcelCell>
                    <ExcelCell header>DESCRIÇÃO</ExcelCell>
                    <ExcelCell header align="right">VALOR</ExcelCell>
                    <ExcelCell header align="center">🗑</ExcelCell>
                  </div>
                  
                  {withdrawals?.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground bg-background">
                      <Banknote className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Nenhum saque registrado</p>
                    </div>
                  ) : (
                    withdrawals?.map((withdrawal, idx) => (
                      <div 
                        key={withdrawal.id} 
                        className={`grid grid-cols-[100px_120px_1fr_150px_50px] ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-primary/5`}
                      >
                        <ExcelCell className="font-mono text-xs text-muted-foreground">
                          {format(new Date(withdrawal.withdrawal_date), "dd/MM/yy")}
                        </ExcelCell>
                        <ExcelCell className="font-medium text-primary">{withdrawal.partner_name}</ExcelCell>
                        <ExcelCell className="text-muted-foreground">{withdrawal.description || "-"}</ExcelCell>
                        <ExcelCell align="right" className="font-mono font-bold text-orange-500">
                          {formatBRL(Number(withdrawal.amount))}
                        </ExcelCell>
                        <ExcelCell align="center">
                          <button
                            onClick={() => deleteWithdrawal.mutate(withdrawal.id)}
                            disabled={deleteWithdrawal.isPending}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ExcelCell>
                      </div>
                    ))
                  )}
                  
                  {withdrawals && withdrawals.length > 0 && (
                    <div className="grid grid-cols-[100px_120px_1fr_150px_50px] bg-muted/60 border-t-2 border-border">
                      <ExcelCell className="font-bold">TOTAL</ExcelCell>
                      <ExcelCell className="text-muted-foreground">{withdrawals.length} saques</ExcelCell>
                      <ExcelCell>-</ExcelCell>
                      <ExcelCell align="right" className="font-mono font-bold text-primary text-lg">
                        {formatBRL(totalWithdrawals)}
                      </ExcelCell>
                      <ExcelCell>-</ExcelCell>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Fixed Expenses Tab */}
          <TabsContent value="fixed" className="space-y-4">
            {/* Add Fixed Expense Form */}
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <div className="bg-muted/60 border-b border-border px-4 py-2">
                <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Novo Gasto Fixo
                </span>
              </div>
              <div className="grid grid-cols-4 bg-background">
                <div>
                  <ExcelInputCell 
                    value={newFixedExpense.description}
                    onChange={(v) => setNewFixedExpense({ ...newFixedExpense, description: v })}
                    placeholder="Descrição"
                  />
                </div>
                <div>
                  <ExcelInputCell 
                    type="number"
                    value={newFixedExpense.amount}
                    onChange={(v) => setNewFixedExpense({ ...newFixedExpense, amount: v })}
                    placeholder="Valor/mês"
                  />
                </div>
                <div>
                  <ExcelSelectCell
                    value={newFixedExpense.paid_by}
                    onChange={(v) => setNewFixedExpense({ ...newFixedExpense, paid_by: v })}
                    options={[
                      { value: partner1, label: partner1 },
                      { value: partner2, label: partner2 },
                    ]}
                    placeholder="Pago por"
                  />
                </div>
                <div>
                  <Button 
                    onClick={handleAddFixedExpense}
                    disabled={addFixedExpense.isPending}
                    className="w-full h-full rounded-none"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Fixed Expenses Table */}
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[500px]">
                  <div className="grid grid-cols-[60px_1fr_120px_150px_50px] bg-muted/80 border-b-2 border-border">
                    <ExcelCell header align="center">ON</ExcelCell>
                    <ExcelCell header>DESCRIÇÃO</ExcelCell>
                    <ExcelCell header>PAGO POR</ExcelCell>
                    <ExcelCell header align="right">VALOR/MÊS</ExcelCell>
                    <ExcelCell header align="center">🗑</ExcelCell>
                  </div>
                  
                  {fixedExpenses?.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground bg-background">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>Nenhum gasto fixo cadastrado</p>
                    </div>
                  ) : (
                    fixedExpenses?.map((expense, idx) => (
                      <div 
                        key={expense.id} 
                        className={`grid grid-cols-[60px_1fr_120px_150px_50px] ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${!expense.is_active ? 'opacity-50' : ''} hover:bg-primary/5`}
                      >
                        <ExcelCell align="center">
                          <button
                            onClick={() => toggleFixedExpense.mutate({ id: expense.id, is_active: !expense.is_active })}
                            className="hover:opacity-80"
                          >
                            {expense.is_active ? (
                              <ToggleRight className="h-5 w-5 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                            )}
                          </button>
                        </ExcelCell>
                        <ExcelCell className={expense.is_active ? "font-medium" : "text-muted-foreground"}>
                          {expense.description}
                        </ExcelCell>
                        <ExcelCell className="text-primary">{expense.paid_by}</ExcelCell>
                        <ExcelCell align="right" className={`font-mono font-bold ${expense.is_active ? 'text-amber-500' : 'text-muted-foreground'}`}>
                          {formatBRL(Number(expense.amount))}
                        </ExcelCell>
                        <ExcelCell align="center">
                          <button
                            onClick={() => deleteFixedExpense.mutate(expense.id)}
                            disabled={deleteFixedExpense.isPending}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </ExcelCell>
                      </div>
                    ))
                  )}
                  
                  {fixedExpenses && fixedExpenses.length > 0 && (
                    <div className="grid grid-cols-[60px_1fr_120px_150px_50px] bg-muted/60 border-t-2 border-border">
                      <ExcelCell align="center">-</ExcelCell>
                      <ExcelCell className="font-bold">TOTAL MENSAL</ExcelCell>
                      <ExcelCell className="text-muted-foreground">{activeFixedExpenses.length} ativos</ExcelCell>
                      <ExcelCell align="right" className="font-mono font-bold text-primary text-lg">
                        {formatBRL(fixedExpensesTotal)}
                      </ExcelCell>
                      <ExcelCell>-</ExcelCell>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Receipt View Dialog */}
        <Dialog open={!!receiptFilePath} onOpenChange={() => setReceiptFilePath(null)}>
          <DialogContent className="bg-background border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle>Comprovante</DialogTitle>
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
                  className="max-w-full max-h-[70vh] rounded-lg border border-border"
                />
              ) : (
                <span className="text-muted-foreground">Erro ao carregar</span>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardWrapper>
  );
}
