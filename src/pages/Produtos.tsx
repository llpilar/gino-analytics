import { DashboardLayout } from "@/components/DashboardLayout";
import { ShoppingBag } from "lucide-react";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { ProductSalesTable } from "@/components/ProductSalesTable";

export default function Produtos() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-white">Produtos</h1>
          </div>
          <p className="text-zinc-400">Gerencie seus produtos e visualize estatísticas de vendas</p>
        </div>

        <div className="space-y-6">
          <ProductSalesTable />
          <ShopifyProductList />
        </div>
      </div>
    </DashboardLayout>
  );
}