"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, MapPin, Plus } from "lucide-react";
import { useState } from "react";

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
  selectedAddressId?: string;
}

export function ShippingAddressForm({
  savedAddresses = [],
  onAddressSelect,
  onAddressCreate,
  selectedAddressId,
}: ShippingAddressFormProps) {
  const [showNewAddressForm, setShowNewAddressForm] = useState(
    savedAddresses.length === 0
  );
  const [formData, setFormData] = useState<Omit<ShippingAddress, "id">>({
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
              <button
                key={address.id}
                type="button"
                onClick={() => onAddressSelect(address)}
                className={cn(
                  "relative rounded-lg border p-4 text-left transition-colors hover:border-primary",
                  selectedAddressId === address.id
                    ? "border-primary bg-primary/5"
                    : "border-border"
                )}
              >
                {/* Selected Indicator */}
                {selectedAddressId === address.id && (
                  <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}

                {/* Address Label */}
                {address.label && (
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{address.label}</span>
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
