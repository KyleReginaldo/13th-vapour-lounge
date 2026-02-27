"use client";

import { parkOrder } from "@/app/actions/pos";
import {
  createPOSOrderWithSplitPayment,
  type ReceiptData,
} from "@/app/actions/pos-enhanced";
import { QRCodeScanner } from "@/components/shared/QRCodeScanner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCurrency } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Grid3x3,
  List,
  Minus,
  Package,
  ParkingSquare,
  Plus,
  QrCode,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ReceiptPrinter } from "./ReceiptPrinter";
import { SplitPaymentModal } from "./SplitPaymentModal";

type Product = {
  id: string;
  name: string;
  sku: string;
  slug: string;
  description: string | null;
  base_price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  critical_stock_threshold: number | null;
  track_inventory: boolean | null;
  barcode: string | null;
  qr_code: string | null;
  is_published: boolean | null;
  is_featured: boolean | null;
  has_variants: boolean | null;
  product_type: string | null;
  brand_id: string | null;
  category_id: string | null;
  product_images?: { url: string; sort_order: number | null; id: string }[];
  product_variants?: {
    id: string;
    sku: string;
    price: number | null;
    stock_quantity: number | null;
    barcode: string | null;
    attributes: unknown;
  }[];
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
};

type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  image?: string;
  variantAttributes?: Record<string, string>;
};

interface POSCartProps {
  products: Product[];
  onTransactionComplete: (transaction: any) => void;
  cartToRestore?: CartItem[] | null;
  onRestoreConsumed?: () => void;
}

export function POSCart({
  products,
  onTransactionComplete,
  cartToRestore,
  onRestoreConsumed,
}: POSCartProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(
    null
  );

  // Filter products
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cart calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Consume a restored parked order
  useEffect(() => {
    if (cartToRestore && cartToRestore.length > 0) {
      setCart(cartToRestore);
      onRestoreConsumed?.();
    }
  }, [cartToRestore]);

  // Park order mutation
  const parkOrderMutation = useMutation({
    mutationFn: async () => {
      const result = await parkOrder(cart);
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      toast.success("Order parked successfully");
      clearCart();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Add product to cart
  const addToCart = (product: Product, variantId?: string) => {
    const variant = variantId
      ? product.product_variants?.find((v) => v.id === variantId)
      : null;

    const price = variant?.price || product.base_price;
    const sku = variant?.sku || product.sku;
    const stock = variant?.stock_quantity ?? product.stock_quantity ?? 0;
    const image = product.product_images?.[0]?.url;

    const cartItemId = `${product.id}-${variantId || "default"}`;

    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === cartItemId);

      if (existingItem) {
        if (existingItem.quantity >= stock) {
          toast.error("Not enough stock available");
          return prev;
        }
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      if (stock === 0) {
        toast.error("Product out of stock");
        return prev;
      }

      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          variantId,
          name: product.name,
          sku,
          price,
          quantity: 1,
          stock,
          image,
          variantAttributes:
            (variant?.attributes as Record<string, string>) || undefined,
        },
      ];
    });
  };

  // Update quantity
  const updateQuantity = (itemId: string, change: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === itemId) {
              const newQuantity = item.quantity + change;
              if (newQuantity <= 0) return null;
              if (newQuantity > item.stock) {
                toast.error("Not enough stock available");
                return item;
              }
              return { ...item, quantity: newQuantity };
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  // Remove item
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => setCart([]);

  // Handle scan - supports SKU, barcode, and QR code
  const handleScan = (code: string) => {
    // First, try to find product by SKU, barcode, or QR code
    const product = products.find(
      (p) => p.sku === code || p.barcode === code || p.qr_code === code
    );

    if (product) {
      addToCart(product);
      toast.success(`Added ${product.name} to cart`);
      return;
    }

    // If not found, check product variants
    for (const p of products) {
      if (p.product_variants) {
        const variant = p.product_variants.find(
          (v) => v.sku === code || v.barcode === code
        );
        if (variant) {
          addToCart(p, variant.id);
          toast.success(`Added ${p.name} to cart`);
          return;
        }
      }
    }

    toast.error("Product not found");
  };

  // Handle payment completion
  const handlePaymentConfirm = async (
    payments: any[],
    cashReceived?: number
  ) => {
    try {
      const items = cart.map((item) => ({
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
      }));

      const result = await createPOSOrderWithSplitPayment(
        items,
        payments,
        cashReceived
      );

      if (result.success && result.data) {
        setCurrentReceipt(result.data.receipt);
        setShowReceipt(true);
        onTransactionComplete({
          id: result.data.receipt.receiptNumber,
          items: cart,
          subtotal,
          tax: 0,
          total,
          payments,
          cashReceived: result.data.receipt.cashReceived,
          change: result.data.receipt.change,
          timestamp: result.data.receipt.timestamp,
        });
        clearCart();
        toast.success("Transaction completed!");
      } else {
        throw new Error(result.error || "Failed to create order");
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-0 lg:gap-6 h-full p-0 lg:p-6">
        {/* Products Section */}
        <div className="flex flex-col h-full p-4 lg:p-0 pb-24 lg:pb-0">
          {/* Search & Actions */}
          <div className="flex gap-3 shrink-0 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setShowScanner(true)}
            >
              <QrCode className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-11 w-11"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List className="h-5 w-5" />
              ) : (
                <Grid3x3 className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Products Grid/List */}
          <ScrollArea className="flex-1 min-h-0">
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                {filteredProducts.map((product) => {
                  const image = product.product_images?.[0]?.url;
                  const stock = product.stock_quantity ?? 0;
                  const lowStockThreshold = product.low_stock_threshold ?? 10;
                  const isLowStock = stock > 0 && stock <= lowStockThreshold;
                  const isOutOfStock = stock === 0;

                  return (
                    <Card
                      key={product.id}
                      className={`group cursor-pointer transition-all hover:shadow-lg ${
                        isOutOfStock ? "opacity-60" : "hover:scale-[1.02]"
                      }`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <CardContent className="p-3">
                        <div className="relative aspect-square mb-3 bg-muted rounded-lg overflow-hidden">
                          {image ? (
                            <Image
                              src={image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform"
                              sizes="(max-width: 768px) 50vw, 20vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          {isLowStock && (
                            <div className="absolute top-2 right-2">
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Low
                              </Badge>
                            </div>
                          )}
                          {isOutOfStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Badge variant="destructive">Out of Stock</Badge>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-sm line-clamp-2 mb-1 min-h-10">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-primary">
                              {formatCurrency(product.base_price)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {stock}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {filteredProducts.map((product) => {
                  const image = product.product_images?.[0]?.url;
                  const stock = product.stock_quantity ?? 0;
                  const lowStockThreshold = product.low_stock_threshold ?? 10;
                  const isLowStock = stock > 0 && stock <= lowStockThreshold;
                  const isOutOfStock = stock === 0;

                  return (
                    <Card
                      key={product.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isOutOfStock ? "opacity-60" : ""
                      }`}
                      onClick={() => !isOutOfStock && addToCart(product)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-16 bg-muted rounded-lg overflow-hidden shrink-0">
                            {image ? (
                              <Image
                                src={image}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {product.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              {formatCurrency(product.base_price)}
                            </div>
                            <Badge variant="outline" className="mt-1">
                              Stock: {stock}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Cart Sidebar — desktop/large tablet only */}
        <div className="hidden lg:flex flex-col h-full">
          <Card className="shadow-lg flex flex-col h-full overflow-hidden">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Cart Header */}
              <div className="p-4 border-b bg-muted/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    <h3 className="font-semibold">Current Order</h3>
                  </div>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="h-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{itemCount} items</span>
                  <span>•</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Cart Items */}
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-4 space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 bg-muted/30 rounded-lg group"
                    >
                      <div className="relative h-16 w-16 bg-muted rounded-md overflow-hidden shrink-0">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {item.sku}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-bold">
                            {formatCurrency(item.price)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            × {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Cart is empty
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Scan or select products to start
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-muted/10 space-y-4">
                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => parkOrderMutation.mutate()}
                      disabled={parkOrderMutation.isPending}
                      className="h-11"
                    >
                      <ParkingSquare className="h-4 w-4 mr-2" />
                      Park
                    </Button>
                    <Button
                      onClick={() => setShowPaymentDialog(true)}
                      className="h-11"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Checkout
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile: floating checkout bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 border-t bg-background shadow-lg">
          <div className="p-3">
            <Button
              onClick={() => setIsMobileCartOpen(true)}
              className="w-full h-14"
            >
              <ShoppingCart className="h-5 w-5 mr-2 shrink-0" />
              <span>
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
              <span className="mx-2 opacity-50">·</span>
              <span className="font-bold">{formatCurrency(total)}</span>
              <span className="ml-auto opacity-80 text-sm">View Cart →</span>
            </Button>
          </div>
        </div>
      )}

      {/* Mobile: Cart Sheet */}
      <Sheet open={isMobileCartOpen} onOpenChange={setIsMobileCartOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0 flex flex-col">
          <SheetHeader className="shrink-0 p-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Current Order
              </SheetTitle>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearCart();
                    setIsMobileCartOpen(false);
                  }}
                  className="h-8 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-left">
              {itemCount} items · {formatCurrency(total)}
            </p>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0">
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  <div className="relative h-14 w-14 bg-muted rounded-md overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                    <span className="text-sm font-bold">
                      {formatCurrency(item.price)}
                    </span>
                  </div>
                  <div className="flex flex-col items-end justify-between gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {cart.length > 0 && (
            <div className="shrink-0 p-4 border-t bg-muted/10 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    parkOrderMutation.mutate();
                    setIsMobileCartOpen(false);
                  }}
                  disabled={parkOrderMutation.isPending}
                  className="h-12"
                >
                  <ParkingSquare className="h-4 w-4 mr-2" />
                  Park
                </Button>
                <Button
                  onClick={() => {
                    setShowPaymentDialog(true);
                    setIsMobileCartOpen(false);
                  }}
                  className="h-12"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <SplitPaymentModal
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        total={total}
        onConfirm={handlePaymentConfirm}
      />

      <QRCodeScanner
        open={showScanner}
        onOpenChange={setShowScanner}
        onScan={handleScan}
        title="Scan Product Code"
        description="Scan barcode or QR code to add product"
      />

      {currentReceipt && (
        <ReceiptPrinter
          open={showReceipt}
          onOpenChange={setShowReceipt}
          receipt={currentReceipt}
        />
      )}
    </>
  );
}
