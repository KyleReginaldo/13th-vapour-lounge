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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IconInput } from "@/components/ui/icon-input";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database, Json } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Clock,
  Edit3,
  Filter,
  History,
  Package,
  Search,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

type ProductVariant = {
  id: string;
  sku: string;
  price: number | null;
  stock_quantity: number | null;
  attributes: Json;
  is_active: boolean | null;
};

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  product_images?: { url: string; sort_order: number | null }[];
  brands?: { name: string } | null;
  categories?: { name: string } | null;
  product_variants?: ProductVariant[];
};

type StockMovement = {
  id: string;
  product_id: string;
  type: "inbound" | "outbound" | "adjustment";
  quantity: number;
  reason: string;
  reference_number?: string;
  created_at: string;
  created_by?: string;
  product_name: string;
  product_sku: string;
};

type StockFilter =
  | "all"
  | "low-stock"
  | "out-of-stock"
  | "overstock"
  | "expiring";

type StockAdjustment = {
  product_id: string;
  variant_id?: string;
  adjustment_type: "add" | "subtract" | "set";
  quantity: number;
  reason: string;
  reference_number?: string;
};

export function InventoryManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false);
  const [movementHistoryOpen, setMovementHistoryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleExpandedRow = (id: string) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Get total effective stock (sums variants if has_variants)
  const getEffectiveStock = (product: Product): number => {
    if (product.has_variants && product.product_variants?.length) {
      return product.product_variants
        .filter((v) => v.is_active)
        .reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0);
    }
    return product.stock_quantity ?? 0;
  };

  // Stock level thresholds
  const LOW_STOCK_THRESHOLD = 10;
  const OVERSTOCK_THRESHOLD = 100;

  // Load products and stock movements
  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Load products with related data
      const { data: products, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          product_images(url, sort_order),
          brands(name),
          categories(name),
          product_variants(id, sku, price, stock_quantity, attributes, is_active)
        `
        )
        .order("name");

      if (productsError) {
        console.error("Error loading products:", productsError);
      } else {
        setProducts(products || []);
        setFilteredProducts(products || []);
      }

      // In a real implementation, you would also load stock movements
      // For now, we'll simulate some data
      const mockMovements: StockMovement[] = [
        {
          id: "1",
          product_id: "prod1",
          type: "inbound",
          quantity: 50,
          reason: "Purchase Order #PO-001",
          reference_number: "PO-001",
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          created_by: "admin",
          product_name: "VUSE PEBBLE DISPOSABLE",
          product_sku: "VUSE-PEB-001",
        },
        {
          id: "2",
          product_id: "prod2",
          type: "outbound",
          quantity: -3,
          reason: "Sale Transaction",
          created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          product_name: "VUSE VIBE DEVICE",
          product_sku: "VUSE-VIB-001",
        },
        {
          id: "3",
          product_id: "prod3",
          type: "adjustment",
          quantity: -2,
          reason: "Damaged inventory",
          created_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
          created_by: "staff",
          product_name: "VUSE EPOD 2+ DEVICE",
          product_sku: "VUSE-EPD-001",
        },
      ];

      setStockMovements(mockMovements);
      setIsLoading(false);
    }

    loadData();
  }, []);

  // Filter products based on search and stock filter
  useEffect(() => {
    let filtered = products;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brands?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply stock filter
    switch (stockFilter) {
      case "low-stock":
        filtered = filtered.filter((p) => {
          const s = getEffectiveStock(p);
          return s <= LOW_STOCK_THRESHOLD && s > 0;
        });
        break;
      case "out-of-stock":
        filtered = filtered.filter((p) => getEffectiveStock(p) === 0);
        break;
      case "overstock":
        filtered = filtered.filter(
          (p) => getEffectiveStock(p) > OVERSTOCK_THRESHOLD
        );
        break;
      case "expiring":
        filtered = filtered.filter((p) => getEffectiveStock(p) > 0);
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, stockFilter]);

  // Get stock status badge
  const getStockStatus = (
    quantity: number
  ): {
    cls: string;
    label: string;
  } => {
    if (quantity === 0) {
      return {
        cls: "bg-red-100 text-red-700 border border-red-200",
        label: "Out of Stock",
      };
    } else if (quantity <= LOW_STOCK_THRESHOLD) {
      return {
        cls: "bg-yellow-100 text-yellow-700 border border-yellow-200",
        label: "Low Stock",
      };
    } else if (quantity > OVERSTOCK_THRESHOLD) {
      return {
        cls: "bg-blue-100 text-blue-700 border border-blue-200",
        label: "Overstock",
      };
    } else {
      return {
        cls: "bg-green-100 text-green-700 border border-green-200",
        label: "In Stock",
      };
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async (adjustment: StockAdjustment) => {
    try {
      const supabase = createClient();
      const product = products.find((p) => p.id === adjustment.product_id);

      if (!product) return;

      // Variant-level adjustment
      if (adjustment.variant_id) {
        const variant = product.product_variants?.find(
          (v) => v.id === adjustment.variant_id
        );
        if (!variant) return;

        let newQty: number;
        switch (adjustment.adjustment_type) {
          case "add":
            newQty = (variant.stock_quantity ?? 0) + adjustment.quantity;
            break;
          case "subtract":
            newQty = Math.max(
              0,
              (variant.stock_quantity ?? 0) - adjustment.quantity
            );
            break;
          case "set":
            newQty = adjustment.quantity;
            break;
          default:
            return;
        }

        const { error } = await supabase
          .from("product_variants")
          .update({ stock_quantity: newQty })
          .eq("id", adjustment.variant_id);

        if (error) {
          console.error("Error updating variant stock:", error);
          return;
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.id === adjustment.product_id
              ? {
                  ...p,
                  product_variants: p.product_variants?.map((v) =>
                    v.id === adjustment.variant_id
                      ? { ...v, stock_quantity: newQty }
                      : v
                  ),
                }
              : p
          )
        );
      } else {
        // Product-level adjustment
        let newQuantity: number;
        switch (adjustment.adjustment_type) {
          case "add":
            newQuantity = (product.stock_quantity ?? 0) + adjustment.quantity;
            break;
          case "subtract":
            newQuantity = Math.max(
              0,
              (product.stock_quantity ?? 0) - adjustment.quantity
            );
            break;
          case "set":
            newQuantity = adjustment.quantity;
            break;
          default:
            return;
        }

        const { error: updateError } = await supabase
          .from("products")
          .update({ stock_quantity: newQuantity })
          .eq("id", adjustment.product_id);

        if (updateError) {
          console.error("Error updating stock:", updateError);
          return;
        }

        setProducts((prev) =>
          prev.map((p) =>
            p.id === adjustment.product_id
              ? { ...p, stock_quantity: newQuantity }
              : p
          )
        );
      }

      // Create stock movement record
      const movementQuantity =
        adjustment.adjustment_type === "subtract"
          ? -adjustment.quantity
          : adjustment.quantity;

      const newMovement: StockMovement = {
        id: Date.now().toString(),
        product_id: adjustment.product_id,
        type: "adjustment",
        quantity: movementQuantity,
        reason: adjustment.reason,
        reference_number: adjustment.reference_number,
        created_at: new Date().toISOString(),
        created_by: "current_user", // In real implementation, get from auth
        product_name: product.name,
        product_sku: product.sku || "",
      };

      setStockMovements((prev) => [newMovement, ...prev]);
      setAdjustmentDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error processing stock adjustment:", error);
    }
  };

  // Calculate inventory stats using effective stock
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => {
    const s = getEffectiveStock(p);
    return s <= LOW_STOCK_THRESHOLD && s > 0;
  }).length;
  const outOfStockCount = products.filter(
    (p) => getEffectiveStock(p) === 0
  ).length;
  const totalValue = products.reduce((sum, p) => {
    if (p.has_variants && p.product_variants?.length) {
      return (
        sum +
        p.product_variants
          .filter((v) => v.is_active)
          .reduce(
            (vs, v) => vs + (v.price ?? p.base_price) * (v.stock_quantity ?? 0),
            0
          )
      );
    }
    return sum + p.base_price * (p.stock_quantity ?? 0);
  }, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Low Stock Alert
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {lowStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Items below {LOW_STOCK_THRESHOLD} units
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {outOfStockCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Items needing restock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventory Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <IconInput
          icon={Search}
          containerClassName="flex-1"
          placeholder="Search by product name, SKU, or brand..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select
          value={stockFilter}
          onValueChange={(value: StockFilter) => setStockFilter(value)}
        >
          <SelectTrigger className="w-50">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            <SelectItem value="overstock">Overstock</SelectItem>
            <SelectItem value="expiring">Expiring Soon</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={() => setMovementHistoryOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <History className="h-4 w-4" />
          Stock Movements
        </Button>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>
            Track and manage your product inventory levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Stock Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const effectiveStock = getEffectiveStock(product);
                const status = getStockStatus(effectiveStock);
                const stockValue =
                  product.has_variants && product.product_variants?.length
                    ? product.product_variants
                        .filter((v) => v.is_active)
                        .reduce(
                          (s, v) =>
                            s +
                            (v.price ?? product.base_price) *
                              (v.stock_quantity ?? 0),
                          0
                        )
                    : product.base_price * (product.stock_quantity ?? 0);
                const isExpanded = expandedRows.has(product.id);

                return (
                  <>
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.has_variants &&
                          product.product_variants?.length ? (
                            <button
                              type="button"
                              onClick={() => toggleExpandedRow(product.id)}
                              className="p-0.5 rounded hover:bg-gray-100"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-500" />
                              )}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          {product.product_images &&
                            product.product_images[0] && (
                              <img
                                src={product.product_images[0].url}
                                alt={product.name}
                                className="w-10 h-10 object-cover rounded"
                              />
                            )}
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {product.description?.slice(0, 50)}
                              {(product.description?.length ?? 0) > 50
                                ? "..."
                                : ""}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{product.brands?.name || "N/A"}</TableCell>
                      <TableCell>{product.categories?.name || "N/A"}</TableCell>
                      <TableCell className="text-center font-bold">
                        {effectiveStock}
                        {product.has_variants && (
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            (total)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.cls}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.has_variants
                          ? (() => {
                              const prices = (product.product_variants ?? [])
                                .filter((v) => v.is_active && v.price !== null)
                                .map((v) => v.price as number);
                              if (prices.length === 0)
                                return formatCurrency(product.base_price);
                              const min = Math.min(...prices);
                              const max = Math.max(...prices);
                              return min === max
                                ? formatCurrency(min)
                                : `${formatCurrency(min)} – ${formatCurrency(max)}`;
                            })()
                          : formatCurrency(product.base_price)}
                      </TableCell>
                      <TableCell>{formatCurrency(stockValue)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProduct(product);
                              setAdjustmentDialogOpen(true);
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Variant sub-rows */}
                    {isExpanded &&
                      product.product_variants?.map((variant) => {
                        const varLabel =
                          Object.values(variant.attributes ?? {}).join(" / ") ||
                          variant.sku;
                        const varStock = variant.stock_quantity ?? 0;
                        const varStatus = getStockStatus(varStock);
                        return (
                          <TableRow
                            key={variant.id}
                            className="bg-gray-50 text-sm"
                          >
                            <TableCell className="pl-16">
                              <span className="font-medium text-gray-700">
                                {varLabel}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                {variant.sku}
                              </span>
                            </TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell className="text-center font-semibold">
                              {varStock}
                            </TableCell>
                            <TableCell>
                              <Badge className={varStatus.cls}>
                                {varStatus.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {variant.price !== null
                                ? formatCurrency(variant.price)
                                : "—"}
                            </TableCell>
                            <TableCell>
                              {variant.price !== null
                                ? formatCurrency(variant.price * varStock)
                                : "—"}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        );
                      })}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        product={selectedProduct}
        open={adjustmentDialogOpen}
        onOpenChange={setAdjustmentDialogOpen}
        onAdjustmentSubmit={handleStockAdjustment}
      />

      {/* Stock Movement History Dialog */}
      <StockMovementDialog
        movements={stockMovements}
        open={movementHistoryOpen}
        onOpenChange={setMovementHistoryOpen}
      />
    </div>
  );
}

// Stock Adjustment Dialog Component
function StockAdjustmentDialog({
  product,
  open,
  onOpenChange,
  onAdjustmentSubmit,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdjustmentSubmit: (adjustment: StockAdjustment) => void;
}) {
  const [adjustmentType, setAdjustmentType] = useState<
    "add" | "subtract" | "set"
  >("add");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  // Reset variant selection whenever the product changes
  useEffect(() => {
    if (product?.has_variants && product.product_variants?.length) {
      setSelectedVariantId(product.product_variants[0].id);
    } else {
      setSelectedVariantId("");
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity || !reason) return;

    onAdjustmentSubmit({
      product_id: product.id,
      variant_id: selectedVariantId || undefined,
      adjustment_type: adjustmentType,
      quantity: parseInt(quantity),
      reason,
      reference_number: referenceNumber || undefined,
    });

    // Reset form
    setQuantity("");
    setReason("");
    setReferenceNumber("");
  };

  if (!product) return null;

  const hasVariants =
    product.has_variants && (product.product_variants?.length ?? 0) > 0;
  const selectedVariant = product.product_variants?.find(
    (v) => v.id === selectedVariantId
  );
  const currentStock = selectedVariant
    ? (selectedVariant.stock_quantity ?? 0)
    : (product.stock_quantity ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock: {product.name}</DialogTitle>
          <DialogDescription>
            Current stock: {currentStock} units
            {hasVariants && " (select a variant below)"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Variant selector */}
          {hasVariants && (
            <div>
              <label className="text-sm font-medium">Variant</label>
              <Select
                value={selectedVariantId}
                onValueChange={setSelectedVariantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {product.product_variants?.map((v) => {
                    const label =
                      Object.values(v.attributes ?? {}).join(" / ") || v.sku;
                    return (
                      <SelectItem key={v.id} value={v.id}>
                        {label} — {v.stock_quantity ?? 0} in stock
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Adjustment Type</label>
            <Select
              value={adjustmentType}
              onValueChange={(value: "add" | "subtract" | "set") =>
                setAdjustmentType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Stock</SelectItem>
                <SelectItem value="subtract">Remove Stock</SelectItem>
                <SelectItem value="set">Set Stock Level</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Reason</label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Damaged goods, Return, Inventory count"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">
              Reference Number (Optional)
            </label>
            <Input
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g., PO-001, RET-123"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Adjust Stock</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Stock Movement History Dialog Component
function StockMovementDialog({
  movements,
  open,
  onOpenChange,
}: {
  movements: StockMovement[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Stock Movement History</DialogTitle>
          <DialogDescription>
            Recent stock movements and adjustments
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(movement.created_at).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{movement.product_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {movement.product_sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        movement.type === "inbound"
                          ? "default"
                          : movement.type === "outbound"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {movement.type.charAt(0).toUpperCase() +
                        movement.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        movement.quantity < 0
                          ? "text-red-600"
                          : "text-green-600"
                      }
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </span>
                  </TableCell>
                  <TableCell>{movement.reason}</TableCell>
                  <TableCell>{movement.reference_number || "-"}</TableCell>
                  <TableCell>{movement.created_by || "System"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
