"use client";

import { getBrands, getCategories } from "@/app/actions/categories-brands";
import { createProductVariant } from "@/app/actions/product-variants";
import { createProduct } from "@/app/actions/products";
import { ImageUpload } from "@/components/shared/ImageUpload";
import { InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AddProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type VariantRow = {
  uid: string;
  label: string;
  price: string;
  stock: string;
};

export function AddProductDialog({ isOpen, onClose }: AddProductDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [slug, setSlug] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Pricing variant state
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
        setCategories(categoriesResult.data);
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

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("Please upload at least one product image");
      return;
    }

    setLoading(true);

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
          setLoading(false);
          return;
        }
        if (
          !row.price ||
          isNaN(parseFloat(row.price)) ||
          parseFloat(row.price) < 0
        ) {
          toast.error(`Variant "${row.label}" has an invalid price`);
          setLoading(false);
          return;
        }
        if (
          !row.stock ||
          isNaN(parseInt(row.stock)) ||
          parseInt(row.stock) < 0
        ) {
          toast.error(`Variant "${row.label}" has an invalid stock quantity`);
          setLoading(false);
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
      : parseInt(formData.get("quantity") as string);

    const data = {
      name: formData.get("name") as string,
      sku,
      description: (formData.get("description") as string) || undefined,
      category: formData.get("category") as string,
      brand_id: (formData.get("brand_id") as string) || null,
      price: basePrice,
      compare_at_price: formData.get("compare_at_price")
        ? parseFloat(formData.get("compare_at_price") as string)
        : undefined,
      cost_price: formData.get("cost_price")
        ? parseFloat(formData.get("cost_price") as string)
        : undefined,
      quantity: totalStock,
      images: images,
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

    const result = await createProduct(data);

    if (!result.success) {
      setLoading(false);
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
        // Create single default spec variant (original behaviour)
        const variantResult = await createProductVariant({
          productId: result.data.id,
          sku: `${sku}-001`,
          attributes,
          price: basePrice,
          stock_quantity: totalStock,
          is_active: true,
        });
        if (!variantResult.success) {
          toast.warning(
            "Product created but failed to save specifications. Edit the product to add them manually."
          );
        }
      }
    }

    setLoading(false);
    toast.success(result.message || "Product created successfully");

    // Reset all state
    setProductName("");
    setSlug("");
    setQrCode("");
    setImages([]);
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
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Add New Product
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 max-h-[70vh] overflow-y-auto"
          >
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Basic Information
              </h3>

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={productName}
                  onChange={handleNameChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (Auto-generated)
                </label>
                <input
                  type="text"
                  value={slug}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Will be auto-generated from product name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from product name, used in URLs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Product description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    name="brand_id"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Published
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="is_featured"
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Featured
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Product Specifications
              </h3>
              <p className="text-xs text-gray-500">
                These details appear in the Specifications table on the product
                page.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Type
                  </label>
                  <select
                    value={vapeType}
                    onChange={(e) => setVapeType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

                {/* Flavor — shown for E-Liquid and Disposable Vape */}
                {(vapeType === "E-Liquid" ||
                  vapeType === "E-Liquid (Salt Nic)" ||
                  vapeType === "Disposable Vape") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Flavor
                    </label>
                    <input
                      type="text"
                      value={specFlavor}
                      onChange={(e) => setSpecFlavor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Watermelon Lime"
                    />
                  </div>
                )}

                {/* Volume — shown for E-Liquid and Disposable Vape */}
                {(vapeType === "E-Liquid" ||
                  vapeType === "E-Liquid (Salt Nic)" ||
                  vapeType === "Disposable Vape") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Volume
                    </label>
                    <input
                      type="text"
                      value={specVolume}
                      onChange={(e) => setSpecVolume(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 30ml"
                    />
                  </div>
                )}

                {/* Nicotine Strength — E-Liquid and Disposable */}
                {(vapeType === "E-Liquid" ||
                  vapeType === "E-Liquid (Salt Nic)" ||
                  vapeType === "Disposable Vape") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nicotine Strength
                    </label>
                    <input
                      type="text"
                      value={specNicotine}
                      onChange={(e) => setSpecNicotine(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., 30mg or 30mg / 50mg"
                    />
                  </div>
                )}

                {/* PG/VG Ratio — E-Liquid only */}
                {(vapeType === "E-Liquid" ||
                  vapeType === "E-Liquid (Salt Nic)") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      PG/VG Ratio
                    </label>
                    <select
                      value={specPgvg}
                      onChange={(e) => setSpecPgvg(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="">Select ratio (optional)</option>
                      <option value="70/30">70/30 — High VG (sub-ohm)</option>
                      <option value="50/50">
                        50/50 — Balanced (pod systems)
                      </option>
                    </select>
                  </div>
                )}

                {/* Coil Compatibility — Pod System and Coil */}
                {(vapeType === "Pod System" || vapeType === "Coil") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Coil Compatibility
                    </label>
                    <input
                      type="text"
                      value={specCoil}
                      onChange={(e) => setSpecCoil(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., pod/cartridge"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Pricing & Variants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-gray-900">Pricing</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPricingVariants}
                    onChange={(e) => setHasPricingVariants(e.target.checked)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Has multiple sizes / variants
                  </span>
                </label>
              </div>

              {hasPricingVariants ? (
                /* Variant pricing table */
                <div className="space-y-3">
                  <p className="text-xs text-gray-500">
                    Add a row per size/variant. The lowest price will be used as
                    the product's base price.
                  </p>
                  <div className="rounded-md border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">
                            Label (e.g. 30ml)
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">
                            Price (₱)
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">
                            Stock
                          </th>
                          <th className="px-3 py-2 w-10" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {variantRows.map((row) => (
                          <tr key={row.uid}>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={row.label}
                                onChange={(e) =>
                                  updateVariantRow(
                                    row.uid,
                                    "label",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="e.g. 30ml"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={row.price}
                                onChange={(e) =>
                                  updateVariantRow(
                                    row.uid,
                                    "price",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={row.stock}
                                onChange={(e) =>
                                  updateVariantRow(
                                    row.uid,
                                    "stock",
                                    e.target.value
                                  )
                                }
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="0"
                                min="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              {variantRows.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(row.uid)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
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
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                  >
                    + Add variant
                  </button>

                  {/* hidden price/quantity so form validation isn't triggered */}
                  <input type="hidden" name="price" value="0" />
                  <input type="hidden" name="quantity" value="0" />

                  {/* Compare at / Cost still useful */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                        Compare at Price (₱)
                        <span className="group relative">
                          <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                          <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                            The original &ldquo;was&rdquo; price shown crossed
                            out next to the sale price (e.g.{" "}
                            <span className="line-through">₱500</span> ₱350).
                            Does not affect the actual selling price.
                          </span>
                        </span>
                      </label>
                      <input
                        type="number"
                        name="compare_at_price"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cost Price (₱)
                      </label>
                      <input
                        type="number"
                        name="cost_price"
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Single price + quantity */
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₱) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      required
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
                      Compare at Price (₱)
                      <span className="group relative">
                        <InformationCircleIcon className="h-4 w-4 text-gray-400 cursor-help" />
                        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 rounded-md bg-gray-800 px-2.5 py-1.5 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                          The original &ldquo;was&rdquo; price shown crossed out
                          next to the sale price (e.g.{" "}
                          <span className="line-through">₱500</span> ₱350). Does
                          not affect the actual selling price.
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      name="compare_at_price"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Original price for discount display
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost Price (₱)
                    </label>
                    <input
                      type="number"
                      name="cost_price"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Your cost for profit tracking
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Inventory */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Inventory
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {!hasPricingVariants && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0"
                    />
                  </div>
                )}

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="track_inventory"
                      defaultChecked
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Track Inventory
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="low_stock_threshold"
                    min="1"
                    defaultValue="10"
                    placeholder="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Alert when stock reaches this level
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Critical Stock Threshold
                  </label>
                  <input
                    type="number"
                    name="critical_stock_threshold"
                    min="1"
                    defaultValue="5"
                    placeholder="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Critical alert threshold
                  </p>
                </div>
              </div>
            </div>

            {/* Identifiers */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Identifiers & Scanning
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Barcode
                  </label>
                  <input
                    type="text"
                    name="barcode"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 1234567890123"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Standard barcode number
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    QR Code (Auto-generated) *
                  </label>
                  <input
                    type="text"
                    name="qr_code"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-gray-50"
                    placeholder="Auto-generated from slug"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated from slug. Scan this to identify product.
                  </p>
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Product Images *
              </h3>
              <ImageUpload
                value={images}
                onChange={(urls) =>
                  setImages(Array.isArray(urls) ? urls : [urls])
                }
                multiple
                maxFiles={5}
                disabled={loading}
                folder="products"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
