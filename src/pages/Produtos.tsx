import { DashboardWrapper } from "@/components/DashboardWrapper";
import { ShoppingBag, Search, Filter, TrendingUp, Package, DollarSign } from "lucide-react";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { ProductSalesTable } from "@/components/ProductSalesTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useShopifyProducts } from "@/hooks/useShopifyData";
import { PageHeader } from "@/components/PageHeader";

export default function Produtos() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useShopifyProducts();
  
  const products = data?.data?.products?.edges?.map((edge: any) => edge.node) || [];
  const totalProducts = products.length;
  const totalValue = products.reduce((acc: number, product: any) => {
    const price = parseFloat(product.variants?.edges?.[0]?.node?.price || "0");
    return acc + price;
  }, 0);

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12 space-y-8">
        {/* Header */}
        <PageHeader 
          title="Produtos"
          subtitle="Gerencie seu catálogo e acompanhe vendas"
          icon={<ShoppingBag className="h-8 w-8 text-purple-400" />}
        />

        <div className="space-y-6">

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border-2 border-cyan-500/30 backdrop-blur-xl hover:border-cyan-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <Package className="h-5 w-5 text-cyan-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {totalProducts}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">Total de Produtos</div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-2 border-purple-500/30 backdrop-blur-xl hover:border-purple-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <DollarSign className="h-5 w-5 text-purple-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">Valor do Catálogo</div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-2 border-green-500/30 backdrop-blur-xl hover:border-green-500/50 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <TrendingUp className="h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
                {totalProducts > 0 ? (totalValue / totalProducts).toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }) : '$0'}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-bold mt-1">Preço Médio</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Buscar produtos..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-black/60 border-gray-700/50 focus:border-purple-500/50 h-11"
              />
            </div>
            <Button 
              variant="outline" 
              className="border-gray-700/50 hover:border-purple-500/50 hover:bg-purple-500/10 gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-6 rounded-2xl bg-black/40 border-2 border-purple-500/20 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-400" />
            Catálogo de Produtos
          </h2>
          <ShopifyProductList searchQuery={searchQuery} />
        </div>

        {/* Sales Table */}
        <div className="p-6 rounded-2xl bg-black/40 border-2 border-cyan-500/20 backdrop-blur-xl">
          <h2 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            Performance de Vendas
          </h2>
          <ProductSalesTable />
        </div>
      </div>
    </DashboardWrapper>
  );
}