"use client";

import { getBrands, getCategories } from "@/app/actions/categories-brands";
import {
  createProductVariant,
  updateProductVariant,
} from "@/app/actions/product-variants";
import {
  createProduct,
  deleteProduct,
  ProductFormData,
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
import { IconInput } from "@/components/ui/icon-input";
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
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Eye,
  Filter,
  Info,
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

type ProductVariant = {
  id: string;
  sku: string;
  price: number | null;
  stock_quantity: number | null;
  attributes: Record<string, string>;
  is_active: boolean | null;
};

type VariantRow = {
  uid: string;
  label: string;
  price: string;
  stock: string;
};

type Product = Database["public"]["Tables"]["products"]["Row"] & {
  brand?: { name: string } | null;
  category?: { name: string } | null;
  product_images?: { url: string }[] | null;
  product_variants?: ProductVariant[];
};

interface ProductsManagementProps {
  products: Product[];
  isAdmin?: boolean;
}

export function ProductsManagement({
  products,
  isAdmin = false,
}: ProductsManagementProps) {
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
  const [dbCategories, setDbCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Variant editing state
  const [editVariants, setEditVariants] = useState<ProductVariant[]>([]);
  const [editVariantsLoading, setEditVariantsLoading] = useState(false);

  // Add-product pricing variant state
  const [hasPricingVariants, setHasPricingVariants] = useState(false);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([
    { uid: crypto.randomUUID(), label: "", price: "", stock: "" },
  ]);

  const addVariantRow = () =>
    setVariantRows((prev) => [
      ...prev,
      { uid: crypto.randomUUID(), label: "", price: "", stock: "" },
    ]);

  const removeVariantRow = (uid: string) =>
    setVariantRows((prev) => prev.filter((r) => r.uid !== uid));

  const updateVariantRow = (
    uid: string,
    field: keyof Omit<VariantRow, "uid">,
    value: string
  ) =>
    setVariantRows((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, [field]: value } : r))
    );

  // Spec / attributes state
  const [vapeType, setVapeType] = useState("");
  const [specFlavor, setSpecFlavor] = useState("");
  const [specVolume, setSpecVolume] = useState("");
  const [specNicotine, setSpecNicotine] = useState("");
  const [specPgvg, setSpecPgvg] = useState("");
  const [specCoil, setSpecCoil] = useState("");

  // Fetch brands and categories on mount
  useEffect(() => {
    async function loadData() {
      const [brandsResult, categoriesResult] = await Promise.all([
        getBrands(),
        getCategories(),
      ]);
      if (brandsResult.success && brandsResult.data)
        setBrands(brandsResult.data);
      if (categoriesResult.success && categoriesResult.data)
        setDbCategories(categoriesResult.data);
    }
    loadData();
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
    const sku = formData.get("sku") as string;

    // Build vape spec attributes
    const attributes: Record<string, string> = {};
    if (vapeType) attributes.vape_type = vapeType;
    if (specFlavor.trim()) attributes.flavor_profile = specFlavor.trim();
    if (specVolume.trim()) attributes.volume_capacity = specVolume.trim();
    if (specNicotine.trim()) attributes.nicotine_strength = specNicotine.trim();
    if (specPgvg) attributes.pg_vg_ratio = specPgvg;
    if (specCoil.trim()) attributes.coil_compatibility = specCoil.trim();
    const hasAttributes = Object.keys(attributes).length > 0;

    // Validate pricing variant rows if enabled
    if (hasPricingVariants) {
      for (const row of variantRows) {
        if (!row.label.trim()) {
          toast.error('Each variant must have a label (e.g. "30ml")');
          setIsSubmitting(false);
          return;
        }
        if (
          !row.price ||
          isNaN(parseFloat(row.price)) ||
          parseFloat(row.price) < 0
        ) {
          toast.error(`Variant "${row.label}" has an invalid price`);
          setIsSubmitting(false);
          return;
        }
        if (
          !row.stock ||
          isNaN(parseInt(row.stock)) ||
          parseInt(row.stock) < 0
        ) {
          toast.error(`Variant "${row.label}" has an invalid stock quantity`);
          setIsSubmitting(false);
          return;
        }
      }
    }

    // Compute price & quantity from variants when applicable
    const variantPrices = variantRows.map((r) => parseFloat(r.price));
    const basePrice = hasPricingVariants
      ? Math.min(...variantPrices)
      : parseFloat(formData.get("price") as string);
    const totalStock = hasPricingVariants
      ? variantRows.reduce((s, r) => s + parseInt(r.stock), 0)
      : parseInt(formData.get("stock") as string);

    const data = {
      name: formData.get("name") as string,
      sku,
      description: (formData.get("description") as string) || undefined,
      category: formData.get("category") || "General",
      brand_id: (formData.get("brand_id") as string) || null,
      price: basePrice,
      compare_at_price: formData.get("compare_at_price")
        ? parseFloat(formData.get("compare_at_price") as string)
        : undefined,
      cost_price: formData.get("cost_price")
        ? parseFloat(formData.get("cost_price") as string)
        : undefined,
      quantity: totalStock,
      images: productImages,
      low_stock_threshold: formData.get("low_stock_threshold")
        ? parseInt(formData.get("low_stock_threshold") as string)
        : 10,
      critical_stock_threshold: formData.get("critical_stock_threshold")
        ? parseInt(formData.get("critical_stock_threshold") as string)
        : 5,
      barcode: (formData.get("barcode") as string) || undefined,
      qr_code: qrCode || undefined,
      product_type: hasPricingVariants || hasAttributes ? "variant" : "simple",
      has_variants: hasPricingVariants || hasAttributes,
      track_inventory: formData.get("track_inventory") === "on",
      is_published: formData.get("is_published") === "on",
      is_featured: formData.get("is_featured") === "on",
    };

    const result = await createProduct(data as any);

    if (!result.success) {
      setIsSubmitting(false);
      toast.error(result.message || "Failed to create product");
      return;
    }

    if (result.data?.id) {
      if (hasPricingVariants) {
        // Create one variant per row (with optional spec attrs merged in)
        for (let i = 0; i < variantRows.length; i++) {
          const row = variantRows[i];
          const varAttrs: Record<string, string> = { size: row.label };
          if (hasAttributes) Object.assign(varAttrs, attributes);
          await createProductVariant({
            productId: result.data.id,
            sku: `${sku}-${String(i + 1).padStart(3, "0")}`,
            attributes: varAttrs,
            price: parseFloat(row.price),
            stock_quantity: parseInt(row.stock),
            is_active: true,
          });
        }
      } else if (hasAttributes) {
        // Create single default spec variant
        const variantResult = await createProductVariant({
          productId: result.data.id,
          sku: `${sku}-001`,
          attributes,
          price: basePrice,
          stock_quantity: totalStock,
          is_active: true,
        });
        if (!variantResult.success) {
          toast.warning("Product created but failed to save specifications.");
        }
      }
    }

    setIsSubmitting(false);
    toast.success("Product created successfully");
    setShowAddDialog(false);
    setProductImages([]);
    setProductName("");
    setSlug("");
    setQrCode("");
    setHasPricingVariants(false);
    setVariantRows([
      { uid: crypto.randomUUID(), label: "", price: "", stock: "" },
    ]);
    setVapeType("");
    setSpecFlavor("");
    setSpecVolume("");
    setSpecNicotine("");
    setSpecPgvg("");
    setSpecCoil("");
    router.refresh();
  };

  const handleEditProduct = async (product: Product) => {
    setSelectedProduct(product);
    setProductImages(product.product_images?.map((img) => img.url) || []);
    setShowEditDialog(true);

    if (product.has_variants) {
      setEditVariantsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("product_variants")
        .select("id, sku, price, stock_quantity, attributes, is_active")
        .eq("product_id", product.id)
        .order("sort_order");
      setEditVariants((data as ProductVariant[]) ?? []);
      setEditVariantsLoading(false);
    } else {
      setEditVariants([]);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsSubmitting(true);

    // Read formData immediately — e.currentTarget becomes null after any await
    const formData = new FormData(e.currentTarget);

    // Common fields shared by both variant and non-variant products
    const commonData: Record<string, any> = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      compare_at_price: formData.get("compare_at_price")
        ? parseFloat(formData.get("compare_at_price") as string)
        : null,
      cost_price: formData.get("cost_price")
        ? parseFloat(formData.get("cost_price") as string)
        : null,
      low_stock_threshold: formData.get("low_stock_threshold")
        ? parseInt(formData.get("low_stock_threshold") as string)
        : null,
      critical_stock_threshold: formData.get("critical_stock_threshold")
        ? parseInt(formData.get("critical_stock_threshold") as string)
        : null,
      barcode: (formData.get("barcode") as string) || null,
      is_published: formData.get("is_published") === "on",
      is_featured: formData.get("is_featured") === "on",
      track_inventory: formData.get("track_inventory") === "on",
      brand_id: (formData.get("brand_id") as string) || null,
    };
    const categoryId = formData.get("category_id") as string;
    if (categoryId) commonData.category_id = categoryId;

    try {
      if (selectedProduct.has_variants && editVariants.length > 0) {
        // Update each variant's price and stock
        let allOk = true;
        for (const v of editVariants) {
          const res = await updateProductVariant({
            variantId: v.id,
            price: v.price ?? undefined,
            stock_quantity: v.stock_quantity ?? undefined,
          });
          if (!res.success) allOk = false;
        }

        // Derive base_price from lowest variant price
        const validPrices = editVariants
          .filter((v) => v.price != null)
          .map((v) => v.price!);
        const minPrice =
          validPrices.length > 0
            ? Math.min(...validPrices)
            : selectedProduct.base_price;

        const variantUpdateData = {
          ...commonData,
          base_price: minPrice,
        };
        await updateProduct(
          selectedProduct.id,
          variantUpdateData as unknown as Partial<ProductFormData>
        );

        if (allOk) {
          toast.success("Product updated successfully");
        } else {
          toast.warning("Some variants failed to update");
        }
      } else {
        const singleData = {
          ...commonData,
          base_price: parseFloat(formData.get("price") as string),
          stock_quantity: parseInt(formData.get("stock") as string),
        };

        const result = await updateProduct(
          selectedProduct.id,
          singleData as unknown as Partial<ProductFormData>
        );

        if (result.success) {
          toast.success("Product updated successfully");
        } else {
          toast.error(result.message || "Failed to update product");
          return;
        }
      }

      setShowEditDialog(false);
      setSelectedProduct(null);
      setProductImages([]);
      setEditVariants([]);
      router.refresh();
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
      return {
        status: "out",
        label: "Out of Stock",
        cls: "bg-red-100 text-red-700 border border-red-200",
      };
    } else if (stock <= criticalThreshold) {
      return {
        status: "critical",
        label: "Critical",
        cls: "bg-red-100 text-red-700 border border-red-200",
      };
    } else if (stock <= lowThreshold) {
      return {
        status: "low",
        label: "Low Stock",
        cls: "bg-yellow-100 text-yellow-700 border border-yellow-200",
      };
    }
    return {
      status: "good",
      label: "In Stock",
      cls: "bg-green-100 text-green-700 border border-green-200",
    };
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
                  <input
                    type="hidden"
                    name="sku"
                    value={
                      slug ||
                      productName
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/(^-|-$)/g, "")
                    }
                  />
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
                        {dbCategories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
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

                {/* Product Specifications */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">
                    Product Specifications
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    These appear in the Specifications table on the product
                    page.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Product Type</Label>
                      <select
                        value={vapeType}
                        onChange={(e) => setVapeType(e.target.value)}
                        disabled={isSubmitting}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select vape type (optional)</option>
                        <option value="E-Liquid">E-Liquid</option>
                        <option value="E-Liquid (Salt Nic)">
                          E-Liquid (Salt Nic)
                        </option>
                        <option value="Disposable Vape">Disposable Vape</option>
                        <option value="Pod System">Pod System</option>
                        <option value="Coil">Coil</option>
                      </select>
                    </div>

                    {(vapeType === "E-Liquid" ||
                      vapeType === "E-Liquid (Salt Nic)" ||
                      vapeType === "Disposable Vape") && (
                      <div className="space-y-2">
                        <Label>Flavor</Label>
                        <Input
                          value={specFlavor}
                          onChange={(e) => setSpecFlavor(e.target.value)}
                          placeholder="e.g., Watermelon Lime"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {(vapeType === "E-Liquid" ||
                      vapeType === "E-Liquid (Salt Nic)" ||
                      vapeType === "Disposable Vape") && (
                      <div className="space-y-2">
                        <Label>Volume</Label>
                        <Input
                          value={specVolume}
                          onChange={(e) => setSpecVolume(e.target.value)}
                          placeholder="e.g., 30ml"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {(vapeType === "E-Liquid" ||
                      vapeType === "E-Liquid (Salt Nic)" ||
                      vapeType === "Disposable Vape") && (
                      <div className="space-y-2">
                        <Label>Nicotine Strength</Label>
                        <Input
                          value={specNicotine}
                          onChange={(e) => setSpecNicotine(e.target.value)}
                          placeholder="e.g., 30mg or 30mg / 50mg"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {(vapeType === "E-Liquid" ||
                      vapeType === "E-Liquid (Salt Nic)") && (
                      <div className="space-y-2">
                        <Label>PG/VG Ratio</Label>
                        <select
                          value={specPgvg}
                          onChange={(e) => setSpecPgvg(e.target.value)}
                          disabled={isSubmitting}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select ratio (optional)</option>
                          <option value="70/30">
                            70/30 — High VG (sub-ohm)
                          </option>
                          <option value="50/50">
                            50/50 — Balanced (pod systems)
                          </option>
                        </select>
                      </div>
                    )}

                    {(vapeType === "Pod System" || vapeType === "Coil") && (
                      <div className="space-y-2">
                        <Label>Coil Compatibility</Label>
                        <Input
                          value={specCoil}
                          onChange={(e) => setSpecCoil(e.target.value)}
                          placeholder="e.g., pod/cartridge"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-semibold text-sm">Pricing</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPricingVariants}
                        onChange={(e) =>
                          setHasPricingVariants(e.target.checked)
                        }
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">
                        Has multiple sizes / variants
                      </span>
                    </label>
                  </div>

                  {hasPricingVariants ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Add a row per size/variant. The lowest price will be
                        used as the product&apos;s base price.
                      </p>
                      <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Label (e.g. 30ml)
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Price (₱)
                              </th>
                              <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                                Stock
                              </th>
                              <th className="px-3 py-2 w-10" />
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {variantRows.map((row) => (
                              <tr key={row.uid}>
                                <td className="px-3 py-2">
                                  <Input
                                    value={row.label}
                                    onChange={(e) =>
                                      updateVariantRow(
                                        row.uid,
                                        "label",
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g. 30ml"
                                    disabled={isSubmitting}
                                    className="h-8"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    type="number"
                                    value={row.price}
                                    onChange={(e) =>
                                      updateVariantRow(
                                        row.uid,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={isSubmitting}
                                    className="h-8"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <Input
                                    type="number"
                                    value={row.stock}
                                    onChange={(e) =>
                                      updateVariantRow(
                                        row.uid,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    placeholder="0"
                                    min="0"
                                    disabled={isSubmitting}
                                    className="h-8"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  {variantRows.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeVariantRow(row.uid)}
                                      className="text-red-400 hover:text-red-600 transition-colors text-lg leading-none"
                                    >
                                      &times;
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        onClick={addVariantRow}
                        disabled={isSubmitting}
                        className="text-sm text-primary hover:underline font-medium"
                      >
                        + Add variant
                      </button>
                      {/* hidden fields so form validation isn't triggered */}
                      <input type="hidden" name="price" value="0" />
                      <input type="hidden" name="stock" value="0" />
                      {/* Compare at / Cost */}
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1">
                            <Label htmlFor="compare_at_price">
                              Compare at Price (₱)
                            </Label>
                            <span className="group relative">
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                                The original &ldquo;was&rdquo; price shown
                                crossed out next to the sale price (e.g.{" "}
                                <span className="line-through">₱500</span>{" "}
                                ₱350). Does not affect the actual selling price.
                              </span>
                            </span>
                          </div>
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
                  ) : (
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
                        <div className="flex items-center gap-1">
                          <Label htmlFor="compare_at_price">
                            Compare at Price (₱)
                          </Label>
                          <span className="group relative">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                              The original &ldquo;was&rdquo; price shown crossed
                              out next to the sale price (e.g.{" "}
                              <span className="line-through">₱500</span> ₱350).
                              Does not affect the actual selling price.
                            </span>
                          </span>
                        </div>
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
                  )}
                </div>

                {/* Inventory */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm">Inventory</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {!hasPricingVariants && (
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
                    )}
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
                        placeholder="10"
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
                        placeholder="5"
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
                    folder="products"
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
        <IconInput
          icon={Search}
          containerClassName="flex-1 min-w-50 max-w-sm"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-45">
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
          <SelectTrigger className="w-45">
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
          <SelectTrigger className="w-45">
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
                    <TableCell>{product.brand?.name || "-"}</TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell>
                      {(() => {
                        if (
                          product.has_variants &&
                          product.product_variants?.length
                        ) {
                          const prices = product.product_variants
                            .filter((v) => v.is_active && v.price !== null)
                            .map((v) => v.price as number);
                          if (prices.length === 0)
                            return formatCurrency(product.base_price);
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max
                            ? formatCurrency(min)
                            : `${formatCurrency(min)} – ${formatCurrency(max)}`;
                        }
                        return formatCurrency(product.base_price);
                      })()}
                    </TableCell>
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
                      <Badge className={stockStatus.cls}>
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
                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleOpenDeleteDialog(product)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Product
                              </DropdownMenuItem>
                            </>
                          )}
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
            <div className="space-y-5 py-4">
              {/* Basic Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">
                  Basic Information
                </h4>
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
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    name="description"
                    rows={3}
                    defaultValue={selectedProduct?.description ?? ""}
                    disabled={isSubmitting}
                    className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Product description..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <select
                      id="edit-category"
                      name="category_id"
                      defaultValue={selectedProduct?.category_id ?? ""}
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select category</option>
                      {dbCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-brand">Brand</Label>
                    <select
                      id="edit-brand"
                      name="brand_id"
                      defaultValue={selectedProduct?.brand_id ?? ""}
                      disabled={isSubmitting}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">No brand</option>
                      {brands.map((brand) => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_published"
                      defaultChecked={selectedProduct?.is_published ?? true}
                      disabled={isSubmitting}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Published</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_featured"
                      defaultChecked={selectedProduct?.is_featured ?? false}
                      disabled={isSubmitting}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Featured</span>
                  </label>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">Pricing</h4>
                {selectedProduct?.has_variants ? (
                  <div className="space-y-3">
                    {editVariantsLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Loading variants...
                      </p>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">
                                Variant
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Price (₱)
                              </th>
                              <th className="px-3 py-2 text-left font-medium">
                                Stock
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {editVariants.map((v) => {
                              const label =
                                Object.values(v.attributes ?? {}).join(" / ") ||
                                v.sku;
                              return (
                                <tr key={v.id}>
                                  <td className="px-3 py-2 font-medium">
                                    {label}
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={v.price ?? ""}
                                      onChange={(e) =>
                                        setEditVariants((prev) =>
                                          prev.map((ev) =>
                                            ev.id === v.id
                                              ? {
                                                  ...ev,
                                                  price:
                                                    parseFloat(
                                                      e.target.value
                                                    ) || null,
                                                }
                                              : ev
                                          )
                                        )
                                      }
                                      disabled={isSubmitting}
                                      className="h-8"
                                      placeholder="0.00"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={v.stock_quantity ?? ""}
                                      onChange={(e) =>
                                        setEditVariants((prev) =>
                                          prev.map((ev) =>
                                            ev.id === v.id
                                              ? {
                                                  ...ev,
                                                  stock_quantity:
                                                    parseInt(e.target.value) ||
                                                    0,
                                                }
                                              : ev
                                          )
                                        )
                                      }
                                      disabled={isSubmitting}
                                      className="h-8"
                                      placeholder="0"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <Label htmlFor="edit-compare">
                            Compare at Price (₱)
                          </Label>
                          <span className="group relative">
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                              The original &ldquo;was&rdquo; price shown crossed
                              out next to the sale price. Does not affect the
                              actual selling price.
                            </span>
                          </span>
                        </div>
                        <Input
                          id="edit-compare"
                          name="compare_at_price"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={selectedProduct?.compare_at_price ?? ""}
                          placeholder="0.00"
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-cost">Cost Price (₱)</Label>
                        <Input
                          id="edit-cost"
                          name="cost_price"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={selectedProduct?.cost_price ?? ""}
                          placeholder="0.00"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
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
                      <div className="flex items-center gap-1">
                        <Label htmlFor="edit-compare">
                          Compare at Price (₱)
                        </Label>
                        <span className="group relative">
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                            The original &ldquo;was&rdquo; price shown crossed
                            out next to the sale price. Does not affect the
                            actual selling price.
                          </span>
                        </span>
                      </div>
                      <Input
                        id="edit-compare"
                        name="compare_at_price"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={selectedProduct?.compare_at_price ?? ""}
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-cost">Cost Price (₱)</Label>
                      <Input
                        id="edit-cost"
                        name="cost_price"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={selectedProduct?.cost_price ?? ""}
                        placeholder="0.00"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inventory */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">
                  Inventory
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {!selectedProduct?.has_variants && (
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
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="edit-low-stock">Low Stock Threshold</Label>
                    <Input
                      id="edit-low-stock"
                      name="low_stock_threshold"
                      type="number"
                      min="0"
                      defaultValue={selectedProduct?.low_stock_threshold ?? 10}
                      disabled={isSubmitting}
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-critical-stock">
                      Critical Stock Threshold
                    </Label>
                    <Input
                      id="edit-critical-stock"
                      name="critical_stock_threshold"
                      type="number"
                      min="0"
                      defaultValue={
                        selectedProduct?.critical_stock_threshold ?? 5
                      }
                      disabled={isSubmitting}
                      placeholder="5"
                    />
                  </div>
                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="track_inventory"
                        defaultChecked={
                          selectedProduct?.track_inventory ?? true
                        }
                        disabled={isSubmitting}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Track Inventory</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Identifiers */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm border-b pb-1">
                  Identifiers
                </h4>
                <div className="space-y-2">
                  <Label htmlFor="edit-barcode">Barcode</Label>
                  <Input
                    id="edit-barcode"
                    name="barcode"
                    defaultValue={selectedProduct?.barcode ?? ""}
                    placeholder="e.g., 1234567890123"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Images */}
              {productImages.length > 0 && (
                <div className="space-y-2">
                  <Label>Product Images</Label>
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
              )}
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
