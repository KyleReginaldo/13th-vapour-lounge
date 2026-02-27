"use client";

import { ParkedOrdersPanel } from "@/components/admin/pos/ParkedOrdersPanel";
import { POSCart } from "@/components/admin/pos/POSCart";
import { POSRefund } from "@/components/admin/pos/POSRefund";
import { POSRefundModal } from "@/components/admin/pos/POSRefundModal";
import { TransactionHistory } from "@/components/admin/pos/TransactionHistory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  History,
  Maximize2,
  Minimize2,
  ParkingSquare,
  RotateCcw,
  ShoppingCart,
  Store,
} from "lucide-react";
import Link from "next/link";
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Sync state when user exits fullscreen via Escape key
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Load today's transactions from DB
  useEffect(() => {
    async function loadTransactions() {
      const supabase = createClient();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data } = await supabase
        .from("pos_transactions")
        .select(
          `
          id,
          transaction_number,
          receipt_number,
          payment_method,
          payment_details,
          cash_received,
          change_given,
          subtotal,
          tax,
          total,
          created_at,
          pos_transaction_items(
            id,
            quantity,
            unit_price,
            subtotal,
            product_id,
            products(name, sku)
          )
        `
        )
        .gte("created_at", todayStart.toISOString())
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (data) {
        const mapped: Transaction[] = data.map((t: any) => {
          const payments: any[] = t.payment_details ?? [];
          const cashPayment = payments.find((p: any) => p.method === "cash");
          return {
            id: t.receipt_number || t.transaction_number || t.id,
            items: (t.pos_transaction_items ?? []).map((item: any) => ({
              id: item.id,
              name: item.products?.name ?? "Unknown Product",
              sku: item.products?.sku ?? "",
              quantity: item.quantity,
              price: item.unit_price,
            })),
            subtotal: t.subtotal,
            tax: t.tax,
            total: t.total,
            paymentMethod: t.payment_method ?? "cash",
            cashReceived: t.cash_received ?? cashPayment?.amount,
            change: t.change_given > 0 ? t.change_given : undefined,
            timestamp: t.created_at,
          };
        });
        setTransactions(mapped);
        setCurrentShift((prev) => ({
          ...prev,
          sales: mapped.reduce((sum, t) => sum + t.total, 0),
          transactionCount: mapped.length,
        }));
      }
    }
    loadTransactions();
  }, []);

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

  // Handle completed transaction (DB save already happens inside POSCart)
  const handleTransactionComplete = (transaction: any) => {
    const primaryPayment = (transaction.payments as any[])?.[0];

    const mapped: Transaction = {
      id: transaction.id,
      items: (transaction.items as any[]).map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku ?? "",
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal: transaction.subtotal,
      tax: transaction.tax ?? 0,
      total: transaction.total,
      paymentMethod: primaryPayment?.method ?? "cash",
      cashReceived: transaction.cashReceived,
      change: transaction.change,
      timestamp: transaction.timestamp,
    };

    setTransactions((prev) => [...prev, mapped]);
    setCurrentShift((prev) => ({
      ...prev,
      sales: prev.sales + mapped.total,
      transactionCount: prev.transactionCount + 1,
    }));
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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background px-3 py-2 sm:p-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="flex items-center justify-center h-9 w-9 rounded-lg border bg-background hover:bg-muted transition-colors shrink-0"
              title="Back to Admin"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Store className="hidden sm:block h-6 w-6 shrink-0" />
              <div>
                <h1 className="text-base sm:text-xl font-bold leading-tight">
                  Point of Sale
                </h1>
                <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
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
                {/* Mobile: compact stats inline */}
                <div className="flex sm:hidden items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatCurrency(todaySales)}</span>
                  <span>·</span>
                  <span>{currentShift.transactionCount} txn</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <POSRefundModal />
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Maximize screen"}
              className="hidden sm:flex items-center justify-center h-10 w-10 rounded-lg border bg-background hover:bg-muted transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="shrink-0 grid w-full grid-cols-4 max-w-2xl mx-auto mt-2 sm:mt-4 px-2 sm:px-0">
            <TabsTrigger
              value="pos"
              className="flex items-center gap-1 sm:gap-2"
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Point of Sale</span>
            </TabsTrigger>
            <TabsTrigger
              value="parked"
              className="flex items-center gap-1 sm:gap-2"
            >
              <ParkingSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Parked</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex items-center gap-1 sm:gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger
              value="refunds"
              className="flex items-center gap-1 sm:gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">Refunds</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="pos"
            className="flex-1 min-h-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <POSCart
              products={products}
              onTransactionComplete={handleTransactionComplete}
              cartToRestore={cartToRestore}
              onRestoreConsumed={() => setCartToRestore(null)}
            />
          </TabsContent>

          <TabsContent
            value="parked"
            className="flex-1 min-h-0 mt-0 overflow-auto p-4 sm:p-6"
          >
            <ParkedOrdersPanel onRestoreOrder={handleRestoreParkedOrder} />
          </TabsContent>

          <TabsContent
            value="history"
            className="flex-1 min-h-0 mt-0 overflow-auto p-4 sm:p-6"
          >
            <TransactionHistory
              transactions={transactions}
              onPrintReceipt={handlePrintReceipt}
            />
          </TabsContent>

          <TabsContent
            value="refunds"
            className="flex-1 min-h-0 mt-0 overflow-auto p-4 sm:p-6"
          >
            <POSRefund />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
