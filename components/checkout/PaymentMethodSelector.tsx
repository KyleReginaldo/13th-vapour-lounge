"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Banknote, Building2, Smartphone, Upload, Wallet } from "lucide-react";
import { useState } from "react";

export type PaymentMethod =
  | "cash_on_delivery"
  | "bank_transfer"
  | "gcash"
  | "maya";

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresProof?: boolean;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "cash_on_delivery",
    name: "Cash on Delivery",
    description: "Pay with cash upon delivery",
    icon: Banknote,
    requiresProof: false,
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    description: "Transfer to our bank account",
    icon: Building2,
    requiresProof: true,
  },
  {
    id: "gcash",
    name: "GCash",
    description: "Pay via GCash",
    icon: Smartphone,
    requiresProof: true,
  },
  {
    id: "maya",
    name: "Maya (PayMaya)",
    description: "Pay via Maya",
    icon: Wallet,
    requiresProof: true,
  },
];

interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
  onPaymentProofUpload?: (file: File, referenceNumber: string) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  onPaymentProofUpload,
}: PaymentMethodSelectorProps) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const selectedOption = PAYMENT_OPTIONS.find(
    (opt) => opt.id === selectedMethod
  );
  const requiresProof = selectedOption?.requiresProof || false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const canProceed = () => {
    if (!selectedMethod) return false;
    if (!requiresProof) return true;
    return uploadedFile && referenceNumber.trim().length > 0;
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium">Select Payment Method</h3>

      {/* Payment Options Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {PAYMENT_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedMethod === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onMethodSelect(option.id)}
              className={cn(
                "relative flex items-start gap-4 rounded-lg border p-4 text-left transition-colors hover:border-primary",
                isSelected ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Details */}
              <div className="flex-1 space-y-1">
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
                {option.requiresProof && (
                  <p className="text-xs text-muted-foreground">
                    Requires payment proof
                  </p>
                )}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>

      {/* Payment Proof Upload Section */}
      {requiresProof && selectedMethod && (
        <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
          <h4 className="text-sm font-medium">Payment Proof Required</h4>

          {/* Bank Details (for Bank Transfer) */}
          {selectedMethod === "bank_transfer" && (
            <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
              <p className="font-medium">Bank Transfer Details:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Bank: BDO Unibank</p>
                <p>Account Name: Vapour Lounge Inc.</p>
                <p>Account Number: 1234-5678-9012</p>
              </div>
            </div>
          )}

          {/* GCash Details */}
          {selectedMethod === "gcash" && (
            <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
              <p className="font-medium">GCash Details:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>GCash Number: +63 912 345 6789</p>
                <p>Account Name: Vapour Lounge</p>
              </div>
            </div>
          )}

          {/* Maya Details */}
          {selectedMethod === "maya" && (
            <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
              <p className="font-medium">Maya Details:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>Maya Number: +63 912 345 6789</p>
                <p>Account Name: Vapour Lounge</p>
              </div>
            </div>
          )}

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="reference_number">
              Reference Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reference_number"
              required
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Enter transaction reference number"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="payment_proof">
              Upload Payment Proof <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("payment_proof")?.click()
                }
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadedFile ? uploadedFile.name : "Choose File"}
              </Button>
              <input
                id="payment_proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload a screenshot or photo of your payment receipt
            </p>
          </div>
        </div>
      )}

      {/* Status Message */}
      {selectedMethod && (
        <div className="text-sm">
          {requiresProof ? (
            <p className="text-muted-foreground">
              After submitting your order, please wait for payment verification.
              This may take 1-2 business days.
            </p>
          ) : (
            <p className="text-muted-foreground">
              You will pay with cash when your order is delivered.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
