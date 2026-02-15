# Payment Verification & Receipt Matching System

## Research Overview

Innovative payment verification system where customers upload transaction screenshots, admin extracts reference numbers, and in-store verification prevents fraud.

---

## 1. System Requirements

### Problem Statement

In markets where direct online payment integration is difficult, customers often:

1. Pay via bank transfer/e-wallet
2. Take screenshot of confirmation
3. Upload screenshot as "proof"
4. Could potentially reuse same screenshot multiple times

### Solution

Two-step verification:

1. **Online**: Customer uploads screenshot → Admin extracts ref# + amount
2. **In-store**: Customer shows physical receipt → Staff scans/matches → System verifies

---

## 2. Payment Verification Flow

### 2.1 Customer Upload Flow

```
[Customer places order]
      ↓
[Selects "Upload Payment"]
      ↓
[Uploads screenshot]
      ↓
[System stores image]
      ↓
[Order status: "Payment Pending"]
      ↓
[Admin notification]
      ↓
[Admin extracts ref# + amount]
      ↓
[Saves to database]
      ↓
[Order status: "Payment Uploaded"]
      ↓
[Customer arrives in store]
      ↓
[Staff scans receipt QR/manual entry]
      ↓
[System matches ref#]
      ↓
[If match + not claimed: "Verified"]
      ↓
[If already claimed: "Already Used"]
      ↓
[If no match: "Not Found"]
      ↓
[Order status: "Paid" or "Fraud Detected"]
```

### 2.2 Database Schema

```sql
-- Payment Uploads
CREATE TABLE payment_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  image_url TEXT NOT NULL,
  reference_number TEXT, -- Extracted by admin
  amount DECIMAL(10, 2), -- Extracted by admin
  payment_method TEXT, -- 'gcash', 'paymaya', 'bank_transfer'
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  extracted_at TIMESTAMPTZ, -- When admin processed it
  extracted_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ, -- When verified in-store
  verified_by UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN (
    'pending_extraction',  -- Uploaded, awaiting admin
    'extracted',           -- Admin extracted ref#
    'verified',            -- Matched in-store
    'rejected',            -- Invalid/fraud
    'duplicate'            -- Already used
  )) DEFAULT 'pending_extraction',
  rejection_reason TEXT,
  metadata JSONB, -- Additional OCR data
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment Verification Log
CREATE TABLE payment_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_upload_id UUID REFERENCES payment_uploads(id),
  reference_number TEXT NOT NULL,
  action TEXT NOT NULL, -- 'scan_attempt', 'verified', 'rejected'
  staff_id UUID REFERENCES profiles(id),
  result TEXT, -- 'match', 'duplicate', 'not_found'
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_uploads_reference_number ON payment_uploads(reference_number);
CREATE INDEX idx_payment_uploads_order_id ON payment_uploads(order_id);
CREATE INDEX idx_payment_uploads_status ON payment_uploads(status);
```

---

## 3. Implementation

### 3.1 Customer Upload Payment

```typescript
// app/actions/payments.ts
"use server";

export async function uploadPaymentProof(data: {
  orderId: string;
  file: File;
  paymentMethod: "gcash" | "paymaya" | "bank_transfer";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Verify order belongs to user
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", data.orderId)
    .eq("customer_id", user.id)
    .single();

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.payment_status === "paid") {
    throw new Error("Order already paid");
  }

  // Upload image to Supabase Storage
  const fileName = `${user.id}/${data.orderId}/${Date.now()}-${data.file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("payment-proofs")
    .upload(fileName, data.file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("payment-proofs").getPublicUrl(fileName);

  // Create payment upload record
  const { data: paymentUpload, error: paymentError } = await supabase
    .from("payment_uploads")
    .insert({
      order_id: data.orderId,
      customer_id: user.id,
      image_url: publicUrl,
      payment_method: data.paymentMethod,
      status: "pending_extraction",
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  // Update order status
  await supabase
    .from("orders")
    .update({
      payment_status: "pending",
      payment_method: data.paymentMethod,
    })
    .eq("id", data.orderId);

  // Notify admins
  await notifyAdminsNewPaymentUpload(data.orderId, user.id);

  // Log audit
  await logAudit({
    action: "PAYMENT_PROOF_UPLOADED",
    userId: user.id,
    metadata: {
      orderId: data.orderId,
      paymentUploadId: paymentUpload.id,
    },
  });

  return {
    success: true,
    message: "Payment proof uploaded. Awaiting verification.",
  };
}
```

### 3.2 Admin Extract Reference Number

```typescript
// app/actions/payments.ts
"use server";

export async function extractPaymentDetails(data: {
  paymentUploadId: string;
  referenceNumber: string;
  amount: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "staff") {
    throw new Error("Unauthorized");
  }

  // Check if reference number already exists
  const { data: existing } = await supabase
    .from("payment_uploads")
    .select("*")
    .eq("reference_number", data.referenceNumber)
    .neq("id", data.paymentUploadId) // Exclude current record
    .single();

  if (existing) {
    // Mark as duplicate
    await supabase
      .from("payment_uploads")
      .update({
        status: "duplicate",
        rejection_reason: `Duplicate of payment upload ${existing.id}`,
      })
      .eq("id", data.paymentUploadId);

    throw new Error("This reference number has already been used");
  }

  // Update payment upload
  const { error } = await supabase
    .from("payment_uploads")
    .update({
      reference_number: data.referenceNumber,
      amount: data.amount,
      extracted_at: new Date().toISOString(),
      extracted_by: user!.id,
      status: "extracted",
    })
    .eq("id", data.paymentUploadId);

  if (error) throw error;

  // Verify amount matches order
  const { data: payment } = await supabase
    .from("payment_uploads")
    .select(
      `
      *,
      order:orders(total)
    `
    )
    .eq("id", data.paymentUploadId)
    .single();

  if (payment && Math.abs(payment.order.total - data.amount) > 0.01) {
    // Amount mismatch warning
    await createNotification({
      type: "warning",
      message: `Payment amount (${data.amount}) does not match order total (${payment.order.total})`,
      targetUserId: user!.id,
    });
  }

  // Log audit
  await logAudit({
    action: "PAYMENT_DETAILS_EXTRACTED",
    userId: user!.id,
    metadata: {
      paymentUploadId: data.paymentUploadId,
      referenceNumber: data.referenceNumber,
      amount: data.amount,
    },
  });

  return { success: true };
}
```

### 3.3 Staff Verify Payment In-Store

```typescript
// app/actions/payments.ts
"use server";

export async function verifyPaymentInStore(referenceNumber: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Find payment by reference number
  const { data: payment } = await supabase
    .from("payment_uploads")
    .select(
      `
      *,
      order:orders(*)
    `
    )
    .eq("reference_number", referenceNumber)
    .single();

  // Log scan attempt
  await supabase.from("payment_verification_log").insert({
    payment_upload_id: payment?.id || null,
    reference_number: referenceNumber,
    action: "scan_attempt",
    staff_id: user.id,
    result: payment ? "match" : "not_found",
  });

  if (!payment) {
    return {
      success: false,
      result: "not_found",
      message: "No payment record found with this reference number",
    };
  }

  if (payment.status === "verified") {
    return {
      success: false,
      result: "duplicate",
      message: "This payment has already been verified and claimed",
      verifiedAt: payment.verified_at,
      verifiedBy: payment.verified_by,
    };
  }

  if (payment.status === "rejected") {
    return {
      success: false,
      result: "rejected",
      message: "This payment was rejected",
      reason: payment.rejection_reason,
    };
  }

  if (payment.status !== "extracted") {
    return {
      success: false,
      result: "pending",
      message: "Payment details not yet processed by admin",
    };
  }

  // Mark as verified
  const { error } = await supabase
    .from("payment_uploads")
    .update({
      status: "verified",
      verified_at: new Date().toISOString(),
      verified_by: user.id,
    })
    .eq("id", payment.id);

  if (error) throw error;

  // Update order status to paid
  await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.order_id);

  // Log verification
  await supabase.from("payment_verification_log").insert({
    payment_upload_id: payment.id,
    reference_number: referenceNumber,
    action: "verified",
    staff_id: user.id,
    result: "match",
  });

  // Log audit
  await logAudit({
    action: "PAYMENT_VERIFIED_INSTORE",
    userId: user.id,
    metadata: {
      paymentUploadId: payment.id,
      orderId: payment.order_id,
      referenceNumber,
    },
  });

  // Notify customer
  await sendEmail({
    to: payment.customer_id,
    template: "payment-verified",
    data: {
      orderId: payment.order.order_number,
    },
  });

  return {
    success: true,
    result: "verified",
    message: "Payment verified successfully",
    order: payment.order,
  };
}
```

---

## 4. OCR Integration (Optional Enhancement)

### 4.1 Using Tesseract.js for Auto-Extract

```typescript
// lib/ocr/extractPaymentDetails.ts
import Tesseract from "tesseract.js";

export async function extractPaymentDetailsFromImage(imageUrl: string) {
  const {
    data: { text },
  } = await Tesseract.recognize(imageUrl, "eng");

  // Pattern matching for common e-wallet formats
  const patterns = {
    gcash: {
      referenceNumber: /Reference No[.:]?\s*(\d{10,16})/i,
      amount: /Amount[:]?\s*PHP?\s*([\d,]+\.?\d{0,2})/i,
    },
    paymaya: {
      referenceNumber: /Transaction ID[:]?\s*(\w{10,20})/i,
      amount: /Total[:]?\s*₱\s*([\d,]+\.?\d{0,2})/i,
    },
  };

  const extracted = {
    referenceNumber: null as string | null,
    amount: null as number | null,
    rawText: text,
  };

  // Try GCash patterns
  let match = text.match(patterns.gcash.referenceNumber);
  if (match) {
    extracted.referenceNumber = match[1];
  }

  match = text.match(patterns.gcash.amount);
  if (match) {
    extracted.amount = parseFloat(match[1].replace(/,/g, ""));
  }

  // Try PayMaya patterns if not found
  if (!extracted.referenceNumber) {
    match = text.match(patterns.paymaya.referenceNumber);
    if (match) {
      extracted.referenceNumber = match[1];
    }
  }

  if (!extracted.amount) {
    match = text.match(patterns.paymaya.amount);
    if (match) {
      extracted.amount = parseFloat(match[1].replace(/,/g, ""));
    }
  }

  return extracted;
}

// Usage in admin panel
export async function autoExtractPaymentDetails(paymentUploadId: string) {
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payment_uploads")
    .select("image_url")
    .eq("id", paymentUploadId)
    .single();

  if (!payment) throw new Error("Payment not found");

  const extracted = await extractPaymentDetailsFromImage(payment.image_url);

  // Save extracted data to metadata
  await supabase
    .from("payment_uploads")
    .update({
      metadata: {
        ocr_extracted: extracted,
        extracted_at: new Date().toISOString(),
      },
    })
    .eq("id", paymentUploadId);

  return extracted;
}
```

---

## 5. Admin UI for Payment Verification

### 5.1 Payment Verification Dashboard

```tsx
// app/admin/payment-verification/page.tsx
"use client";

import { useState } from "react";
import Image from "next/image";

interface PaymentUpload {
  id: string;
  order_id: string;
  customer_name: string;
  order_total: number;
  image_url: string;
  payment_method: string;
  status: string;
  uploaded_at: string;
  reference_number?: string;
  amount?: number;
}

export default function PaymentVerificationPage() {
  const [payments, setPayments] = useState<PaymentUpload[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentUpload | null>(
    null
  );
  const [refNumber, setRefNumber] = useState("");
  const [amount, setAmount] = useState("");

  const handleExtract = async () => {
    if (!selectedPayment) return;

    await extractPaymentDetails({
      paymentUploadId: selectedPayment.id,
      referenceNumber: refNumber,
      amount: parseFloat(amount),
    });

    // Refresh list
    fetchPayments();
    setSelectedPayment(null);
    setRefNumber("");
    setAmount("");
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Pending List */}
      <div>
        <h2 className="text-xl font-bold mb-4">Pending Verification</h2>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              onClick={() => setSelectedPayment(payment)}
              className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">{payment.customer_name}</div>
                  <div className="text-sm text-gray-500">
                    Order #{payment.order_id.slice(0, 8)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {payment.payment_method.toUpperCase()}
                  </div>
                </div>
                <div className="text-lg font-bold">
                  ₱{payment.order_total.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                {new Date(payment.uploaded_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Panel */}
      <div>
        {selectedPayment ? (
          <div className="border rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Extract Payment Details</h3>

            {/* Show uploaded image */}
            <div className="mb-4">
              <Image
                src={selectedPayment.image_url}
                alt="Payment proof"
                width={400}
                height={600}
                className="border rounded"
              />
            </div>

            {/* Auto-extract button (if OCR enabled) */}
            <button
              onClick={async () => {
                const extracted = await autoExtractPaymentDetails(
                  selectedPayment.id
                );
                setRefNumber(extracted.referenceNumber || "");
                setAmount(extracted.amount?.toString() || "");
              }}
              className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🤖 Auto-Extract (OCR)
            </button>

            {/* Manual input */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="123456789012"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="0.00"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Order total: ₱{selectedPayment.order_total.toFixed(2)}
                  {parseFloat(amount) !== selectedPayment.order_total && (
                    <span className="text-red-500 ml-2">
                      ⚠️ Amount mismatch!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExtract}
                  disabled={!refNumber || !amount}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300"
                >
                  ✓ Confirm & Save
                </button>
                <button
                  onClick={() => {
                    setSelectedPayment(null);
                    setRefNumber("");
                    setAmount("");
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-6 text-center text-gray-400">
            Select a payment to verify
          </div>
        )}
      </div>
    </div>
  );
}
```

### 5.2 Staff Verification UI (POS)

```tsx
// components/pos/PaymentVerificationModal.tsx
"use client";

import { useState } from "react";

export function PaymentVerificationModal({ onClose }: { onClose: () => void }) {
  const [refNumber, setRefNumber] = useState("");
  const [result, setResult] = useState<any>(null);

  const handleVerify = async () => {
    const verification = await verifyPaymentInStore(refNumber);
    setResult(verification);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Verify Payment</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Reference Number
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              className="w-full px-3 py-2 border rounded text-lg"
              placeholder="Scan or type reference number"
              autoFocus
            />
            <div className="text-sm text-gray-500 mt-1">
              Scan customer's receipt QR code or type manually
            </div>
          </div>

          {result && (
            <div
              className={`p-4 rounded ${
                result.success
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <div className="font-semibold mb-2">
                {result.result === "verified" && "✓ Payment Verified"}
                {result.result === "not_found" && "✗ Not Found"}
                {result.result === "duplicate" && "⚠️ Already Claimed"}
                {result.result === "rejected" && "✗ Rejected"}
              </div>
              <div className="text-sm">{result.message}</div>
              {result.order && (
                <div className="mt-3 pt-3 border-t">
                  <div>Order #{result.order.order_number}</div>
                  <div>Total: ₱{result.order.total}</div>
                  <div>Customer: {result.order.customer_name}</div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              disabled={!refNumber}
              className="flex-1 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark disabled:bg-gray-300"
            >
              Verify
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Security Considerations

### Prevent Fraud

✓ Log all verification attempts (even failed ones)
✓ Flag suspicious patterns (same ref# scanned multiple times)
✓ Require both admin extraction AND in-store verification
✓ Store original image (tamper evidence)
✓ Timestamp all actions
✓ Audit trail

### Best Practices

✓ Limit upload file size (max 5MB)
✓ Accept only image formats (jpg, png, pdf)
✓ Sanitize filenames
✓ Rate limit API endpoints
✓ Alert admins of duplicate ref# attempts
✓ Periodic review of "rejected" payments

---

## 7. Alternative: QR Code on Customer Receipt

### Enhanced Flow

1. Customer pays via e-wallet
2. Takes screenshot
3. Uploads to site
4. **System generates QR code** with encrypted ref# + order ID
5. Customer shows QR in store
6. Staff scans QR (instant verification)

```typescript
// Generate QR for verified payment
import QRCode from "qrcode";

export async function generatePaymentQR(paymentUploadId: string) {
  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payment_uploads")
    .select("reference_number, order_id, amount")
    .eq("id", paymentUploadId)
    .single();

  // Create verifiable payload
  const payload = {
    ref: payment.reference_number,
    order: payment.order_id,
    amount: payment.amount,
    ts: Date.now(),
  };

  // Encrypt or sign payload
  const token = encryptPayload(payload);

  // Generate QR
  const qrDataUrl = await QRCode.toDataURL(token);

  return qrDataUrl;
}
```

---

## Next Steps

1. Implement file upload UI
2. Create admin verification dashboard
3. Build in-store verification flow
4. Add OCR auto-extraction (optional)
5. Test fraud scenarios
6. Train staff on verification process
7. Monitor for abuse patterns

---

## Resources

- Tesseract.js (OCR): https://tesseract.projectnaptha.com/
- QR Code Generator: https://www.npmjs.com/package/qrcode
- Image Processing: https://www.npmjs.com/package/sharp
