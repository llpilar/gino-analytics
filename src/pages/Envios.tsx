import { useState } from "react";
import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Truck, AlertCircle, RefreshCw, Box, 
  Clock, TrendingUp, MapPin, Hash, User, DollarSign,
  CheckCircle2, XCircle, Timer, CalendarIcon, Wallet
} from "lucide-react";
import { useHokoOrders, useHokoProducts, useHokoProductsWithStock } from "@/hooks/useHokoData";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useDateFilter } from "@/contexts/DateFilterContext";
import { HyperText } from "@/components/ui/hyper-text";
import { StatsCard, SectionCard, CardColorVariant } from "@/components/ui/stats-card";
import { LucideIcon } from "lucide-react";

const formatCOP = (value: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const getStatusConfig = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('entregado') || statusLower.includes('delivered') || statusLower.includes('completado')) {
    return { 
      bg: 'bg-emerald-500/10', 
      text: 'text-emerald-400', 
      border: 'border-emerald-500/30',
      icon: CheckCircle2,
      glow: 'shadow-emerald-500/20'
    };
  }
  if (statusLower.includes('enviado') || statusLower.includes('shipped') || statusLower.includes('transito') || statusLower.includes('transit')) {
    return { 
      bg: 'bg-blue-500/10', 
      text: 'text-blue-400', 
      border: 'border-blue-500/30',
      icon: Truck,
      glow: 'shadow-blue-500/20'
    };
  }
  if (statusLower.includes('pendiente') || statusLower.includes('pending') || statusLower.includes('procesando')) {
    return { 
      bg: 'bg-amber-500/10', 
      text: 'text-amber-400', 
      border: 'border-amber-500/30',
      icon: Timer,
      glow: 'shadow-amber-500/20'
    };
  }
  if (statusLower.includes('cancelado') || statusLower.includes('cancelled') || statusLower.includes('devuelto')) {
    return { 
      bg: 'bg-rose-500/10', 
      text: 'text-rose-400', 
      border: 'border-rose-500/30',
      icon: XCircle,
      glow: 'shadow-rose-500/20'
    };
  }
  return { 
    bg: 'bg-zinc-500/10', 
    text: 'text-zinc-400', 
    border: 'border-zinc-500/30',
    icon: Package,
    glow: 'shadow-zinc-500/20'
  };
};

// Hoko delivery states: 1=Criada, 2=Em processo, 3=Despachada, 4=Finalizada, 5=Cancelada, 6=Em Novidade
const getDeliveryState = (state: number) => {
  const states: Record<number, { label: string; bg: string; text: string; border: string }> = {
    1: { label: 'Criada', bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' },
    2: { label: 'Em processo', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    3: { label: 'Despachada', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    4: { label: 'Finalizada', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    5: { label: 'Cancelada', bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    6: { label: 'Em Novidade', bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' },
  };
  return states[state] || { label: `Estado ${state}`, bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/30' };
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return (
    <Badge className={`${config.bg} ${config.text} ${config.border} border px-3 py-1 gap-1.5 font-medium`}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
};


const HeroSection = () => {
  return (
    <div className="mb-8">
      <HyperText 
        text="Envios & Fulfillment" 
        className="text-3xl md:text-4xl font-black text-white tracking-tight"
      />
      <p className="text-zinc-400 text-sm md:text-base mt-1">
        Gerencie seus envios e produtos com Hoko Colombia
      </p>
    </div>
  );
};

const StatsGrid = () => {
  const { data: stockData, isLoading } = useHokoProductsWithStock();
  const { dateRange } = useDateFilter();
  
  // Fetch all orders (Hoko API doesn't respect date filters, so we filter client-side)
  const { data: ordersData } = useHokoOrders(1);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  // Get all orders from API
  const allOrders: any[] = Array.isArray(ordersData?.data) ? ordersData.data : 
                Array.isArray(ordersData) ? ordersData : [];

  // Client-side filtering by created_at date
  const orders = allOrders.filter((order: any) => {
    if (!dateRange.from) return true;
    const orderDate = order.created_at ? parseISO(order.created_at) : null;
    if (!orderDate) return false;
    
    return isWithinInterval(orderDate, { 
      start: startOfDay(dateRange.from), 
      end: endOfDay(dateRange.to || dateRange.from) 
    });
  });

  const totalOrders = orders.length;
  
  // delivery_state: 1=Criada, 2=Em processo, 3=Despachada, 4=Finalizada, 5=Cancelada, 6=Em Novidade
  
  // Criada: delivery_state=1
  const criadas = orders.filter((o) => parseInt(o.delivery_state) === 1).length;
  
  // Em Processo: orders with delivery_state 2, 3, 6 (in process, dispatched, with issue)
  const emProcesso = orders.filter((o) => [2, 3, 6].includes(parseInt(o.delivery_state))).length;
  
  // Finalizadas: delivery_state=4
  const finalizadas = orders.filter((o) => parseInt(o.delivery_state) === 4).length;
  
  // Canceladas: delivery_state=5
  const canceladas = orders.filter((o) => parseInt(o.delivery_state) === 5).length;

  const getPercent = (value: number) => totalOrders > 0 ? ((value / totalOrders) * 100).toFixed(2) : '0';

  const statsConfig: { title: string; value: string; subtitle: string; icon: LucideIcon; color: CardColorVariant }[] = [
    { title: "Criadas", value: `${criadas} (${getPercent(criadas)}%)`, subtitle: "Pedidos recém criados", icon: Clock, color: "purple" },
    { title: "Em Processo", value: `${emProcesso} (${getPercent(emProcesso)}%)`, subtitle: "Pedidos em preparação/trânsito", icon: Timer, color: "cyan" },
    { title: "Finalizadas", value: `${finalizadas} (${getPercent(finalizadas)}%)`, subtitle: "Pedidos entregues com sucesso", icon: CheckCircle2, color: "green" },
    { title: "Canceladas", value: `${canceladas} (${getPercent(canceladas)}%)`, subtitle: "Pedidos cancelados", icon: XCircle, color: "orange" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statsConfig.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          subtitle={stat.subtitle}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  );
};

const OrdersTable = () => {
  const { dateRange } = useDateFilter();
  // Fetch all orders (Hoko API doesn't respect date filters)
  const { data: ordersData, isLoading, error, refetch, isFetching } = useHokoOrders(1);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || ordersData?.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <AlertCircle className="h-10 w-10 text-amber-400" />
        </div>
        <p className="text-lg font-semibold text-white mb-1">Não foi possível carregar os pedidos</p>
        <p className="text-sm text-zinc-500 mb-6">{(ordersData as any)?.message || 'Tente novamente mais tarde'}</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Get all orders from API
  const allOrders = Array.isArray(ordersData?.data) ? ordersData.data : 
                 Array.isArray(ordersData) ? ordersData : [];

  // Client-side filtering by created_at date
  const orders = allOrders.filter((order: any) => {
    if (!dateRange.from) return true;
    const orderDate = order.created_at ? parseISO(order.created_at) : null;
    if (!orderDate) return false;
    
    return isWithinInterval(orderDate, { 
      start: startOfDay(dateRange.from), 
      end: endOfDay(dateRange.to || dateRange.from) 
    });
  });

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-4">
          <Package className="h-10 w-10 text-zinc-500" />
        </div>
        <p className="text-lg font-semibold text-white mb-1">Não há pedidos neste período</p>
        <p className="text-sm text-zinc-500">Selecione outro período no filtro de data</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Results count */}
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {orders.length} pedidos
          </Badge>
        </div>

        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm" 
          disabled={isFetching}
          className="gap-2 rounded-xl border-zinc-700 hover:border-zinc-600"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      
      <div className="rounded-xl border border-zinc-800/50 overflow-hidden bg-zinc-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-900/50">
              <TableHead className="text-zinc-500 font-semibold">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Pedido
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Cidade
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold text-center">
                <div className="flex items-center gap-2 justify-center">
                  <Box className="h-4 w-4" />
                  Qtd
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold">Estado</TableHead>
              <TableHead className="text-zinc-500 font-semibold">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Guia
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">
                <div className="flex items-center gap-2 justify-end">
                  <DollarSign className="h-4 w-4" />
                  Total Venda
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Custo Produto</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Custo Envio</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">
                <div className="flex items-center gap-2 justify-end">
                  <TrendingUp className="h-4 w-4" />
                  Lucro Bruto
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any, index: number) => {
              const deliveryState = getDeliveryState(parseInt(order.delivery_state));
              
              // Get products array
              const products = order.products || [];
              
              // Calculate total quantity from products
              const totalQuantity = products.reduce((acc: number, item: any) => {
                return acc + parseInt(item.amount || item.quantity || 1);
              }, 0) || 1;
              
              // Calculate total sale from products (price_unity × amount)
              const orderTotal = products.reduce((acc: number, item: any) => {
                const price = parseFloat(item.price_unity || item.price || 0);
                const qty = parseInt(item.amount || item.quantity || 1);
                return acc + (price * qty);
              }, 0);
              
              // Get guide info
              const guide = order.guide || order.guides?.[0];
              const shippingCost = parseFloat(guide?.total_freight_store || order.shipping_cost || 0);
              
              // Calculate product cost (unit cost × quantity)
              const productCost = totalQuantity * 11000;
              
              // Get city name
              const cityName = order.customer?.city?.name || order.customer?.city || order.city || 'N/A';
              
              return (
                <TableRow 
                  key={order.id} 
                  className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <span className="font-mono font-bold text-violet-400">
                      #{order.id}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-300 font-medium">
                    <div className="max-w-[180px] truncate" title={order.customer?.name || order.customer_name}>
                      {order.customer?.name || order.customer_name || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    <div className="max-w-[120px] truncate" title={cityName}>
                      {cityName}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 border font-mono font-bold">
                      {totalQuantity} uds
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${deliveryState.bg} ${deliveryState.text} ${deliveryState.border} border`}>
                      {deliveryState.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {guide?.number ? (
                      <span className="font-mono text-xs px-2 py-1 rounded-lg bg-zinc-800 text-cyan-400">
                        {guide.number}
                      </span>
                    ) : (
                      <span className="text-zinc-600">Sem guia</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono font-bold text-cyan-400">
                      {formatCOP(orderTotal)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-purple-400">
                      {formatCOP(productCost)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono text-amber-400">
                      {formatCOP(shippingCost)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono font-bold ${(orderTotal - productCost - shippingCost) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCOP(orderTotal - productCost - shippingCost)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const ProductsTable = () => {
  const { data: productsData, isLoading, error, refetch, isFetching } = useHokoProductsWithStock();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error || productsData?.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <AlertCircle className="h-10 w-10 text-amber-400" />
        </div>
        <p className="text-lg font-semibold text-white mb-1">Não foi possível carregar os produtos</p>
        <p className="text-sm text-zinc-500 mb-6">{productsData?.message || 'Tente novamente mais tarde'}</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  const products = Array.isArray(productsData?.data) ? productsData.data : 
                   Array.isArray(productsData) ? productsData : [];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-4">
          <Box className="h-10 w-10 text-zinc-500" />
        </div>
        <p className="text-lg font-semibold text-white mb-1">Não há produtos registrados</p>
        <p className="text-sm text-zinc-500">Os produtos aparecerão aqui quando forem sincronizados</p>
      </div>
    );
  }

  const getStockBadge = (stock: number) => {
    if (stock > 10) {
      return (
        <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border font-mono">
          {stock} uds
        </Badge>
      );
    }
    if (stock > 0) {
      return (
        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 border font-mono">
          {stock} uds
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/30 border font-mono">
        Esgotado
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm" 
          disabled={isFetching}
          className="gap-2 rounded-xl border-zinc-700 hover:border-zinc-600"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>
      
      <div className="rounded-xl border border-zinc-800/50 overflow-hidden bg-zinc-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-900/50">
              <TableHead className="text-zinc-500 font-semibold">Produto</TableHead>
              <TableHead className="text-zinc-500 font-semibold">Referência</TableHead>
              <TableHead className="text-zinc-500 font-semibold">Estoque</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Custo</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Preço Mín.</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Preço Sugerido</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Preço Drop.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any, index: number) => (
              <TableRow 
                key={product.id} 
                className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="text-white font-medium max-w-[200px]">
                  <div className="truncate" title={product.name}>
                    {product.name}
                  </div>
                </TableCell>
                <TableCell>
                  {product.reference || product.sku ? (
                    <span className="font-mono text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">
                      {product.reference || product.sku}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStockBadge(product.stock?.[0]?.amount || product.stock || 0)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-rose-400">
                    {formatCOP(product.cost || 0)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-amber-400">
                    {formatCOP(product.minimal_price || 0)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCOP(product.price_by_unit || product.price || 0)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono text-cyan-400">
                    {formatCOP(product.price_dropshipping || 0)}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const Envios = () => {
  const queryClient = useQueryClient();

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['hoko-store'] });
    queryClient.invalidateQueries({ queryKey: ['hoko-orders'] });
    queryClient.invalidateQueries({ queryKey: ['hoko-products'] });
    queryClient.invalidateQueries({ queryKey: ['hoko-stock'] });
  };

  return (
    <DashboardWrapper>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        <HeroSection />
        <StatsGrid />

        <Tabs defaultValue="orders" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList className="bg-zinc-950 border border-zinc-800 rounded-full p-1">
              <TabsTrigger 
                value="orders" 
                className="rounded-full px-5 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=inactive]:text-zinc-500 transition-all duration-300"
              >
                <Truck className="h-4 w-4 mr-2" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="rounded-full px-5 py-2 data-[state=active]:bg-zinc-800 data-[state=active]:text-white data-[state=inactive]:text-zinc-500 transition-all duration-300"
              >
                <Box className="h-4 w-4 mr-2" />
                Produtos
              </TabsTrigger>
            </TabsList>

            <Button 
              onClick={handleRefreshAll} 
              variant="outline" 
              className="gap-2 rounded-xl border-zinc-700 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              Sincronizar
            </Button>
          </div>

          <TabsContent value="orders" className="mt-6">
            <Card className="bg-black/40 border-zinc-800/50 rounded-2xl backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">Pedidos Recentes</h2>
                  <p className="text-sm text-zinc-500">Gerencie e rastreie seus envios</p>
                </div>
                <OrdersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card className="bg-black/40 border-zinc-800/50 rounded-2xl backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-white">Produtos em Fulfillment</h2>
                  <p className="text-sm text-zinc-500">Inventário sincronizado com Hoko</p>
                </div>
                <ProductsTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
};

export default Envios;
