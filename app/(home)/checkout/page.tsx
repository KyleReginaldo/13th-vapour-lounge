"use client";

import { getProductPrices } from "@/app/actions/cart";
import { uploadPaymentProof } from "@/app/actions/images";
import { notifyAdminAndActiveStaff } from "@/app/actions/notifications";
import { getPublicShippingSettings } from "@/app/actions/settings";
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
import { adminNewOrderTemplate } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    phone: string;
  }>({ fullName: "", phone: "" });

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<
    PaymentMethod | undefined
  >();
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");

  // Shipping settings
  const [shippingFee, setShippingFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  // Price mismatch warning
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price || item.product.base_price;
    return sum + price * item.quantity;
  }, 0);

  const shippingCost =
    freeShippingThreshold > 0 && subtotal >= freeShippingThreshold
      ? 0
      : shippingFee;
  const tax = 0;
  const total = subtotal + shippingCost;

  // Load shipping settings
  useEffect(() => {
    async function loadShippingSettings() {
      const result = await getPublicShippingSettings();
      if (result?.success && result.data) {
        setShippingFee(result.data.shipping_fee ?? 0);
        setFreeShippingThreshold(result.data.free_shipping_threshold ?? 0);
      }
    }
    loadShippingSettings();
  }, []);

  // Load cart items, saved addresses
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

      // Load user profile for auto-fill
      const { data: profile } = await supabase
        .from("users")
        .select("first_name, last_name, middle_name, contact_number")
        .eq("id", user.id)
        .single();

      if (profile) {
        const fullName = [
          profile.first_name,
          profile.middle_name,
          profile.last_name,
        ]
          .filter(Boolean)
          .join(" ");
        setUserProfile({
          fullName,
          phone: profile.contact_number ?? "",
        });
      }

      setIsLoading(false);
    }

    loadCheckoutData();
  }, [router]);

  // Realtime: re-sync cart whenever quantities change
  useEffect(() => {
    const supabase = createClient();
    let userId: string | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      userId = user.id;

      const channel = supabase
        .channel("checkout-cart-sync")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "carts",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            // Re-fetch fresh cart data
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
              router.push("/cart");
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    });
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

  // Handle address deletion
  const handleAddressDelete = async (addressId: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId);

    if (!error) {
      const updated = savedAddresses.filter((a) => a.id !== addressId);
      setSavedAddresses(updated);
      // If the deleted address was selected, auto-select the first remaining one
      if (selectedAddress?.id === addressId) {
        setSelectedAddress(updated[0]);
      }
    }
  };

  // Handle payment method selection
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    // Reset payment proof data when method changes
    if (method === "cash_on_delivery") {
      setPaymentProofFile(null);
      setPaymentReferenceNumber("");
    }
  };

  // Handle payment proof data changes
  const handlePaymentDataChange = (data: {
    file: File | null;
    referenceNumber: string;
  }) => {
    setPaymentProofFile(data.file);
    setPaymentReferenceNumber(data.referenceNumber);
  };

  // Navigate between steps
  const canProceedToNextStep = () => {
    if (currentStep === 1) return !!selectedAddress;
    if (currentStep === 2) {
      if (!paymentMethod) return false;
      // For GCash, require payment proof
      if (paymentMethod === "gcash") {
        return (
          paymentProofFile !== null && paymentReferenceNumber.trim().length > 0
        );
      }
      return true;
    }
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

    // Validate GCash payment proof
    if (
      paymentMethod === "gcash" &&
      (!paymentProofFile || !paymentReferenceNumber)
    ) {
      toast.error(
        "Please upload your GCash payment receipt and reference number"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check for price changes before submitting
      const priceResult = await getProductPrices(
        cartItems.map((item) => ({
          productId: item.product_id,
          variantId: item.variant_id ?? undefined,
        }))
      );

      if (priceResult?.success && priceResult.data) {
        const prices = priceResult.data as {
          productId: string;
          variantId: string | null;
          currentPrice: number | null;
        }[];

        const changed: string[] = [];
        for (const item of cartItems) {
          const displayedPrice = item.variant?.price || item.product.base_price;
          const match = prices.find(
            (p) =>
              p.productId === item.product_id &&
              (p.variantId ?? null) === (item.variant_id ?? null)
          );
          if (
            match &&
            match.currentPrice !== null &&
            match.currentPrice !== displayedPrice
          ) {
            changed.push(item.product.name);
          }
        }

        if (changed.length > 0) {
          setPriceWarning(
            `Prices have changed for: ${changed.join(", ")}. Please review your updated order totals.`
          );

          // Re-fetch cart to get updated prices
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: freshCart } = await supabase
              .from("carts")
              .select(
                `*, product:products (*, product_images (*)), variant:product_variants (*)`
              )
              .eq("user_id", user.id)
              .order("created_at", { ascending: false });
            if (freshCart && freshCart.length > 0) {
              setCartItems(freshCart as Cart[]);
            }
          }

          setIsSubmitting(false);
          return;
        }
      }

      // Clear any previous warning
      setPriceWarning(null);

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
        toast.error("Failed to create order. Please try again.");
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

      // Upload payment proof if GCash
      if (paymentMethod === "gcash" && paymentProofFile) {
        const uploadResult = await uploadPaymentProof(
          order.id,
          paymentProofFile,
          paymentReferenceNumber
        );

        if (!uploadResult.success) {
          console.error("Payment proof upload failed:", uploadResult.error);
          toast.error(
            "Order created but payment proof upload failed. Please upload it from your order details."
          );
        }
      }

      // Clear cart
      await supabase.from("carts").delete().eq("user_id", user.id);

      // Notify admin + active staff
      await notifyAdminAndActiveStaff({
        title: `New Order ${order.order_number}`,
        message: `A new order of ₱${total.toFixed(2)} (${cartItems.length} item${
          cartItems.length !== 1 ? "s" : ""
        }) has been placed.`,
        type: "new_order",
        link: `/admin/orders?order=${order.order_number}`,
        emailSettingKey: "email_order_notifications",
        emailSubject: `New Order ${order.order_number} — ₱${total.toFixed(2)}`,
        emailHtml: adminNewOrderTemplate({
          orderNumber: order.order_number,
          customerName: user.email ?? "Customer",
          total,
          itemCount: cartItems.length,
          orderUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/orders?order=${order.order_number}`,
        }),
      });

      // Redirect to confirmation
      router.push(`/checkout/confirmation?order=${order.order_number}`);
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("An error occurred. Please try again.");
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
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/cart")}
            className="mb-4 -ml-2 hover:bg-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Checkout
          </h1>
        </div>

        {/* Price Warning Banner */}
        {priceWarning && (
          <div className="mb-6 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Prices Updated
              </p>
              <p className="text-sm text-amber-700 mt-0.5">{priceWarning}</p>
            </div>
            <button
              onClick={() => setPriceWarning(null)}
              className="ml-auto text-amber-600 hover:text-amber-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stepper */}
        <div className="mb-8 bg-white rounded-xl shadow-sm border p-6">
          <CheckoutStepper steps={CHECKOUT_STEPS} currentStep={currentStep} />
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 1 && (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b bg-blue-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Shipping Address
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Where should we deliver your order?
                  </p>
                </div>
                <div className="p-6">
                  <ShippingAddressForm
                    savedAddresses={savedAddresses}
                    onAddressSelect={handleAddressSelect}
                    onAddressCreate={handleAddressCreate}
                    onAddressDelete={handleAddressDelete}
                    selectedAddressId={selectedAddress?.id}
                    defaultFullName={userProfile.fullName}
                    defaultPhone={userProfile.phone}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {currentStep === 2 && (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b bg-green-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Payment Method
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Choose how you'd like to pay
                  </p>
                </div>
                <div className="p-6">
                  <PaymentMethodSelector
                    selectedMethod={paymentMethod}
                    onMethodSelect={handlePaymentMethodSelect}
                    onPaymentDataChange={handlePaymentDataChange}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review Order */}
            {currentStep === 3 && (
              <div className="bg-white rounded-xl shadow-sm border">
                <div className="px-6 py-4 border-b bg-purple-50/50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Review Your Order
                  </h2>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Confirm your details before placing order
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Shipping Address Review */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Shipping Address
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(1)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-gray-50 p-4 space-y-1">
                      <p className="font-medium text-gray-900">
                        {selectedAddress?.full_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedAddress?.phone}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedAddress?.address_line1}
                        {selectedAddress?.address_line2 &&
                          `, ${selectedAddress.address_line2}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedAddress?.city},{" "}
                        {selectedAddress?.state_province}{" "}
                        {selectedAddress?.postal_code}
                      </p>
                    </div>
                  </div>

                  {/* Payment Method Review */}
                  <div>
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">
                        Payment Method
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep(2)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8"
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="rounded-lg border bg-gray-50 p-4">
                      <p className="font-medium text-gray-900 capitalize">
                        {paymentMethod?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center gap-3">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  disabled={isSubmitting}
                  size="lg"
                  className="px-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep()}
                  size="lg"
                  className="ml-auto bg-blue-600 hover:bg-blue-700 px-8"
                >
                  Continue
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  size="lg"
                  className="ml-auto bg-green-600 hover:bg-green-700 px-8"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Place Order
                      <svg
                        className="ml-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
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
    </div>
  );
}
