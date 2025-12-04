import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Search, Filter, TrendingUp, Package, DollarSign } from "lucide-react";
import { ShopifyProductList } from "@/components/ShopifyProductList";
import { ProductSalesTable } from "@/components/ProductSalesTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useShopifyProducts } from "@/hooks/useShopifyData";
import { PageHeader } from "@/components/PageHeader";
import { StatsCard, SectionCard } from "@/components/ui/stats-card";

export default function Produtos() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data } = useShopifyProducts();
  
  const products = data?.data?.products?.edges?.map((edge: any) => edge.node) || [];
  const totalProducts = products.length;
  const totalValue = products.reduce((acc: number, product: any) => {
    const price = parseFloat(product.variants?.edges?.[0]?.node?.price || "0");
    return acc + price;
  }, 0);

  const avgPrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  return (
    <DashboardWrapper>
      <div className="container mx-auto p-6 md:p-8 lg:p-12 space-y-8">
        {/* Header */}
        <PageHeader 
          title="Produtos"
          subtitle="Gerencie seu catálogo e acompanhe vendas"
        />

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total de Produtos"
              value={totalProducts}
              icon={Package}
              color="cyan"
            />
            <StatsCard
              title="Valor do Catálogo"
              value={`$${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={DollarSign}
              color="purple"
            />
            <StatsCard
              title="Preço Médio"
              value={avgPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              icon={TrendingUp}
              color="green"
            />
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
        <SectionCard title="Catálogo de Produtos" icon={Package} color="purple">
          <ShopifyProductList searchQuery={searchQuery} />
        </SectionCard>

        {/* Sales Table */}
        <SectionCard title="Performance de Vendas" icon={TrendingUp} color="cyan">
          <ProductSalesTable />
        </SectionCard>
      </div>
    </DashboardWrapper>
  );
}