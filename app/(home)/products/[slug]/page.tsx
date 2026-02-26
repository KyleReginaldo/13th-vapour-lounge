import { getProductBySlug, getRelatedProducts } from "@/app/actions/products";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductInfo } from "@/components/product/ProductInfo";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetailClient } from "./ProductDetailClient";

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProductBySlug(slug);

    return {
      title: product.meta_title || product.name,
      description:
        product.meta_description ||
        product.description?.slice(0, 160) ||
        `Buy ${product.name} at 13th Vapour Lounge`,
      openGraph: {
        title: product.name,
        description: product.description || undefined,
        images: product.product_images?.[0]?.url
          ? [product.product_images[0].url]
          : [],
      },
    };
  } catch {
    return {
      title: "Product Not Found",
    };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  let product;

  try {
    product = await getProductBySlug(slug);
  } catch (error) {
    notFound();
  }

  // Fetch related products
  const relatedProducts = await getRelatedProducts(
    product.id,
    product.category_id,
    4
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  return (
    <Container className="py-8">
      {/* Breadcrumbs */}
      <Breadcrumb />

      {/* Product Detail */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Product Gallery */}
        <div>
          <ProductGallery
            images={product.product_images || []}
            productName={product.name}
          />
        </div>

        {/* Product Info & Actions */}
        <div className="space-y-6">
          <ProductInfo product={product} />

          {/* Client-side interactive components (variants, quantity, add to cart) */}
          <ProductDetailClient
            product={product}
            variants={product.product_variants || []}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      {/* Product Specifications */}
      {product.product_variants && product.product_variants.length > 0 && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Specifications</h2>
          <div className="grid gap-4 rounded-lg border p-6 sm:grid-cols-2">
            {product.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{product.brand.name}</p>
              </div>
            )}
            {product.category && (
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{product.category.name}</p>
              </div>
            )}
            {/* Variant-derived specs */}
            {product.product_variants &&
              product.product_variants.length > 0 &&
              (() => {
                // Collect unique values per attribute key across all variants
                const attrMap = new Map<string, Set<string>>();
                for (const v of product.product_variants) {
                  if (!v.attributes) continue;
                  const attrs = v.attributes as Record<string, string>;
                  for (const [key, val] of Object.entries(attrs)) {
                    if (!val) continue;
                    if (!attrMap.has(key)) attrMap.set(key, new Set());
                    attrMap.get(key)!.add(String(val));
                  }
                }

                // Friendly labels for known keys (ordered)
                const KNOWN_KEYS: Record<string, string> = {
                  vape_type: "Product Type",
                  flavor_profile: "Flavor",
                  flavor: "Flavor",
                  nicotine_strength: "Nicotine Strength",
                  nicotine: "Nicotine Strength",
                  volume_capacity: "Volume",
                  volume: "Volume",
                  coil_compatibility: "Coil Compatibility",
                  coil: "Coil Compatibility",
                  pg_vg_ratio: "PG/VG Ratio",
                  pg_vg: "PG/VG Ratio",
                };

                const PRIORITY_ORDER = [
                  "vape_type",
                  "flavor_profile",
                  "flavor",
                  "volume_capacity",
                  "volume",
                  "nicotine_strength",
                  "nicotine",
                  "pg_vg_ratio",
                  "pg_vg",
                  "coil_compatibility",
                  "coil",
                ];

                // PG/VG descriptions
                function pgvgDescription(value: string): string | null {
                  const v = value.toLowerCase();
                  if (
                    v.includes("70/30") ||
                    v.includes("70%") ||
                    v.startsWith("70")
                  ) {
                    return "High VG — ideal for sub-ohm devices. Dense vapor, smooth throat hit.";
                  }
                  if (v.includes("50/50")) {
                    return "Balanced mix — ideal for pod systems. Stronger throat hit.";
                  }
                  return null;
                }

                // Render known keys first (in priority order), then any remaining unknown keys
                const rendered = new Set<string>();
                const items: React.ReactNode[] = [];

                for (const key of PRIORITY_ORDER) {
                  if (!attrMap.has(key)) continue;
                  rendered.add(key);
                  const label = KNOWN_KEYS[key];
                  const values = Array.from(attrMap.get(key)!);
                  const valueStr = values.join(", ");
                  const isPgVg = key === "pg_vg_ratio" || key === "pg_vg";

                  items.push(
                    <div key={key}>
                      <p className="text-sm text-muted-foreground">{label}</p>
                      <p className="font-medium">{valueStr}</p>
                      {isPgVg &&
                        (() => {
                          const descs = [
                            ...new Set(
                              values.map(pgvgDescription).filter(Boolean)
                            ),
                          ];
                          return descs.length > 0 ? (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              {descs[0]}
                            </p>
                          ) : null;
                        })()}
                    </div>
                  );
                }

                // Remaining unknown keys
                for (const [key, values] of attrMap.entries()) {
                  if (rendered.has(key)) continue;
                  items.push(
                    <div key={key}>
                      <p className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, " ")}
                      </p>
                      <p className="font-medium">
                        {Array.from(values).join(", ")}
                      </p>
                    </div>
                  );
                }

                return items;
              })()}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div id="related-products" className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold">You May Also Like</h2>
          <Suspense
            fallback={
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-100 w-full" />
                ))}
              </div>
            }
          >
            <ProductGrid products={relatedProducts} />
          </Suspense>
        </div>
      )}

      {/* Reviews Section Placeholder */}
      <div id="reviews" className="mt-12 space-y-6">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">
            Reviews coming soon. Check back later!
          </p>
        </div>
      </div>
    </Container>
  );
}
