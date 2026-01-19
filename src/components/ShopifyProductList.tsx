import { useShopifyProducts } from "@/hooks/useShopifyData";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import DOMPurify from "dompurify";

interface ProductNode {
  id: string;
  title: string;
  descriptionHtml: string;
  images: {
    edges: Array<{
      node: {
        url: string;
        altText: string | null;
      };
    }>;
  };
  variants: {
    edges: Array<{
      node: {
        price: string;
        compareAtPrice: string | null;
        currencyCode: string;
      };
    }>;
  };
}

interface ShopifyProductListProps {
  searchQuery?: string;
}

export const ShopifyProductList = ({ searchQuery = "" }: ShopifyProductListProps) => {
  const { data, isLoading } = useShopifyProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="overflow-hidden bg-card border-border">
            <Skeleton className="w-full h-64 bg-muted" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-2/3 bg-muted" />
              <Skeleton className="h-10 w-full bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const allProducts: ProductNode[] = data?.data?.products?.edges?.map((edge: any) => edge.node) || [];
  
  const products = allProducts.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.descriptionHtml.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <ShoppingCart className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-lg font-medium">
          {searchQuery ? "Nenhum produto encontrado com esse termo" : "Nenhum produto encontrado"}
        </p>
        <p className="text-muted-foreground/60 text-sm mt-2">
          {searchQuery ? "Tente buscar por outro termo" : "Adicione produtos à sua loja"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => {
        const imageUrl = product.images?.edges?.[0]?.node?.url;
        const price = product.variants?.edges?.[0]?.node?.price || "0.00";
        const compareAtPrice = product.variants?.edges?.[0]?.node?.compareAtPrice;
        const currencyCode = product.variants?.edges?.[0]?.node?.currencyCode || 'COP';
        
        const currencySymbol = currencyCode === 'BRL' ? 'R$' : 
                               currencyCode === 'USD' ? '$' : 
                               '$';
        
        const hasDiscount = compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price);
        const discountPercentage = hasDiscount 
          ? Math.round(((parseFloat(compareAtPrice!) - parseFloat(price)) / parseFloat(compareAtPrice!)) * 100)
          : 0;

        return (
          <Card 
            key={product.id} 
            className="group overflow-hidden bg-card border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-1"
          >
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden bg-muted">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingCart className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {hasDiscount && (
                  <Badge className="bg-destructive text-destructive-foreground border-0 shadow-lg">
                    <Sparkles className="h-3 w-3 mr-1" />
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 border-0 shadow-lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Detalhes
                </Button>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="p-4 space-y-3">
              <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-all min-h-[3.5rem]">
                {product.title}
              </h3>
              
              <div 
                className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.descriptionHtml || '') }}
              />
              
              {/* Price Section */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    {hasDiscount && (
                      <span className="text-xs text-muted-foreground line-through">
                        {currencySymbol} {parseFloat(compareAtPrice!).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-2xl font-black text-primary">
                      {currencySymbol} {parseFloat(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-1 text-chart-4">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-xs font-bold">PROMO</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Shine Effect */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </Card>
        );
      })}
    </div>
  );
};
