import { NextResponse } from "next/server";

// Placeholder API endpoint for products
export async function GET() {
  return NextResponse.json(
    { message: "Products API endpoint - coming soon" },
    { status: 501 }
  );
}
