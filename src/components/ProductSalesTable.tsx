import { useProductSales } from "@/hooks/useProductSales";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

export const ProductSalesTable = () => {
  const { data: productSales, isLoading } = useProductSales();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  if (!productSales || productSales.length === 0) {
    return (
      <Card className="glass-card border-zinc-800 p-8 text-center">
        <p className="text-zinc-400">Nenhuma venda encontrada nos últimos 30 dias</p>
      </Card>
    );
  }

  return (
    <Card className="glass-card border-zinc-800">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold text-white">Vendas por Produto (Últimos 30 dias)</h2>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Posição</TableHead>
                <TableHead className="text-zinc-400">Produto</TableHead>
                <TableHead className="text-zinc-400 text-right">Quantidade Vendida</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productSales.map((product, index) => (
                <TableRow 
                  key={product.productId}
                  className="border-zinc-800 hover:bg-zinc-800/30 transition-colors"
                >
                  <TableCell className="font-medium text-zinc-400">
                    #{index + 1}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {product.productTitle}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/20 text-primary font-bold">
                      {product.totalQuantity} unidades
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Card>
  );
};