"use client";

import { getBrands } from "@/app/actions/categories-brands";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/actions/products";
import { ImageUpload } from "@/components/shared/ImageUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { Database } from "@/database.types";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  brand?: { name: string } | null;
  category?: { name: string } | null;
  product_images?: { url: string }[] | null;
};

interface ProductsManagementProps {
  products: Product[];
}

export function ProductsManagement({ products }: ProductsManagementProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch brands on mount
  useEffect(() => {
    async function loadBrands() {
      const result = await getBrands();
      if (result.success && result.data) {
        setBrands(result.data);
      }
    }
    loadBrands();
  }, []);

  // Auto-generate slug and QR code from product name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProductName(name);

    // Generate slug from name
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setSlug(generatedSlug);

    // Generate QR code from slug (using slug as identifier)
    setQrCode(generatedSlug);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category?.name === categoryFilter;

    const matchesBrand =
      brandFilter === "all" || product.brand?.name === brandFilter;

    const stock = product.stock_quantity || 0;
    const lowThreshold = product.low_stock_threshold || 10;
    const matchesStock =
      stockFilter === "all" ||
      (stockFilter === "in-stock" && stock > lowThreshold) ||
      (stockFilter === "low-stock" && stock > 0 && stock <= lowThreshold) ||
      (stockFilter === "out-of-stock" && stock === 0);

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  const uniqueCategories = Array.from(
    new Set(products.map((p) => p.category?.name).filter(Boolean))
  ) as string[];

  const uniqueBrands = Array.from(
    new Set(products.map((p) => p.brand?.name).filter(Boolean))
  ) as string[];

  const handleCreateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (productImages.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      sku: formData.get("sku") as string,
      description: (formData.get("description") as string) || undefined,
      category: formData.get("category") || "General",
      brand_id: (formData.get("brand_id") as string) || null,
      price: parseFloat(formData.get("price") as string),
      compare_at_price: formData.get("compare_at_price")
        ? parseFloat(formData.get("compare_at_price") as string)
        : undefined,
      cost_price: formData.get("cost_price")
        ? parseFloat(formData.get("cost_price") as string)
        : undefined,
      quantity: parseInt(formData.get("stock") as string),
      images: productImages,
      low_stock_threshold: formData.get("low_stock_threshold")
        ? parseInt(formData.get("low_stock_threshold") as string)
        : 10,
      critical_stock_threshold: formData.get("critical_stock_threshold")
        ? parseInt(formData.get("critical_stock_threshold") as string)
        : 5,
      barcode: (formData.get("barcode") as string) || undefined,
      qr_code: qrCode || undefined, // Use auto-generated QR code
      product_type: (formData.get("product_type") as string) || undefined,
      track_inventory: formData.get("track_inventory") === "on",
      is_published: formData.get("is_published") === "on",
      is_featured: formData.get("is_featured") === "on",
    };

    const result = await createProduct(data as any);

    setIsSubmitting(false);

    if (result.success) {
      toast.success("Product created successfully");
      setShowAddDialog(false);
      setProductImages([]);
      setProductName("");
      setSlug("");
      setQrCode("");
      router.refresh();
    } else {
      toast.error(result.message || "Failed to create product");
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductImages(product.product_images?.map((img) => img.url) || []);
    setShowEditDialog(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const data = {
        name: formData.get("name") as string,
        base_price: parseFloat(formData.get("price") as string),
        stock_quantity: parseInt(formData.get("stock") as string),
      };

      const result = await updateProduct(selectedProduct.id, data);

      if (result.success) {
        toast.success("Product updated successfully");
        setShowEditDialog(false);
        setSelectedProduct(null);
        setProductImages([]);
        router.refresh();
      } else {
        toast.error(result.message || "Failed to update product");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An unexpected error occurred while updating the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);

    try {
      const result = await deleteProduct(selectedProduct.id);

      if (result.success) {
        toast.success("Product deleted successfully");
        setShowDeleteDialog(false);
        setSelectedProduct(null);
        router.refresh();
      } else {
        // Display the error message from the server
        toast.error(result.message || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("An unexpected error occurred while deleting the product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const getStockStatus = (product: Product) => {
    const stock = product.stock_quantity || 0;
    const lowThreshold = product.low_stock_threshold || 10;
    const criticalThreshold = product.critical_stock_threshold || 5;

    if (stock === 0) {
      return { status: "out", label: "Out of Stock", color: "destructive" };
    } else if (stock <= criticalThreshold) {
      return { status: "critical", label: "Critical", color: "destructive" };
    } else if (stock <= lowThreshold) {
      return { status: "low", label: "Low Stock", color: "secondary" };
    }
    return { status: "good", label: "In Stock", color: "default" };
  };

  const stats = {
    total: products.length,
    inStock: products.filter((p) => (p.stock_quantity || 0) > 0).length,
    lowStock: products.filter(
      (p) =>
        (p.stock_quantity || 0) <= (p.low_stock_threshold || 10) &&
        (p.stock_quantity || 0) > 0
    ).length,
    outOfStock: products.filter((p) => (p.stock_quantity || 0) === 0).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and pricing
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Product</DialogTitle>
              <DialogDescription>
                Create a new product in your inventory.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateProduct}>
              <div className="space-y-4 py-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Enter product name"
                        required
                        value={productName}
                        onChange={handleNameChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">SKU *</Label>
                      <Input
                        id="sku"
                        name="sku"
                        placeholder="e.g., VAPE-001"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (Auto-generated)</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={slug}
                      readOnly
                      disabled
                      className="bg-gray-50 text-gray-600 cursor-not-allowed"
                      placeholder="Will be auto-generated from product name"
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from product name, used in URLs
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      disabled={isSubmitting}
                      className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Product description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        name="category"
                        required
                        disabled={isSubmitting}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select category</option>
                        <option value="Vape Devices">Vape Devices</option>
                        <option value="E-Liquids">E-Liquids</option>
                        <option value="Coils">Coils</option>
                        <option value="Accessories">Accessories</option>
                        <option value="Pods">Pods</option>
                        <option value="Batteries">Batteries</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand">Brand</Label>
                      <select
                        id="brand_id"
                        name="brand_id"
                        className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        disabled={isSubmitting}
                      >
                        <option value="">Select brand (optional)</option>
                        {brands.map((brand) => (
                          <option key={brand.id} value={brand.id}>
                            {brand.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product_type">Product Type</Label>
                      <select
                        id="product_type"
                        name="product_type"
                        disabled={isSubmitting}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select type</option>
                        <option value="physical">Physical Product</option>
                        <option value="digital">Digital Product</option>
                        <option value="service">Service</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4 pt-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_published"
                          defaultChecked
                          disabled={isSubmitting}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">Published</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_featured"
                          disabled={isSubmitting}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">Featured</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Pricing</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (₱) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compare_at_price">
                        Compare at Price (₱)
                      </Label>
                      <Input
                        id="compare_at_price"
                        name="compare_at_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cost_price">Cost Price (₱)</Label>
                      <Input
                        id="cost_price"
                        name="cost_price"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Inventory */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Inventory</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock">Stock Quantity *</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        placeholder="0"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="track_inventory"
                          defaultChecked
                          disabled={isSubmitting}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm">Track Inventory</span>
                      </label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="low_stock_threshold">
                        Low Stock Threshold
                      </Label>
                      <Input
                        id="low_stock_threshold"
                        name="low_stock_threshold"
                        type="number"
                        defaultValue="10"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="critical_stock_threshold">
                        Critical Stock Threshold
                      </Label>
                      <Input
                        id="critical_stock_threshold"
                        name="critical_stock_threshold"
                        type="number"
                        defaultValue="5"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Identifiers */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">
                    Identifiers & Scanning
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="barcode">Barcode</Label>
                      <Input
                        id="barcode"
                        name="barcode"
                        placeholder="e.g., 1234567890123"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Standard barcode number
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="qr_code">
                        QR Code (Auto-generated) *
                      </Label>
                      <Input
                        id="qr_code"
                        name="qr_code"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        className="bg-gray-50"
                        placeholder="Auto-generated from slug"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-muted-foreground">
                        Auto-generated from slug. Scan this to identify product.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Images *</Label>
                  <ImageUpload
                    value={productImages}
                    onChange={(urls) =>
                      setProductImages(Array.isArray(urls) ? urls : [urls])
                    }
                    multiple
                    maxFiles={5}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Product"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.inStock}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.lowStock}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.outOfStock}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {uniqueCategories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={brandFilter} onValueChange={setBrandFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {uniqueBrands.map((brand) => (
              <SelectItem key={brand} value={brand}>
                {brand}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Manage your product catalog and inventory levels.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const imageUrl = product.product_images?.[0]?.url;

                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-50">
                          {product.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{product.sku}</TableCell>
                    <TableCell>{product.brand?.name || "-"}</TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell>{formatCurrency(product.base_price)}</TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {product.stock_quantity || 0}
                      </div>
                      {product.low_stock_threshold && (
                        <div className="text-xs text-muted-foreground">
                          Min: {product.low_stock_threshold}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stockStatus.color as
                            | "default"
                            | "destructive"
                            | "secondary"
                        }
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Product
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleOpenDeleteDialog(product)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-2">
                      <Package className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? "No products found matching your search."
                          : "No products available."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Product Name *</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={selectedProduct?.name}
                    placeholder="Enter product name"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    defaultValue={selectedProduct?.category?.name || ""}
                    placeholder="Category (read-only)"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₱) *</Label>
                  <Input
                    id="edit-price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={selectedProduct?.base_price}
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stock">Stock Quantity *</Label>
                  <Input
                    id="edit-stock"
                    name="stock"
                    type="number"
                    defaultValue={selectedProduct?.stock_quantity ?? 0}
                    placeholder="0"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Product Images (Read-only)</Label>
                <div className="grid grid-cols-5 gap-2">
                  {productImages.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square overflow-hidden rounded-lg border"
                    >
                      <Image
                        src={url}
                        alt={`Product ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedProduct(null);
                  setProductImages([]);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{selectedProduct?.name}</strong> and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedProduct(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
