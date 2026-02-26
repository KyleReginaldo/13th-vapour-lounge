"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Loader2, MapPin, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

export interface ShippingAddress {
  id?: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  delivery_instructions?: string;
  is_default?: boolean;
  label?: string;
}

interface ShippingAddressFormProps {
  savedAddresses?: ShippingAddress[];
  onAddressSelect: (address: ShippingAddress) => void;
  onAddressCreate: (address: Omit<ShippingAddress, "id">) => void;
  onAddressDelete?: (addressId: string) => Promise<void>;
  selectedAddressId?: string;
  defaultFullName?: string;
  defaultPhone?: string;
}

export function ShippingAddressForm({
  savedAddresses = [],
  onAddressSelect,
  onAddressCreate,
  onAddressDelete,
  selectedAddressId,
  defaultFullName = "",
  defaultPhone = "",
}: ShippingAddressFormProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(
    savedAddresses.length === 0
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Auto-show the form when the address list becomes empty (e.g. after deletion)
  useEffect(() => {
    if (savedAddresses.length === 0) {
      setShowNewAddressForm(true);
    }
  }, [savedAddresses.length]);

  async function handleDelete(addressId: string) {
    if (!onAddressDelete) return;
    setDeletingId(addressId);
    await onAddressDelete(addressId);
    setDeletingId(null);
    setConfirmDeleteId(null);
  }
  const [formData, setFormData] = useState<Omit<ShippingAddress, "id">>({
    full_name: defaultFullName,
    phone: defaultPhone,
    address_line1: "",
    address_line2: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "Philippines",
    delivery_instructions: "",
    label: "Home",
  });

  // Sync pre-fill values once user profile loads (async)
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      full_name: prev.full_name || defaultFullName,
      phone: prev.phone || defaultPhone,
    }));
  }, [defaultFullName, defaultPhone]);

  const [isDetecting, setIsDetecting] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};

          // Map Nominatim fields to PH address structure
          const city =
            addr.city ||
            addr.town ||
            addr.municipality ||
            addr.village ||
            addr.suburb ||
            "";
          const province = addr.state || addr.province || addr.region || "";
          const postalCode = addr.postcode || "";

          setFormData((prev) => ({
            ...prev,
            city: city || prev.city,
            state_province: province || prev.state_province,
            postal_code: postalCode || prev.postal_code,
          }));
        } catch {
          // silently fail — user can fill manually
        } finally {
          setIsDetecting(false);
        }
      },
      () => setIsDetecting(false),
      { timeout: 8000 }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddressCreate(formData);
    setShowNewAddressForm(false);
    // Reset form
    setFormData({
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state_province: "",
      postal_code: "",
      country: "Philippines",
      delivery_instructions: "",
      label: "Home",
    });
  };

  return (
    <div className="space-y-6">
      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !showNewAddressForm && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Select Shipping Address</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {savedAddresses.map((address) => (
              <div key={address.id} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDeleteId(null);
                    onAddressSelect(address);
                  }}
                  className={cn(
                    "relative w-full rounded-lg border p-4 text-left transition-colors hover:border-primary pr-10",
                    selectedAddressId === address.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  )}
                >
                  {/* Selected Indicator */}
                  {selectedAddressId === address.id && (
                    <div className="absolute right-8 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}

                  {/* Address Label */}
                  {address.label && (
                    <div className="mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {address.label}
                      </span>
                      {address.is_default && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                          Default
                        </span>
                      )}
                    </div>
                  )}

                  {/* Address Details */}
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{address.full_name}</p>
                    <p className="text-muted-foreground">{address.phone}</p>
                    <p className="text-muted-foreground">
                      {address.address_line1}
                      {address.address_line2 && `, ${address.address_line2}`}
                    </p>
                    <p className="text-muted-foreground">
                      {address.city}, {address.state_province}{" "}
                      {address.postal_code}
                    </p>
                  </div>
                </button>

                {/* Delete Button */}
                {onAddressDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(
                        confirmDeleteId === address.id
                          ? null
                          : (address.id ?? null)
                      );
                    }}
                    className="absolute right-2 top-2 p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Delete address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Confirm Delete Popover */}
                {confirmDeleteId === address.id && (
                  <div className="absolute bottom-full left-0 right-0 mb-1 z-10 rounded-lg border bg-white shadow-lg p-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-600">
                      Delete this address?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs px-2 py-1 rounded border text-gray-500 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === address.id}
                        onClick={() => handleDelete(address.id!)}
                        className="text-xs px-2 py-1 rounded bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50 flex items-center gap-1"
                      >
                        {deletingId === address.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : null}
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Address Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowNewAddressForm(true)}
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Address
          </Button>
        </div>
      )}

      {/* New Address Form */}
      {showNewAddressForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {savedAddresses.length > 0
                ? "Add New Address"
                : "Shipping Address"}
            </h3>
            {savedAddresses.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowNewAddressForm(false)}
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Address Label */}
          <div className="space-y-2">
            <Label htmlFor="label">Address Label (Optional)</Label>
            <Input
              id="label"
              value={formData.label}
              onChange={(e) =>
                setFormData({ ...formData, label: e.target.value })
              }
              placeholder="e.g., Home, Office"
            />
          </div>

          {/* Full Name & Phone */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Juan Dela Cruz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div className="space-y-2">
            <Label htmlFor="address_line1">
              Street Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address_line1"
              required
              value={formData.address_line1}
              onChange={(e) =>
                setFormData({ ...formData, address_line1: e.target.value })
              }
              placeholder="House No., Street Name"
            />
          </div>

          {/* Address Line 2 */}
          <div className="space-y-2">
            <Label htmlFor="address_line2">
              Apartment, Suite, etc. (Optional)
            </Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) =>
                setFormData({ ...formData, address_line2: e.target.value })
              }
              placeholder="Unit, Building, Floor"
            />
          </div>

          {/* City, State, Postal Code */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Location</Label>
              <button
                type="button"
                onClick={detectLocation}
                disabled={isDetecting}
                className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-50"
              >
                {isDetecting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                {isDetecting ? "Detecting..." : "Auto-detect my location"}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">
                  City <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="Manila"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_province">
                  Province <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="state_province"
                  required
                  value={formData.state_province}
                  onChange={(e) =>
                    setFormData({ ...formData, state_province: e.target.value })
                  }
                  placeholder="Metro Manila"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postal_code">
                  Postal Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="postal_code"
                  required
                  value={formData.postal_code}
                  onChange={(e) =>
                    setFormData({ ...formData, postal_code: e.target.value })
                  }
                  placeholder="1000"
                />
              </div>
            </div>
          </div>

          {/* Delivery Instructions */}
          <div className="space-y-2">
            <Label htmlFor="delivery_instructions">
              Delivery Instructions (Optional)
            </Label>
            <Input
              id="delivery_instructions"
              value={formData.delivery_instructions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  delivery_instructions: e.target.value,
                })
              }
              placeholder="e.g., Ring doorbell twice"
            />
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            {savedAddresses.length > 0
              ? "Save and Use This Address"
              : "Continue to Payment"}
          </Button>
        </form>
      )}
    </div>
  );
}
