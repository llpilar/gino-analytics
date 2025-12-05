import { useProductSales } from "@/hooks/useProductSales";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Package } from "lucide-react";
import { SectionCard } from "@/components/ui/stats-card";

export const ProductSalesTable = () => {
  const { data: productSales, isLoading } = useProductSales();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-purple-500/10" />
        ))}
      </div>
    );
  }

  if (!productSales || productSales.length === 0) {
    return (
      <SectionCard color="purple" className="text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-purple-400 opacity-50" />
        <p className="text-muted-foreground">Nenhuma venda encontrada nos últimos 30 dias</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Vendas por Produto" icon={TrendingUp} color="purple">
      <p className="text-sm text-muted-foreground mb-4">Últimos 30 dias</p>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-purple-500/20 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Posição</TableHead>
              <TableHead className="text-muted-foreground">Produto</TableHead>
              <TableHead className="text-muted-foreground text-right">Quantidade Vendida</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productSales.map((product, index) => (
              <TableRow 
                key={product.productId}
                className="border-purple-500/10 hover:bg-purple-500/5 transition-colors"
              >
                <TableCell className="font-medium text-muted-foreground">
                  #{index + 1}
                </TableCell>
                <TableCell className="text-foreground font-medium">
                  {product.productTitle}
                </TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 font-bold">
                    {product.totalQuantity} unidades
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  );
};
