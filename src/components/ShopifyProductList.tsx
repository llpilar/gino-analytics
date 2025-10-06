import { useShopifyProducts } from "@/hooks/useShopifyData";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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

export const ShopifyProductList = () => {
  const { data, isLoading } = useShopifyProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="p-4 glass-card border-zinc-800">
            <Skeleton className="w-full h-48 mb-4 bg-zinc-800/50" />
            <Skeleton className="h-6 w-3/4 mb-2 bg-zinc-800/50" />
            <Skeleton className="h-4 w-full mb-2 bg-zinc-800/50" />
            <Skeleton className="h-8 w-1/3 bg-zinc-800/50" />
          </Card>
        ))}
      </div>
    );
  }

  const products: ProductNode[] = data?.data?.products?.edges?.map((edge: any) => edge.node) || [];

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-400">
        <p className="text-sm">Nenhum produto encontrado</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const imageUrl = product.images?.edges?.[0]?.node?.url;
        const price = product.variants?.edges?.[0]?.node?.price || "0.00";
        const compareAtPrice = product.variants?.edges?.[0]?.node?.compareAtPrice;
        const currencyCode = product.variants?.edges?.[0]?.node?.currencyCode || 'COP';
        
        const currencySymbol = currencyCode === 'BRL' ? 'R$' : 
                               currencyCode === 'USD' ? '$' : 
                               '$';

        return (
          <Card 
            key={product.id} 
            className="group overflow-hidden glass-card border-zinc-800 hover:border-primary/50 transition-all duration-300"
          >
            {imageUrl && (
              <div className="aspect-square overflow-hidden bg-muted">
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              <div 
                className="text-sm text-muted-foreground mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
              <div className="flex items-center gap-2">
                {compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
                  <span className="text-sm text-muted-foreground line-through">
                    {currencySymbol} {parseFloat(compareAtPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                )}
                <span className="text-xl font-bold text-primary">
                  {currencySymbol} {parseFloat(price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
