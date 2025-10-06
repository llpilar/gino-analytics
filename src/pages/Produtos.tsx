import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { ProductSalesTable } from "@/components/ProductSalesTable";

export default function Produtos() {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-black via-zinc-900 to-zinc-800">
      <DashboardSidebar />
      
      <main className="flex-1 min-w-0">
        <DashboardHeader />
        
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

        <footer className="border-t border-zinc-800 mt-12 py-4">
          <div className="px-4 md:px-6 lg:px-8">
            <p className="text-center text-xs text-zinc-500">
              Built with <span className="text-primary">Lovable</span> • ShopDash Analytics Dashboard
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}