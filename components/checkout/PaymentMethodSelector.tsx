"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Banknote,
  CheckCircle2,
  Loader2,
  Smartphone,
  Upload,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { createWorker } from "tesseract.js";

type ScanState = "idle" | "scanning" | "done" | "error";

function parseGCashReceipt(text: string): {
  referenceNumber: string;
  amount: string;
} {
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, " ").toUpperCase();

  // Reference number: 13-digit number common in GCash receipts,
  // or explicitly labeled "REF" / "REFERENCE" / "REF. NO."
  let referenceNumber = "";
  const refPatterns = [
    /REF(?:ERENCE)?(?:\.?\s*NO\.?)?\s*[:\-]?\s*(\d{10,15})/i,
    /TRANSACTION\s*(?:ID|NO\.?)?\s*[:\-]?\s*(\d{10,15})/i,
    /(?<!\d)(\d{13})(?!\d)/,
  ];
  for (const pattern of refPatterns) {
    const match = text.match(pattern);
    if (match) {
      referenceNumber = match[1].trim();
      break;
    }
  }

  // Amount: PHP or ₱ followed by number, or just a number with .00
  let amount = "";
  const amountPatterns = [
    /(?:PHP|₱|P)\s*([\d,]+\.?\d{0,2})/i,
    /AMOUNT\s*[:\-]?\s*(?:PHP|₱|P)?\s*([\d,]+\.?\d{0,2})/i,
    /TOTAL\s*[:\-]?\s*(?:PHP|₱|P)?\s*([\d,]+\.?\d{0,2})/i,
  ];
  for (const pattern of amountPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      amount = match[1].replace(/,/g, "").trim();
      break;
    }
  }

  return { referenceNumber, amount };
}

export type PaymentMethod = "cash_on_delivery" | "gcash";

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
    id: "gcash",
    name: "GCash",
    description: "Pay via GCash and upload receipt",
    icon: Smartphone,
    requiresProof: true,
  },
];

interface PaymentMethodSelectorProps {
  selectedMethod?: PaymentMethod;
  onMethodSelect: (method: PaymentMethod) => void;
  onPaymentProofUpload?: (file: File, referenceNumber: string) => void;
  onPaymentDataChange?: (data: {
    file: File | null;
    referenceNumber: string;
    scannedAmount?: string;
  }) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onMethodSelect,
  onPaymentProofUpload,
  onPaymentDataChange,
}: PaymentMethodSelectorProps) {
  const [referenceNumber, setReferenceNumber] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scannedAmount, setScannedAmount] = useState<string>("");

  const selectedOption = PAYMENT_OPTIONS.find(
    (opt) => opt.id === selectedMethod
  );
  const requiresProof = selectedOption?.requiresProof || false;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanState("idle");
      setScanError(null);
      setScannedAmount("");
      if (onPaymentDataChange) {
        onPaymentDataChange({ file, referenceNumber, scannedAmount: "" });
      }
      // Auto-scan immediately after picking
      scanFile(file);
    }
  };

  const handleReferenceChange = (value: string) => {
    setReferenceNumber(value);
    if (onPaymentDataChange) {
      onPaymentDataChange({
        file: uploadedFile,
        referenceNumber: value,
        scannedAmount,
      });
    }
  };

  const scanFile = async (file: File) => {
    setScanState("scanning");
    setScanError(null);

    try {
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(file);
      await worker.terminate();

      const { referenceNumber: ref, amount } = parseGCashReceipt(data.text);

      if (ref) {
        setReferenceNumber(ref);
        if (onPaymentDataChange) {
          onPaymentDataChange({
            file,
            referenceNumber: ref,
            scannedAmount: amount,
          });
        }
      }
      if (amount) setScannedAmount(amount);

      if (!ref && !amount) {
        setScanError(
          "Could not detect reference number or amount. Please enter manually."
        );
        setScanState("error");
      } else {
        setScanState("done");
      }
    } catch {
      setScanError("Scan failed. Please enter the details manually.");
      setScanState("error");
    }
  };

  const handleRescan = () => {
    if (uploadedFile) scanFile(uploadedFile);
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
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
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

          {/* GCash Details */}
          {selectedMethod === "gcash" && (
            <div className="space-y-2 rounded-md border bg-background p-3 text-sm">
              <p className="font-medium">GCash Payment Details:</p>
              <div className="space-y-1 text-muted-foreground">
                <p>
                  GCash Number:{" "}
                  <span className="font-medium text-foreground">
                    +63 912 345 6789
                  </span>
                </p>
                <p>
                  Account Name:{" "}
                  <span className="font-medium text-foreground">
                    13th Vapour Lounge
                  </span>
                </p>
              </div>
              <p className="mt-2 text-xs text-orange-600 font-medium">
                Please send the exact total amount and upload your payment
                receipt below.
              </p>
            </div>
          )}

          {/* File Upload — first, triggers auto-scan */}
          <div className="space-y-2">
            <Label htmlFor="payment_proof">
              Upload Payment Receipt <span className="text-destructive">*</span>
            </Label>

            {/* Upload row */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document.getElementById("payment_proof")?.click()
                }
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploadedFile ? uploadedFile.name : "Choose File"}
              </Button>

              {/* Retry button — only shown after a failed scan */}
              {uploadedFile && scanState === "error" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRescan}
                  className="shrink-0 gap-1.5 border-red-400 text-red-500 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" /> Retry
                </Button>
              )}

              <input
                id="payment_proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Receipt thumbnail */}
            {previewUrl && (
              <div className="mt-2 overflow-hidden rounded-md border bg-background">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-h-48 w-full object-contain"
                />
              </div>
            )}

            {/* Scan feedback */}
            {scanState === "scanning" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Reading receipt with OCR, please wait…
              </p>
            )}
            {scanState === "done" && (
              <p className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Fields auto-filled from receipt. Please verify before
                submitting.
              </p>
            )}
            {scanState === "error" && scanError && (
              <p className="flex items-center gap-1.5 text-xs text-red-500">
                <XCircle className="h-3 w-3" />
                {scanError}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Upload a screenshot of your GCash payment receipt — reference
              number and amount will be auto-filled.
            </p>
          </div>

          {/* Reference Number — auto-filled after scan */}
          <div className="space-y-2">
            <Label htmlFor="reference_number">
              Reference Number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="reference_number"
              required
              value={referenceNumber}
              onChange={(e) => handleReferenceChange(e.target.value)}
              placeholder={
                scanState === "scanning"
                  ? "Scanning receipt…"
                  : "Auto-filled after scanning receipt"
              }
              className={
                scanState === "scanning"
                  ? "animate-pulse text-muted-foreground"
                  : ""
              }
            />
            {scanState === "done" && referenceNumber && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" /> Auto-filled from receipt —
                verify before submitting
              </p>
            )}
          </div>

          {/* Scanned amount badge */}
          {scannedAmount && (
            <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              <span className="text-green-700">
                Detected amount:{" "}
                <span className="font-semibold">₱ {scannedAmount}</span> &mdash;
                make sure this matches your order total.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Status Message */}
      {selectedMethod && (
        <div className="text-sm">
          {requiresProof ? (
            <p className="text-muted-foreground">
              After uploading your payment proof, our team will verify the
              payment amount. This may take 1-2 business days. You'll be
              notified once verified.
            </p>
          ) : (
            <p className="text-muted-foreground">
              You will pay with cash when your order is delivered to your
              address.
            </p>
          )}
        </div>
      )}

      {/* Export payment data for parent component */}
      {requiresProof && selectedMethod && (
        <input
          type="hidden"
          data-has-payment-proof={
            uploadedFile !== null && referenceNumber.length > 0
          }
        />
      )}
    </div>
  );
}
