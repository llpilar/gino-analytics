import { DashboardWrapper } from "@/components/DashboardWrapper";
import { ShoppingBag } from "lucide-react";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { ProductSalesTable } from "@/components/ProductSalesTable";

export default function Produtos() {
  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <ShoppingBag className="h-7 w-7 text-purple-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Products
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">Gerencie seus produtos e visualize estatísticas de vendas</p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-black/60 border border-purple-500/30 backdrop-blur-xl">
            <ProductSalesTable />
          </div>
          <div className="p-6 rounded-2xl bg-black/60 border border-purple-500/30 backdrop-blur-xl">
            <ShopifyProductList />
          </div>
        </div>
      </div>
    </DashboardWrapper>
  );
}