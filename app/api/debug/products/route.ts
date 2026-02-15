import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Test 1: Check raw products count
    const { count: totalCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // Test 2: Check published products count
    const { count: publishedCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("is_published", true);

    // Test 3: Get first 5 products (any status)
    const { data: allProducts, error: allError } = await supabase
      .from("products")
      .select("id, name, slug, is_published, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    // Test 4: Get first 5 published products with images
    const { data: publishedProducts, error: publishedError } = await supabase
      .from("products")
      .select(
        `
        id,
        slug,
        name,
        base_price,
        is_published,
        product_images(url, is_primary)
      `
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(5);

    // Test 5: Check if RLS is blocking
    const { data: userData } = await supabase.auth.getUser();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        totalProducts: totalCount,
        publishedProducts: publishedCount,
        allProducts: {
          count: allProducts?.length || 0,
          data: allProducts,
          error: allError?.message,
        },
        publishedProductsWithImages: {
          count: publishedProducts?.length || 0,
          data: publishedProducts,
          error: publishedError?.message,
        },
        currentUser: {
          authenticated: !!userData.user,
          email: userData.user?.email,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
