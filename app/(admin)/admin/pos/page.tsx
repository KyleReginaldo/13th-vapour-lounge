"use client";

import { POSCart } from "@/components/admin/pos/POSCart";
import { ParkedOrdersPanel } from "@/components/admin/pos/ParkedOrdersPanel";
import { TransactionHistory } from "@/components/admin/pos/TransactionHistory";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  Clock,
  DollarSign,
  History,
  ParkingSquare,
  ShoppingCart,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";

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

type Transaction = {
  id: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "gcash" | "maya";
  cashReceived?: number;
  change?: number;
  timestamp: string;
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentShift, setCurrentShift] = useState({
    startTime: new Date().toISOString(),
    openingCash: 1000,
    sales: 0,
    transactionCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pos");
  const [cartToRestore, setCartToRestore] = useState<any[] | null>(null);

  // Load products from database
  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();

      const { data: products, error } = await supabase
        .from("products")
        .select(
          `
          id,
          name,
          sku,
          slug,
          description,
          base_price,
          compare_at_price,
          cost_price,
          stock_quantity,
          low_stock_threshold,
          critical_stock_threshold,
          track_inventory,
          barcode,
          qr_code,
          is_published,
          is_featured,
          has_variants,
          product_type,
          brand_id,
          category_id,
          brand:brands!brand_id(id, name, slug),
          category:categories!category_id(id, name, slug),
          product_images(id, url, sort_order),
          product_variants(id, sku, price, stock_quantity, barcode, attributes)
        `
        )
        .eq("is_published", true)
        .gt("stock_quantity", 0)
        .order("name");

      if (error) {
        console.error("Error loading products:", error);
      } else {
        setProducts(products || []);
      }

      setIsLoading(false);
    }

    loadProducts();
  }, []);

  // Handle completed transaction
  const handleTransactionComplete = async (transaction: Transaction) => {
    // Add to local transactions
    setTransactions((prev) => [...prev, transaction]);

    // Update shift stats
    setCurrentShift((prev) => ({
      ...prev,
      sales: prev.sales + transaction.total,
      transactionCount: prev.transactionCount + 1,
    }));

    // TODO: Save transaction to database
    try {
      const supabase = createClient();

      // In a real implementation, you would:
      // 1. Create POS transaction record
      // 2. Create transaction items
      // 3. Update product stock quantities
      // 4. Update staff shift totals

      console.log("Transaction completed:", transaction);
    } catch (error) {
      console.error("Error saving transaction:", error);
    }
  };

  // Handle receipt printing
  const handlePrintReceipt = (transaction: Transaction) => {
    // In a real implementation, this would send to a thermal printer
    console.log("Printing receipt for transaction:", transaction.id);

    // For now, open print dialog with formatted receipt
    const receiptWindow = window.open("", "_blank");
    if (receiptWindow) {
      receiptWindow.document.write(`
        <html>
          <head>
            <title>Receipt #${transaction.id}</title>
            <style>
              body { font-family: monospace; max-width: 300px; margin: 0 auto; padding: 20px; }
              .center { text-align: center; }
              .right { text-align: right; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 1px dashed; padding-top: 10px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="center">
              <h2>VAPOUR LOUNGE</h2>
              <p>Receipt #${transaction.id}</p>
              <p>${new Date(transaction.timestamp).toLocaleString()}</p>
            </div>
            <hr>
            ${transaction.items
              .map(
                (item) => `
              <div class="item">
                <span>${item.name} (${item.quantity}x)</span>
                <span>${formatCurrency(item.price * item.quantity)}</span>
              </div>
            `
              )
              .join("")}
            <hr>
            <div class="item">
              <span>Subtotal:</span>
              <span>${formatCurrency(transaction.subtotal)}</span>
            </div>
            <div class="item total">
              <span>TOTAL:</span>
              <span>${formatCurrency(transaction.total)}</span>
            </div>
            ${
              transaction.paymentMethod === "cash"
                ? `
              <div class="item">
                <span>Cash:</span>
                <span>${formatCurrency(transaction.cashReceived || 0)}</span>
              </div>
              ${
                transaction.change && transaction.change > 0
                  ? `
                <div class="item">
                  <span>Change:</span>
                  <span>${formatCurrency(transaction.change)}</span>
                </div>
              `
                  : ""
              }
            `
                : ""
            }
            <div class="center" style="margin-top: 20px;">
              <p>Thank you for your purchase!</p>
            </div>
          </body>
        </html>
      `);
      receiptWindow.document.close();
      receiptWindow.print();
    }
  };

  const handleRestoreParkedOrder = (cartData: any[]) => {
    setCartToRestore(cartData);
    setActiveTab("pos");
  };

  const todaySales = currentShift.sales;
  const averageTransaction =
    currentShift.transactionCount > 0
      ? todaySales / currentShift.transactionCount
      : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading POS System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-bold">Point of Sale</h1>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Shift:{" "}
                    {new Date(currentShift.startTime).toLocaleTimeString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Sales: {formatCurrency(todaySales)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold">
                  {currentShift.transactionCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  Transactions
                </div>
              </div>
            </Card>
            <Card className="p-3">
              <div className="text-center">
                <div className="text-lg font-bold">
                  {formatCurrency(averageTransaction)}
                </div>
                <div className="text-xs text-muted-foreground">Avg Sale</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto mt-4">
            <TabsTrigger value="pos" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Point of Sale
            </TabsTrigger>
            <TabsTrigger value="parked" className="flex items-center gap-2">
              <ParkingSquare className="h-4 w-4" />
              Parked Orders
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="h-full mt-4">
            <POSCart
              products={products}
              onTransactionComplete={handleTransactionComplete}
              cartToRestore={cartToRestore}
              onRestoreConsumed={() => setCartToRestore(null)}
            />
          </TabsContent>

          <TabsContent value="parked" className="h-full mt-4 p-6">
            <ParkedOrdersPanel onRestoreOrder={handleRestoreParkedOrder} />
          </TabsContent>

          <TabsContent value="history" className="h-full mt-4 p-6">
            <TransactionHistory
              transactions={transactions}
              onPrintReceipt={handlePrintReceipt}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
