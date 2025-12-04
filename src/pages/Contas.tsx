import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Settings, DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { useExpenses, usePartnersConfig, useAddExpense, useDeleteExpense, useUpdatePartnersConfig } from "@/hooks/useExpenses";
import { useCurrency } from "@/contexts/CurrencyContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { formatCurrency } = useCurrency();

  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    paid_by: "",
    category: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
  });

  const [configDialog, setConfigDialog] = useState(false);
  const [newConfig, setNewConfig] = useState({
    partner1_name: "",
    partner2_name: "",
  });

  const partner1 = partnersConfig?.partner1_name || "Sócio 1";
  const partner2 = partnersConfig?.partner2_name || "Sócio 2";

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount || !newExpense.paid_by) return;
    
    addExpense.mutate({
      description: newExpense.description,
      amount: parseFloat(newExpense.amount),
      paid_by: newExpense.paid_by,
      category: newExpense.category || null,
      expense_date: newExpense.expense_date,
    });
    
    setNewExpense({
      description: "",
      amount: "",
      paid_by: "",
      category: "",
      expense_date: format(new Date(), "yyyy-MM-dd"),
    });
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
      <DashboardLayout>
        <div className="space-y-6 p-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Controle de Contas</h1>
            <p className="text-muted-foreground">Gerencie as despesas entre os sócios</p>
          </div>
          <Dialog open={configDialog} onOpenChange={setConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setNewConfig({ partner1_name: partner1, partner2_name: partner2 })}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar Nomes
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configurar Nomes dos Sócios</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Nome do Sócio 1</Label>
                  <Input
                    value={newConfig.partner1_name}
                    onChange={(e) => setNewConfig({ ...newConfig, partner1_name: e.target.value })}
                    placeholder="Nome do primeiro sócio"
                  />
                </div>
                <div>
                  <Label>Nome do Sócio 2</Label>
                  <Input
                    value={newConfig.partner2_name}
                    onChange={(e) => setNewConfig({ ...newConfig, partner2_name: e.target.value })}
                    placeholder="Nome do segundo sócio"
                  />
                </div>
                <Button onClick={handleUpdateConfig} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Gasto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(totalExpenses)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {partner1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(partner1Total)}</p>
              <p className={`text-sm ${partner1Balance > 0 ? 'text-green-500' : partner1Balance < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {partner1Balance > 0 ? `Receber ${formatCurrency(partner1Balance)}` : partner1Balance < 0 ? `Deve ${formatCurrency(Math.abs(partner1Balance))}` : 'Equilibrado'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                {partner2}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(partner2Total)}</p>
              <p className={`text-sm ${partner2Balance > 0 ? 'text-green-500' : partner2Balance < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                {partner2Balance > 0 ? `Receber ${formatCurrency(partner2Balance)}` : partner2Balance < 0 ? `Deve ${formatCurrency(Math.abs(partner2Balance))}` : 'Equilibrado'}
              </p>
            </CardContent>
          </Card>

          <Card className={partner1Balance !== 0 ? 'border-primary' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {partner1Balance > 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                Acerto
              </CardTitle>
            </CardHeader>
            <CardContent>
              {partner1Balance === 0 ? (
                <p className="text-lg font-medium text-muted-foreground">Tudo certo!</p>
              ) : partner1Balance > 0 ? (
                <p className="text-lg font-medium">
                  <span className="text-red-500">{partner2}</span> deve pagar <span className="text-green-500 font-bold">{formatCurrency(partner1Balance)}</span> para <span className="text-green-500">{partner1}</span>
                </p>
              ) : (
                <p className="text-lg font-medium">
                  <span className="text-red-500">{partner1}</span> deve pagar <span className="text-green-500 font-bold">{formatCurrency(Math.abs(partner1Balance))}</span> para <span className="text-green-500">{partner2}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Add Expense Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Nova Despesa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <Label>Descrição</Label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Ex: Facebook Ads"
                />
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div>
                <Label>Pago por</Label>
                <Select value={newExpense.paid_by} onValueChange={(v) => setNewExpense({ ...newExpense, paid_by: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={partner1}>{partner1}</SelectItem>
                    <SelectItem value={partner2}>{partner2}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={newExpense.category} onValueChange={(v) => setNewExpense({ ...newExpense, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddExpense} className="w-full" disabled={addExpense.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Despesas</CardTitle>
            <CardDescription>Todas as despesas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Pago por</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhuma despesa registrada ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses?.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(new Date(expense.expense_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{expense.category || "-"}</TableCell>
                      <TableCell>
                        <span className={expense.paid_by === partner1 ? 'text-blue-500' : 'text-purple-500'}>
                          {expense.paid_by}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">{formatCurrency(Number(expense.amount))}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteExpense.mutate(expense.id)}
                          disabled={deleteExpense.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
