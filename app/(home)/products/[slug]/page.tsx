import { getProductBySlug, getRelatedProducts } from "@/app/actions/products";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { Container } from "@/components/layout/Container";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductInfo } from "@/components/product/ProductInfo";
import { Skeleton } from "@/components/ui/skeleton";
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
          />
        </div>
      </div>

      {/* Product Specifications */}
      {product.product_type && (
        <div className="mt-12 space-y-4">
          <h2 className="text-2xl font-bold">Specifications</h2>
          <div className="grid gap-4 rounded-lg border p-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Product Type</p>
              <p className="font-medium">{product.product_type}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SKU</p>
              <p className="font-medium">{product.sku}</p>
            </div>
            {product.barcode && (
              <div>
                <p className="text-sm text-muted-foreground">Barcode</p>
                <p className="font-medium">{product.barcode}</p>
              </div>
            )}
            {product.brand && (
              <div>
                <p className="text-sm text-muted-foreground">Brand</p>
                <p className="font-medium">{product.brand.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 space-y-6">
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
