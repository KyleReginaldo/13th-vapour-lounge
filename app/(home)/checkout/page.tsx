"use client";

import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "@/components/checkout/PaymentMethodSelector";
import {
  ShippingAddressForm,
  type ShippingAddress,
} from "@/components/checkout/ShippingAddressForm";
import { Button } from "@/components/ui/button";
import type { Database } from "@/database.types";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Cart = Database["public"]["Tables"]["carts"]["Row"] & {
  product: Database["public"]["Tables"]["products"]["Row"] & {
    product_images: Database["public"]["Tables"]["product_images"]["Row"][];
  };
  variant?: Database["public"]["Tables"]["product_variants"]["Row"] | null;
};

const CHECKOUT_STEPS = [
  { id: 1, name: "Shipping", description: "Address" },
  { id: 2, name: "Payment", description: "Method" },
  { id: 3, name: "Review", description: "Order" },
];

const TAX_RATE = 0.12; // 12% VAT
const FREE_SHIPPING_THRESHOLD = 1000; // Free shipping over ₱1000
const SHIPPING_COST = 100; // ₱100 flat rate

export default function CheckoutPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cart Data
  const [cartItems, setCartItems] = useState<Cart[]>([]);

  // Shipping
  const [savedAddresses, setSavedAddresses] = useState<ShippingAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<
    ShippingAddress | undefined
  >();

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<
    PaymentMethod | undefined
  >();

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price || item.product.base_price;
    return sum + price * item.quantity;
  }, 0);

  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax + shippingCost;

  // Load cart items and saved addresses
  useEffect(() => {
    async function loadCheckoutData() {
      const supabase = createClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in?redirect=/checkout");
        return;
      }

      // Load cart items
      const { data: cart } = await supabase
        .from("carts")
        .select(
          `
          *,
          product:products (
            *,
            product_images (*)
          ),
          variant:product_variants (*)
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cart && cart.length > 0) {
        setCartItems(cart as Cart[]);
      } else {
        // No items in cart, redirect to cart
        router.push("/cart");
        return;
      }

      // Load saved addresses
      const { data: addresses } = await supabase
        .from("customer_addresses")
        .select("*")
        .eq("customer_id", user.id)
        .order("is_default", { ascending: false });

      if (addresses) {
        setSavedAddresses(addresses as ShippingAddress[]);
        // Auto-select default address
        const defaultAddress = addresses.find((addr) => addr.is_default);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress as ShippingAddress);
        }
      }

      setIsLoading(false);
    }

    loadCheckoutData();
  }, [router]);

  // Handle address selection
  const handleAddressSelect = (address: ShippingAddress) => {
    setSelectedAddress(address);
  };

  // Handle new address creation
  const handleAddressCreate = async (address: Omit<ShippingAddress, "id">) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("customer_addresses")
      .insert({
        customer_id: user.id,
        ...address,
      })
      .select()
      .single();

    if (data && !error) {
      const newAddress = data as ShippingAddress;
      setSavedAddresses([...savedAddresses, newAddress]);
      setSelectedAddress(newAddress);
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  // Navigate between steps
  const canProceedToNextStep = () => {
    if (currentStep === 1) return !!selectedAddress;
    if (currentStep === 2) return !!paymentMethod;
    return false;
  };

  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!selectedAddress || !paymentMethod) return;

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in?redirect=/checkout");
        return;
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          status: "pending",
          payment_status:
            paymentMethod === "cash_on_delivery" ? "unpaid" : "pending",
          payment_method: paymentMethod,
          subtotal,
          tax,
          shipping_cost: shippingCost,
          total,
          shipping_full_name: selectedAddress.full_name,
          shipping_phone: selectedAddress.phone,
          shipping_address_line1: selectedAddress.address_line1,
          shipping_address_line2: selectedAddress.address_line2,
          shipping_city: selectedAddress.city,
          shipping_postal_code: selectedAddress.postal_code,
          shipping_country: selectedAddress.country,
          delivery_instructions: selectedAddress.delivery_instructions,
        })
        .select()
        .single();

      if (orderError || !order) {
        console.error("Order creation failed:", orderError);
        alert("Failed to create order. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product.name,
        variant_attributes: item.variant?.attributes,
        sku: item.variant?.sku || item.product.sku,
        quantity: item.quantity,
        unit_price: item.variant?.price || item.product.base_price,
        subtotal:
          (item.variant?.price || item.product.base_price) * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items creation failed:", itemsError);
        // Continue anyway, order was created
      }

      // Clear cart
      await supabase.from("carts").delete().eq("user_id", user.id);

      // Redirect to confirmation
      router.push(`/checkout/confirmation?order=${order.order_number}`);
    } catch (error) {
      console.error("Checkout error:", error);
      alert("An error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return null; // Will redirect
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/cart")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cart
        </Button>
        <h1 className="text-3xl font-bold">Checkout</h1>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <CheckoutStepper steps={CHECKOUT_STEPS} currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border bg-card p-6">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div>
                <h2 className="mb-6 text-xl font-semibold">Shipping Address</h2>
                <ShippingAddressForm
                  savedAddresses={savedAddresses}
                  onAddressSelect={handleAddressSelect}
                  onAddressCreate={handleAddressCreate}
                  selectedAddressId={selectedAddress?.id}
                />
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div>
                <h2 className="mb-6 text-xl font-semibold">Payment Method</h2>
                <PaymentMethodSelector
                  selectedMethod={paymentMethod}
                  onMethodSelect={handlePaymentMethodSelect}
                />
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Review Your Order</h2>

                {/* Shipping Address Review */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Shipping Address</h3>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setCurrentStep(1)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="rounded-md border bg-muted/50 p-4 text-sm">
                    <p className="font-medium">{selectedAddress?.full_name}</p>
                    <p className="text-muted-foreground">
                      {selectedAddress?.phone}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedAddress?.address_line1}
                      {selectedAddress?.address_line2 &&
                        `, ${selectedAddress.address_line2}`}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedAddress?.city}, {selectedAddress?.state_province}{" "}
                      {selectedAddress?.postal_code}
                    </p>
                  </div>
                </div>

                {/* Payment Method Review */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium">Payment Method</h3>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setCurrentStep(2)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="rounded-md border bg-muted/50 p-4 text-sm">
                    <p className="font-medium capitalize">
                      {paymentMethod?.replace(/_/g, " ")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex gap-4">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  className="ml-auto"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="ml-auto"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <OrderSummary
              items={cartItems}
              subtotal={subtotal}
              tax={tax}
              shippingCost={shippingCost}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
