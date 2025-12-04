import { DashboardWrapper } from "@/components/DashboardWrapper";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Truck, Store, AlertCircle, RefreshCw, Box, CheckCircle, Clock } from "lucide-react";
import { useHokoStore, useHokoOrders, useHokoProducts, useHokoStock } from "@/hooks/useHokoData";
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

const getStatusColor = (status: string): string => {
  const statusLower = status?.toLowerCase() || '';
  if (statusLower.includes('entregado') || statusLower.includes('delivered') || statusLower.includes('completado')) {
    return 'bg-green-500/20 text-green-400 border-green-500/30';
  }
  if (statusLower.includes('enviado') || statusLower.includes('shipped') || statusLower.includes('transito') || statusLower.includes('transit')) {
    return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  }
  if (statusLower.includes('pendiente') || statusLower.includes('pending') || statusLower.includes('procesando')) {
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  }
  if (statusLower.includes('cancelado') || statusLower.includes('cancelled') || statusLower.includes('devuelto')) {
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  }
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
};

const StoreInfo = () => {
  const { data: storeData, isLoading, error } = useHokoStore();

  if (isLoading) {
    return (
      <Card className="glass-card border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Tienda Hoko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (error || storeData?.status === 'error') {
    return (
      <Card className="glass-card border-zinc-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5 text-primary" />
            Tienda Hoko
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">No se pudo cargar la información de la tienda</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const storeInfo = storeData?.data || storeData as any;

  return (
    <Card className="glass-card border-zinc-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Tienda Hoko
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-xl font-bold text-white">{storeInfo?.name || 'Mi Tienda'}</p>
          {storeInfo?.id && <p className="text-sm text-zinc-400">ID: {storeInfo.id}</p>}
          {storeInfo?.status && (
            <Badge className={getStatusColor(storeInfo.status)}>{storeInfo.status}</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const OrdersTable = () => {
  const { data: ordersData, isLoading, error, refetch, isFetching } = useHokoOrders();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error || ordersData?.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <AlertCircle className="h-12 w-12 mb-4 text-yellow-400" />
        <p className="text-lg mb-2">No se pudieron cargar los pedidos</p>
        <p className="text-sm text-zinc-500 mb-4">{ordersData?.message || 'Intenta de nuevo más tarde'}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const orders = Array.isArray(ordersData?.data) ? ordersData.data : 
                 Array.isArray(ordersData) ? ordersData : [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <Package className="h-12 w-12 mb-4" />
        <p className="text-lg">No hay pedidos todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
              <TableHead className="text-zinc-400">Pedido</TableHead>
              <TableHead className="text-zinc-400">Cliente</TableHead>
              <TableHead className="text-zinc-400">Ciudad</TableHead>
              <TableHead className="text-zinc-400">Estado</TableHead>
              <TableHead className="text-zinc-400">Tracking</TableHead>
              <TableHead className="text-zinc-400 text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <TableRow key={order.id} className="border-zinc-800 hover:bg-zinc-800/30">
                <TableCell className="font-mono text-white">
                  #{order.order_number || order.id}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {order.customer_name || 'N/A'}
                </TableCell>
                <TableCell className="text-zinc-300">
                  {order.city || 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">
                  {order.tracking_number || '-'}
                </TableCell>
                <TableCell className="text-right font-mono text-green-400">
                  {formatCOP(order.total || 0)}
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
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (error || productsData?.status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <AlertCircle className="h-12 w-12 mb-4 text-yellow-400" />
        <p className="text-lg mb-2">No se pudieron cargar los productos</p>
        <p className="text-sm text-zinc-500 mb-4">{productsData?.message || 'Intenta de nuevo más tarde'}</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const products = Array.isArray(productsData?.data) ? productsData.data : 
                   Array.isArray(productsData) ? productsData : [];

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
        <Box className="h-12 w-12 mb-4" />
        <p className="text-lg">No hay productos registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => refetch()} variant="outline" size="sm" disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-zinc-800/30">
              <TableHead className="text-zinc-400">Producto</TableHead>
              <TableHead className="text-zinc-400">SKU</TableHead>
              <TableHead className="text-zinc-400">Stock</TableHead>
              <TableHead className="text-zinc-400">Estado</TableHead>
              <TableHead className="text-zinc-400 text-right">Precio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product: any) => (
              <TableRow key={product.id} className="border-zinc-800 hover:bg-zinc-800/30">
                <TableCell className="text-white font-medium">
                  {product.name}
                </TableCell>
                <TableCell className="font-mono text-xs text-zinc-400">
                  {product.sku || '-'}
                </TableCell>
                <TableCell>
                  <Badge className={product.stock > 10 
                    ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                    : product.stock > 0 
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }>
                    {product.stock} unidades
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(product.status || 'activo')}>
                    {product.status || 'Activo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-green-400">
                  {formatCOP(product.price || 0)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const StockOverview = () => {
  const { data: stockData, isLoading, error } = useHokoStock();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const stockItems: any[] = Array.isArray(stockData?.data) ? stockData.data : 
                Array.isArray(stockData) ? stockData : [];

  const totalStock = stockItems.reduce((acc, p) => acc + (p.stock || 0), 0);
  const lowStockCount = stockItems.filter((p) => (p.stock || 0) <= 10 && (p.stock || 0) > 0).length;
  const outOfStockCount = stockItems.filter((p) => (p.stock || 0) === 0).length;

  const cards = [
    {
      title: "Stock Total",
      value: totalStock.toLocaleString('es-CO'),
      icon: Box,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Stock Bajo",
      value: lowStockCount,
      icon: Clock,
      color: "from-yellow-500 to-orange-500",
    },
    {
      title: "Sin Stock",
      value: outOfStockCount,
      icon: AlertCircle,
      color: "from-red-500 to-pink-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="glass-card border-zinc-800/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{card.title}</p>
                <p className="text-3xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
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
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <PageHeader 
            title="Envios & Fulfillment" 
            subtitle="Gestiona tus envíos y productos con Hoko"
          />
          <Button onClick={handleRefreshAll} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar Todo
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StoreInfo />
          <div className="lg:col-span-2">
            <StockOverview />
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800">
            <TabsTrigger value="orders" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Truck className="h-4 w-4 mr-2" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-primary data-[state=active]:text-white">
              <Box className="h-4 w-4 mr-2" />
              Productos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="glass-card border-zinc-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Pedidos Recientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OrdersTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card className="glass-card border-zinc-800/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Box className="h-5 w-5 text-primary" />
                  Productos en Fulfillment
                </CardTitle>
              </CardHeader>
              <CardContent>
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
