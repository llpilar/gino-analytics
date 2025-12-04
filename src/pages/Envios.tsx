import { DashboardWrapper } from "@/components/DashboardWrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, Truck, Store, AlertCircle, RefreshCw, Box, 
  Clock, TrendingUp, MapPin, Hash, User, DollarSign,
  CheckCircle2, XCircle, Timer, Warehouse
} from "lucide-react";
import { useHokoStore, useHokoOrders, useHokoProducts, useHokoProductsWithStock } from "@/hooks/useHokoData";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

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

const StatCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  gradient,
  delay = 0
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon: any; 
  gradient: string;
  delay?: number;
}) => (
  <div 
    className="group relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-6 transition-all duration-500 hover:border-white/10 hover:bg-black/50"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Gradient background effect */}
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${gradient}`} />
    
    {/* Glow effect */}
    <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${gradient}`} />
    
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <TrendingUp className="h-4 w-4 text-emerald-400 opacity-60" />
      </div>
      
      <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-3xl font-black text-white tracking-tight">{value}</p>
      {subtitle && (
        <p className="text-xs text-zinc-500 mt-2">{subtitle}</p>
      )}
    </div>
  </div>
);

const HeroSection = () => {
  const { data: storeData, isLoading } = useHokoStore();
  const storeInfo = storeData?.data || storeData as any;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-violet-950/50 via-black to-fuchsia-950/30 p-8 mb-8">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-10 left-10 w-72 h-72 bg-violet-500/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNDBMNDB2NDBIMHoiLz48cGF0aCBkPSJNNDAgMEgwdjQwaDQwVjB6TTM5IDFIMXYzOGgzOFYxeiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIvPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-2xl blur-xl opacity-50" />
              <div className="relative p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-2xl">
                <Warehouse className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                  Envios & Fulfillment
                </h1>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Conectado</span>
                </div>
              </div>
              <p className="text-zinc-400 text-sm md:text-base">
                Gestiona tus envíos y productos con{' '}
                <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                  Hoko Colombia
                </span>
              </p>
            </div>
          </div>

          {/* Store info badge */}
          <div className="flex items-center gap-4">
            {isLoading ? (
              <Skeleton className="h-14 w-48 rounded-xl" />
            ) : (
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <Store className="h-5 w-5 text-violet-400" />
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Tienda</p>
                  <p className="text-sm font-bold text-white">{storeInfo?.name || 'Mi Tienda'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsGrid = () => {
  const { data: stockData, isLoading } = useHokoProductsWithStock();
  const { data: ordersData } = useHokoOrders();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    );
  }

  const stockItems: any[] = Array.isArray(stockData?.data) ? stockData.data : 
                Array.isArray(stockData) ? stockData : [];
  const orders: any[] = Array.isArray(ordersData?.data) ? ordersData.data : 
                Array.isArray(ordersData) ? ordersData : [];

  const totalStock = stockItems.reduce((acc, p) => acc + (p.stock?.[0]?.amount || p.stock || 0), 0);
  const lowStockCount = stockItems.filter((p) => {
    const stock = p.stock?.[0]?.amount || p.stock || 0;
    return stock <= 10 && stock > 0;
  }).length;
  const outOfStockCount = stockItems.filter((p) => {
    const stock = p.stock?.[0]?.amount || p.stock || 0;
    return stock === 0;
  }).length;
  const totalOrders = orders.length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Pedidos" 
        value={totalOrders} 
        subtitle="Total de pedidos"
        icon={Package} 
        gradient="from-violet-600 to-purple-600"
        delay={0}
      />
      <StatCard 
        title="Stock Total" 
        value={totalStock.toLocaleString('es-CO')} 
        subtitle="Unidades en bodega"
        icon={Box} 
        gradient="from-cyan-600 to-blue-600"
        delay={100}
      />
      <StatCard 
        title="Stock Bajo" 
        value={lowStockCount} 
        subtitle="Productos por reabastecer"
        icon={Clock} 
        gradient="from-amber-600 to-orange-600"
        delay={200}
      />
      <StatCard 
        title="Sin Stock" 
        value={outOfStockCount} 
        subtitle="Productos agotados"
        icon={AlertCircle} 
        gradient="from-rose-600 to-pink-600"
        delay={300}
      />
    </div>
  );
};

const OrdersTable = () => {
  const { data: ordersData, isLoading, error, refetch, isFetching } = useHokoOrders();

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
        <p className="text-lg font-semibold text-white mb-1">No se pudieron cargar los pedidos</p>
        <p className="text-sm text-zinc-500 mb-6">{(ordersData as any)?.message || 'Intenta de nuevo más tarde'}</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  const orders = Array.isArray(ordersData?.data) ? ordersData.data : 
                 Array.isArray(ordersData) ? ordersData : [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 mb-4">
          <Package className="h-10 w-10 text-zinc-500" />
        </div>
        <p className="text-lg font-semibold text-white mb-1">No hay pedidos todavía</p>
        <p className="text-sm text-zinc-500">Los pedidos aparecerán aquí cuando se registren</p>
      </div>
    );
  }

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
          Actualizar
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
                  Ciudad
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold">Estado</TableHead>
              <TableHead className="text-zinc-500 font-semibold">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Tracking
                </div>
              </TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">
                <div className="flex items-center gap-2 justify-end">
                  <DollarSign className="h-4 w-4" />
                  Total
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any, index: number) => (
              <TableRow 
                key={order.id} 
                className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell>
                  <span className="font-mono font-bold text-violet-400">
                    #{order.order_number || order.id}
                  </span>
                </TableCell>
                <TableCell className="text-zinc-300 font-medium">
                  {order.customer_name || 'N/A'}
                </TableCell>
                <TableCell className="text-zinc-400">
                  {order.city || 'N/A'}
                </TableCell>
                <TableCell>
                  <StatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  {order.tracking_number ? (
                    <span className="font-mono text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300">
                      {order.tracking_number}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCOP(order.total || 0)}
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

const ProductsTable = () => {
  const { data: productsData, isLoading, error, refetch, isFetching } = useHokoProducts();

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
        <p className="text-lg font-semibold text-white mb-1">No se pudieron cargar los productos</p>
        <p className="text-sm text-zinc-500 mb-6">{productsData?.message || 'Intenta de nuevo más tarde'}</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" />
          Reintentar
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
        <p className="text-lg font-semibold text-white mb-1">No hay productos registrados</p>
        <p className="text-sm text-zinc-500">Los productos aparecerán aquí cuando se sincronicen</p>
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
        Agotado
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
          Actualizar
        </Button>
      </div>
      
      <div className="rounded-xl border border-zinc-800/50 overflow-hidden bg-zinc-900/30">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-900/50">
              <TableHead className="text-zinc-500 font-semibold">Producto</TableHead>
              <TableHead className="text-zinc-500 font-semibold">SKU</TableHead>
              <TableHead className="text-zinc-500 font-semibold">Stock</TableHead>
              <TableHead className="text-zinc-500 font-semibold">Estado</TableHead>
              <TableHead className="text-zinc-500 font-semibold text-right">Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any, index: number) => (
              <TableRow 
                key={product.id} 
                className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell className="text-white font-medium max-w-[200px] truncate">
                  {product.name}
                </TableCell>
                <TableCell>
                  {product.sku ? (
                    <span className="font-mono text-xs px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400">
                      {product.sku}
                    </span>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {getStockBadge(product.stock || 0)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={product.status || 'Activo'} />
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCOP(product.price || 0)}
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
            <TabsList className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-1 backdrop-blur-sm">
              <TabsTrigger 
                value="orders" 
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
              >
                <Truck className="h-4 w-4 mr-2" />
                Pedidos
              </TabsTrigger>
              <TabsTrigger 
                value="products" 
                className="rounded-lg px-6 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all"
              >
                <Box className="h-4 w-4 mr-2" />
                Productos
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600">
                    <Truck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Pedidos Recientes</h2>
                    <p className="text-sm text-zinc-500">Gestiona y rastrea tus envíos</p>
                  </div>
                </div>
                <OrdersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <Card className="bg-black/40 border-zinc-800/50 rounded-2xl backdrop-blur-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600">
                    <Box className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Productos en Fulfillment</h2>
                    <p className="text-sm text-zinc-500">Inventario sincronizado con Hoko</p>
                  </div>
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
