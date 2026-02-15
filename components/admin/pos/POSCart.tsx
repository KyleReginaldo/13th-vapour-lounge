"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { Database } from "@/database.types";
import { formatCurrency } from "@/lib/utils";
import {
  Banknote,
  Calculator,
  Clock,
  CreditCard,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
} from "lucide-react";
import Image from "next/image";
import { useState } from "react";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  product_images?: { url: string; sort_order: number | null }[];
  product_variants?: Database["public"]["Tables"]["product_variants"]["Row"][];
};

type CartItem = {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
  variantAttributes?: Record<string, string>;
};

type PaymentMethod = "cash" | "card" | "gcash" | "maya";

interface POSCartProps {
  products: Product[];
  onTransactionComplete: (transaction: any) => void;
}

export function POSCart({ products, onTransactionComplete }: POSCartProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter products based on search
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
  const taxRate = 0.12; // 12% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + tax;
  const changeAmount =
    paymentMethod === "cash"
      ? Math.max(0, parseFloat(cashReceived || "0") - total)
      : 0;

  // Add product to cart
  const addToCart = (product: Product, variantId?: string) => {
    const variant = variantId
      ? product.product_variants?.find((v) => v.id === variantId)
      : null;

    const price = variant?.price || product.base_price;
    const sku = variant?.sku || product.sku;
    const name = product.name;
    const image = product.product_images?.[0]?.url;

    const cartItemId = `${product.id}-${variantId || "default"}`;

    setCart((prev) => {
      const existingItem = prev.find((item) => item.id === cartItemId);

      if (existingItem) {
        return prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...prev,
        {
          id: cartItemId,
          productId: product.id,
          variantId,
          name,
          sku,
          price,
          quantity: 1,
          image,
          variantAttributes:
            (variant?.attributes as Record<string, string>) || undefined,
        },
      ];
    });
  };

  // Update cart item quantity
  const updateQuantity = (itemId: string, change: number) => {
    setCart(
      (prev) =>
        prev
          .map((item) => {
            if (item.id === itemId) {
              const newQuantity = Math.max(0, item.quantity + change);
              return newQuantity === 0
                ? null
                : { ...item, quantity: newQuantity };
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  // Remove item from cart
  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Process payment
  const processPayment = async () => {
    if (cart.length === 0) return;

    if (paymentMethod === "cash" && parseFloat(cashReceived) < total) {
      alert("Insufficient cash received");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const transaction = {
        id: Date.now().toString(),
        items: cart,
        subtotal,
        tax,
        total,
        paymentMethod,
        cashReceived:
          paymentMethod === "cash" ? parseFloat(cashReceived) : total,
        change: changeAmount,
        timestamp: new Date().toISOString(),
      };

      onTransactionComplete(transaction);
      clearCart();
      setShowPaymentDialog(false);
      setCashReceived("");
    } catch (error) {
      console.error("Payment processing failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen p-6 bg-muted/30">
      {/* Products Panel */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Product Search
            </CardTitle>
            <CardDescription>Search products by name or SKU</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {filteredProducts.slice(0, 20).map((product) => {
            const image = product.product_images?.[0]?.url;
            const hasVariants =
              product.has_variants &&
              product.product_variants &&
              product.product_variants.length > 0;

            return (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => !hasVariants && addToCart(product)}
              >
                <CardContent className="p-4">
                  {/* Product Image */}
                  <div className="relative aspect-square mb-3 bg-muted rounded-md overflow-hidden">
                    {image ? (
                      <Image
                        src={image}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">
                        {formatCurrency(product.base_price)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {product.stock_quantity || 0} left
                      </Badge>
                    </div>

                    {hasVariants ? (
                      <Select
                        onValueChange={(variantId) =>
                          addToCart(product, variantId)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.product_variants?.map((variant) => (
                            <SelectItem key={variant.id} value={variant.id}>
                              <div className="flex justify-between items-center w-full">
                                <span>{variant.sku}</span>
                                <span>
                                  {formatCurrency(
                                    variant.price || product.base_price
                                  )}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button size="sm" className="w-full h-8 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Cart ({cart.length})
              </div>
              {cart.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearCart}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3 max-h-75 overflow-y-auto">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                >
                  <div className="relative h-12 w-12 bg-muted rounded overflow-hidden shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                    <p className="text-sm font-bold">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 w-8 p-0 ml-2"
                      onClick={() => removeFromCart(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-xs">Add products to start a transaction</p>
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (12%):</span>
                    <span>{formatCurrency(tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Checkout
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Staff Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="font-medium">Staff: John Doe</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              <span>Shift started: 9:00 AM</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Complete the transaction with payment details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Summary */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value: PaymentMethod) =>
                  setPaymentMethod(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="gcash">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      GCash
                    </div>
                  </SelectItem>
                  <SelectItem value="maya">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Maya
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cash Amount */}
            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label>Cash Received</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
                {parseFloat(cashReceived || "0") > total && (
                  <div className="flex justify-between text-sm bg-green-50 p-2 rounded">
                    <span>Change:</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(changeAmount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processPayment}
              disabled={
                isProcessing ||
                (paymentMethod === "cash" &&
                  parseFloat(cashReceived || "0") < total)
              }
            >
              {isProcessing ? "Processing..." : "Complete Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
