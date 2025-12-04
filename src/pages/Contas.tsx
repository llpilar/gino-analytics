import { useState, useRef, useEffect } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Settings, DollarSign, TrendingUp, TrendingDown, Users, Wallet, ImageIcon, X, Eye, Loader2 } from "lucide-react";
import { useExpenses, usePartnersConfig, useAddExpense, useDeleteExpense, useUpdatePartnersConfig, uploadReceipt, getReceiptSignedUrl } from "@/hooks/useExpenses";

const formatBRL = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { toast } from "sonner";

const CATEGORIES = [
  "Marketing",
  "Produtos",
  "Frete",
  "Impostos",
  "Ferramentas",
  "Outros",
];

export default function Contas() {
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const { data: partnersConfig, isLoading: configLoading } = usePartnersConfig();
  const addExpense = useAddExpense();
  const deleteExpense = useDeleteExpense();
  const updateConfig = useUpdatePartnersConfig();
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

  // Load signed URL when receipt file path is set
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

  if (expensesLoading || configLoading) {
    return (
      <DashboardWrapper>
        <div className="container mx-auto p-6 md:p-8 lg:p-12 min-h-screen">
          <Skeleton className="h-10 w-48 bg-gray-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-gray-800" />
            ))}
          </div>
          <Skeleton className="h-96 mt-8 bg-gray-800" />
        </div>
      </DashboardWrapper>
    );
  }

  const statCards = [
    {
      title: "Total Gasto",
      value: formatBRL(totalExpenses),
      icon: DollarSign,
      color: "from-cyan-500 to-blue-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/30"
    },
    {
      title: partner1,
      value: formatBRL(partner1Total),
      subtitle: partner1Balance > 0 ? `Receber ${formatBRL(partner1Balance)}` : partner1Balance < 0 ? `Deve ${formatBRL(Math.abs(partner1Balance))}` : 'Equilibrado',
      subtitleColor: partner1Balance > 0 ? 'text-green-400' : partner1Balance < 0 ? 'text-red-400' : 'text-gray-400',
      icon: Users,
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30"
    },
    {
      title: partner2,
      value: formatBRL(partner2Total),
      subtitle: partner2Balance > 0 ? `Receber ${formatBRL(partner2Balance)}` : partner2Balance < 0 ? `Deve ${formatBRL(Math.abs(partner2Balance))}` : 'Equilibrado',
      subtitleColor: partner2Balance > 0 ? 'text-green-400' : partner2Balance < 0 ? 'text-red-400' : 'text-gray-400',
      icon: Users,
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/30"
    },
    {
      title: "Acerto",
      value: partner1Balance === 0 ? "Tudo certo!" : partner1Balance > 0 
        ? `${partner2} → ${partner1}` 
        : `${partner1} → ${partner2}`,
      subtitle: partner1Balance !== 0 ? formatBRL(Math.abs(partner1Balance)) : undefined,
      subtitleColor: 'text-green-400',
      icon: partner1Balance >= 0 ? TrendingUp : TrendingDown,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/30"
    }
  ];

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <PageHeader 
            title="Controle de Contas"
            subtitle="Gerencie as despesas entre os sócios"
            icon={<Wallet className="h-8 w-8 text-cyan-400" />}
          />
          <Dialog open={configDialog} onOpenChange={setConfigDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                onClick={() => setNewConfig({ partner1_name: partner1, partner2_name: partner2 })}
                className="bg-black/80 border-2 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurar Nomes
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-black/95 border-2 border-cyan-500/30 backdrop-blur-xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Configurar Nomes dos Sócios
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label className="text-gray-400">Nome do Sócio 1</Label>
                  <Input
                    value={newConfig.partner1_name}
                    onChange={(e) => setNewConfig({ ...newConfig, partner1_name: e.target.value })}
                    placeholder="Nome do primeiro sócio"
                    className="bg-black/60 border-purple-500/30 text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <Label className="text-gray-400">Nome do Sócio 2</Label>
                  <Input
                    value={newConfig.partner2_name}
                    onChange={(e) => setNewConfig({ ...newConfig, partner2_name: e.target.value })}
                    placeholder="Nome do segundo sócio"
                    className="bg-black/60 border-orange-500/30 text-white focus:border-orange-500"
                  />
                </div>
                <Button 
                  onClick={handleUpdateConfig} 
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
                >
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`group relative p-6 rounded-2xl bg-black/80 border-2 ${stat.borderColor} backdrop-blur-xl 
                  hover:scale-105 transition-all duration-300 cursor-pointer overflow-hidden`}
              >
                {/* Glow effect */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor} border ${stat.borderColor}`}>
                      <Icon className="h-6 w-6 text-cyan-400" />
                    </div>
                  </div>
                  
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {stat.title}
                  </div>
                  <div className={`text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>
                    {stat.value}
                  </div>
                  {stat.subtitle && (
                    <div className={`text-sm mt-2 font-bold ${stat.subtitleColor}`}>
                      {stat.subtitle}
                    </div>
                  )}
                </div>

                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-cyan-500/50 opacity-0 group-hover:opacity-100 animate-pulse transition-opacity" />
              </div>
            );
          })}
        </div>

        {/* Add Expense Form */}
        <div className="p-6 rounded-2xl bg-black/80 border-2 border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Nova Despesa
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            <div className="md:col-span-2">
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Descrição</Label>
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="Ex: Facebook Ads"
                className="bg-black/60 border-cyan-500/30 text-white focus:border-cyan-500 mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0,00"
                className="bg-black/60 border-cyan-500/30 text-white focus:border-cyan-500 mt-1"
              />
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Pago por</Label>
              <Select value={newExpense.paid_by} onValueChange={(v) => setNewExpense({ ...newExpense, paid_by: v })}>
                <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white focus:border-cyan-500 mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-cyan-500/30">
                  <SelectItem value={partner1} className="text-white hover:bg-cyan-500/20">{partner1}</SelectItem>
                  <SelectItem value={partner2} className="text-white hover:bg-cyan-500/20">{partner2}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-400 text-xs uppercase tracking-wider">Categoria</Label>
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                <SelectTrigger className="bg-black/60 border-cyan-500/30 text-white focus:border-cyan-500 mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-cyan-500/30">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-cyan-500/20">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddExpense} 
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold"
                disabled={addExpense.isPending || isUploading}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Adicionar'}
              </Button>
            </div>
          </div>

          {/* Receipt Upload Section */}
          <div className="mt-4 p-4 rounded-xl bg-black/40 border border-cyan-500/20">
            <Label className="text-gray-400 text-xs uppercase tracking-wider mb-2 block">Comprovante (opcional)</Label>
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
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 cursor-pointer hover:bg-purple-500/30 transition-colors"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-sm font-medium">Anexar Imagem</span>
              </label>
              
              {previewUrl && (
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-16 w-16 object-cover rounded-lg border border-cyan-500/30"
                  />
                  <button
                    onClick={clearSelectedFile}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              )}
              
              {selectedFile && (
                <span className="text-sm text-gray-400">{selectedFile.name}</span>
              )}
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="p-6 rounded-2xl bg-black/80 border-2 border-purple-500/30 backdrop-blur-xl shadow-2xl shadow-purple-500/10">
          <div className="flex items-center gap-2 mb-6">
            <DollarSign className="h-6 w-6 text-purple-400" />
            <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Histórico de Despesas
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-purple-500/30 hover:bg-transparent">
                  <TableHead className="text-gray-400 text-xs uppercase tracking-wider">Data</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase tracking-wider">Descrição</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase tracking-wider">Categoria</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase tracking-wider">Pago por</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase tracking-wider text-right">Valor</TableHead>
                  <TableHead className="text-gray-400 text-xs uppercase tracking-wider text-center">Comprovante</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="h-12 w-12 text-gray-700" />
                        <span>Nenhuma despesa registrada ainda</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses?.map((expense) => (
                    <TableRow key={expense.id} className="border-b border-purple-500/10 hover:bg-purple-500/5">
                      <TableCell className="text-gray-300">
                        {format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-medium text-white">{expense.description}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                          {expense.category || "Outros"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${expense.paid_by === partner1 ? 'text-purple-400' : 'text-orange-400'}`}>
                          {expense.paid_by}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-400 font-bold">
                        {formatBRL(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="text-center">
                        {expense.receipt_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReceiptFilePath(expense.receipt_url)}
                            className="hover:bg-cyan-500/20 text-cyan-400"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-gray-600 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpense.mutate(expense.id)}
                          disabled={deleteExpense.isPending}
                          className="hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Receipt View Dialog */}
        <Dialog open={!!receiptFilePath} onOpenChange={() => setReceiptFilePath(null)}>
          <DialogContent className="bg-black/95 border-2 border-cyan-500/30 backdrop-blur-xl max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Comprovante
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center min-h-[200px] items-center">
              {isLoadingReceipt ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                  <span className="text-gray-400 text-sm">Carregando...</span>
                </div>
              ) : viewReceiptUrl ? (
                <img 
                  src={viewReceiptUrl} 
                  alt="Comprovante" 
                  className="max-w-full max-h-[70vh] rounded-lg border border-cyan-500/30"
                />
              ) : (
                <span className="text-gray-400">Erro ao carregar comprovante</span>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardWrapper>
  );
}
