# Point of Sale (POS) System Research

## Research Overview

Modern POS system design for vape shop retail operations with cash drawer management, split payments, and order parking.

---

## 1. POS Requirements for 13th Vapour Lounge

### Core Features

- **Quick Product Lookup**: Barcode/QR scanning, search
- **Cart Management**: Add, remove, update quantities
- **Split Payments**: Cash + E-wallet combinations
- **Hold/Park Orders**: Save incomplete transactions
- **Shift Management**: Clock in/out, cash drawer tracking
- **Receipt Generation**: Print/email receipts
- **Stock Updates**: Real-time inventory sync
- **Refunds/Returns**: Process at POS with logging

---

## 2. POS UI/UX Design Patterns

### 2.1 Modern POS Layouts

#### Square POS Inspiration

```
┌──────────────────────┬────────────────────────────┐
│  SEARCH: [______]    │                            │
│  ──────────────────  │    CURRENT SALE            │
│  CATEGORIES:         │                            │
│  [ All  ] Juice      │  1. Strawberry Juice 3mg   │
│  [ Devices ] Coils   │     $29.99 x2    $59.98    │
│  ──────────────────  │  2. Vape Device            │
│  ┌────┬────┬────┐    │     $89.99 x1    $89.99    │
│  │PRD1│PRD2│PRD3│    │  ─────────────────────────│
│  ├────┼────┼────┤    │  Subtotal:       $149.97   │
│  │PRD4│PRD5│PRD6│    │  Tax (12%):       $18.00   │
│  └────┴────┴────┘    │  ─────────────────────────│
│  [More Products...]  │  TOTAL:          $167.97   │
│                       │                            │
│  [📷 Scan Barcode]   │  [Park] [Clear] [Charge]  │
└──────────────────────┴────────────────────────────┘
```

#### Shopify POS Inspiration

```
Left Panel - Products (50%)              Right Panel - Cart (50%)
┌───────────────────────┬───────────────────────────┐
│ 🔍 Search products... │  Cart (3 items)           │
├───────────────────────┼───────────────────────────┤
│ VAPE JUICE ▼          │  ┌──────────────────────┐ │
│ ┌──────┬──────┬──────┐│  │ [img] Strawberry     │ │
│ │ [Img]│ [Img]│ [Img]││  │ 3mg, 60ml            │ │
│ │ $29  │ $34  │ $24  ││  │ $29.99  [-][2][+] 🗑│ │
│ │ Straw│Mango │Mint  ││  ├──────────────────────┤ │
│ ├──────┼──────┼──────┤│  │ [img] Vape Device    │ │
│ │ [Img]│ [Img]│ [Img]││  │ Starter Kit          │ │
│ │ $29  │ $34  │ $24  ││  │ $89.99  [-][1][+] 🗑│ │
│ │ ...  │ ...  │ ...  ││  └──────────────────────┘ │
│ └──────┴──────┴──────┘│                           │
│                        │  Subtotal:      $149.97   │
│ DEVICES ▼             │  Tax:            $18.00   │
│ [Products grid...]     │  ───────────────────────  │
│                        │  TOTAL:         $167.97   │
│                        │                           │
│                        │  Customer: [Select ▼]    │
│                        │  Notes: [_____________]   │
│                        │                           │
│                        │  [🅿️ Park Order]          │
│                        │  [🗑️ Clear Cart]         │
│                        │  [💳 Checkout]           │
└───────────────────────┴───────────────────────────┘
```

### 2.2 Checkout Payment Modal

```
┌──────────────────────────────────────────┐
│  CHECKOUT                           [X]  │
├──────────────────────────────────────────┤
│                                           │
│  Total Amount: $167.97                    │
│                                           │
│  PAYMENT METHOD                           │
│  ┌─────────────────────────────────────┐ │
│  │ ● Cash                              │ │
│  │ ○ E-Wallet (GCash, PayMaya)         │ │
│  │ ○ Upload Payment Screenshot         │ │
│  └─────────────────────────────────────┘ │
│                                           │
│  [Split Payment?]                         │
│                                           │
│  Cash Amount:  [$________]                │
│  E-Wallet:     [$________]                │
│  ──────────────────────────               │
│  Total:        $167.97 ✓                  │
│                                           │
│  Cash Received: [$200.00_]                │
│  Change Due:     $32.03                   │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ [Print Receipt] [Email Receipt]     │ │
│  │ [Complete Sale]                     │ │
│  └─────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

---

## 3. Database Schema for POS

### 3.1 Core POS Tables

```sql
-- POS Shifts (Cash Drawer)
CREATE TABLE pos_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  register_id TEXT NOT NULL, -- In case of multiple registers
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  opening_cash DECIMAL(10, 2) NOT NULL,
  closing_cash DECIMAL(10, 2),
  expected_cash DECIMAL(10, 2),
  cash_difference DECIMAL(10, 2), -- Overage/shortage
  total_sales DECIMAL(10, 2) DEFAULT 0,
  total_refunds DECIMAL(10, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  notes TEXT,
  status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS Transactions (Sales)
CREATE TABLE pos_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES pos_shifts(id),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  customer_id UUID REFERENCES profiles(id), -- Optional (walk-in)
  transaction_number TEXT UNIQUE NOT NULL, -- POS-001, POS-002
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL, -- 'cash', 'e-wallet', 'split'
  payment_details JSONB, -- {cash: 100, gcash: 67.97}
  cash_received DECIMAL(10, 2),
  change_given DECIMAL(10, 2),
  receipt_number TEXT UNIQUE,
  customer_email TEXT, -- For email receipt
  notes TEXT,
  status TEXT CHECK (status IN ('completed', 'refunded', 'parked')) DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- POS Transaction Items
CREATE TABLE pos_transaction_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) NOT NULL,
  variant_id UUID REFERENCES product_variants(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL, -- (unit_price * quantity) - discount
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parked Orders (Hold Orders)
CREATE TABLE parked_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID REFERENCES profiles(id) NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  cart_data JSONB NOT NULL, -- Store entire cart state
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Auto-delete after X hours
);

CREATE INDEX idx_parked_orders_staff_id ON parked_orders(staff_id);
CREATE INDEX idx_parked_orders_created_at ON parked_orders(created_at);
```

### 3.2 Indexes for Performance

```sql
CREATE INDEX idx_pos_shifts_staff_id ON pos_shifts(staff_id);
CREATE INDEX idx_pos_shifts_opened_at ON pos_shifts(opened_at);
CREATE INDEX idx_pos_shifts_status ON pos_shifts(status);

CREATE INDEX idx_pos_transactions_shift_id ON pos_transactions(shift_id);
CREATE INDEX idx_pos_transactions_staff_id ON pos_transactions(staff_id);
CREATE INDEX idx_pos_transactions_created_at ON pos_transactions(created_at);
CREATE INDEX idx_pos_transactions_status ON pos_transactions(status);

CREATE INDEX idx_pos_transaction_items_transaction_id ON pos_transaction_items(transaction_id);
CREATE INDEX idx_pos_transaction_items_product_id ON pos_transaction_items(product_id);
```

---

## 4. POS Core Functionality

### 4.1 Opening a Shift

```typescript
// app/actions/pos.ts
"use server";

export async function openShift(data: {
  registerId: string;
  openingCash: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Check if user already has an open shift
  const { data: existingShift } = await supabase
    .from("pos_shifts")
    .select("*")
    .eq("staff_id", user.id)
    .eq("status", "open")
    .single();

  if (existingShift) {
    throw new Error("You already have an open shift");
  }

  // Create new shift
  const { data: shift, error } = await supabase
    .from("pos_shifts")
    .insert({
      staff_id: user.id,
      register_id: data.registerId,
      opening_cash: data.openingCash,
      status: "open",
    })
    .select()
    .single();

  if (error) throw error;

  // Log audit
  await logAudit({
    action: "SHIFT_OPENED",
    userId: user.id,
    metadata: {
      shiftId: shift.id,
      openingCash: data.openingCash,
      registerId: data.registerId,
    },
  });

  return shift;
}
```

### 4.2 Processing a Sale

```typescript
// app/actions/pos.ts
"use server";

export async function processSale(data: {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: "cash" | "e-wallet" | "split";
  paymentDetails: {
    cash?: number;
    eWallet?: number;
  };
  cashReceived?: number;
  customerId?: string;
  customerEmail?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get current shift
  const { data: shift } = await supabase
    .from("pos_shifts")
    .select("*")
    .eq("staff_id", user.id)
    .eq("status", "open")
    .single();

  if (!shift) {
    throw new Error("No active shift. Please open a shift first.");
  }

  // Calculate totals
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = subtotal * 0.12; // 12% tax
  const total = subtotal + tax;

  // Validate payment
  if (
    data.paymentMethod === "cash" &&
    (!data.cashReceived || data.cashReceived < total)
  ) {
    throw new Error("Insufficient cash received");
  }

  if (data.paymentMethod === "split") {
    const totalPaid =
      (data.paymentDetails.cash || 0) + (data.paymentDetails.eWallet || 0);
    if (totalPaid < total) {
      throw new Error("Split payment total does not match order total");
    }
  }

  // Generate transaction number
  const transactionNumber = await generateTransactionNumber();
  const receiptNumber = await generateReceiptNumber();

  // Create transaction
  const { data: transaction, error: txError } = await supabase
    .from("pos_transactions")
    .insert({
      shift_id: shift.id,
      staff_id: user.id,
      customer_id: data.customerId,
      transaction_number: transactionNumber,
      subtotal,
      tax,
      total,
      payment_method: data.paymentMethod,
      payment_details: data.paymentDetails,
      cash_received: data.cashReceived,
      change_given: data.cashReceived ? data.cashReceived - total : 0,
      receipt_number: receiptNumber,
      customer_email: data.customerEmail,
      notes: data.notes,
      status: "completed",
    })
    .select()
    .single();

  if (txError) throw txError;

  // Add transaction items
  const items = data.items.map((item) => ({
    transaction_id: transaction.id,
    product_id: item.productId,
    variant_id: item.variantId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: item.unitPrice * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("pos_transaction_items")
    .insert(items);

  if (itemsError) throw itemsError;

  // Update inventory (decrease stock)
  for (const item of data.items) {
    if (item.variantId) {
      await supabase.rpc("decrease_variant_stock", {
        variant_id: item.variantId,
        quantity: item.quantity,
      });
    } else {
      await supabase.rpc("decrease_product_stock", {
        product_id: item.productId,
        quantity: item.quantity,
      });
    }
  }

  // Update shift totals
  await supabase
    .from("pos_shifts")
    .update({
      total_sales: shift.total_sales + total,
      transaction_count: shift.transaction_count + 1,
    })
    .eq("id", shift.id);

  // Log audit
  await logAudit({
    action: "SALE_COMPLETED",
    userId: user.id,
    metadata: {
      transactionId: transaction.id,
      total,
      paymentMethod: data.paymentMethod,
    },
  });

  return {
    transaction,
    receiptNumber,
    changeDue: data.cashReceived ? data.cashReceived - total : 0,
  };
}
```

### 4.3 Parking an Order (Hold)

```typescript
// app/actions/pos.ts
"use server";

export async function parkOrder(data: {
  customerName?: string;
  customerPhone?: string;
  cartData: any; // Current cart state
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Set expiry (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const { data: parked, error } = await supabase
    .from("parked_orders")
    .insert({
      staff_id: user.id,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      cart_data: data.cartData,
      notes: data.notes,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  await logAudit({
    action: "ORDER_PARKED",
    userId: user.id,
    metadata: { parkedOrderId: parked.id },
  });

  return parked;
}

export async function retrieveParkedOrder(parkedOrderId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("parked_orders")
    .select("*")
    .eq("id", parkedOrderId)
    .single();

  if (error) throw error;

  // Delete after retrieval
  await supabase.from("parked_orders").delete().eq("id", parkedOrderId);

  return data.cart_data;
}

export async function getParkedOrders() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get all parked orders (staff can see all)
  const { data, error } = await supabase
    .from("parked_orders")
    .select(
      `
      *,
      staff:staff_id(full_name)
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}
```

### 4.4 Closing a Shift (End of Day)

```typescript
// app/actions/pos.ts
"use server";

export async function closeShift(data: {
  closingCash: number;
  notes?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Get current shift
  const { data: shift } = await supabase
    .from("pos_shifts")
    .select("*")
    .eq("staff_id", user.id)
    .eq("status", "open")
    .single();

  if (!shift) {
    throw new Error("No active shift to close");
  }

  // Calculate expected cash
  // Expected = opening_cash + cash_sales - cash_refunds
  const { data: transactions } = await supabase
    .from("pos_transactions")
    .select("total, payment_method, payment_details, status")
    .eq("shift_id", shift.id);

  let cashSales = 0;
  let cashRefunds = 0;

  transactions?.forEach((tx) => {
    if (tx.status === "completed") {
      if (tx.payment_method === "cash") {
        cashSales += tx.total;
      } else if (tx.payment_method === "split") {
        cashSales += tx.payment_details.cash || 0;
      }
    } else if (tx.status === "refunded" && tx.payment_method === "cash") {
      cashRefunds += tx.total;
    }
  });

  const expectedCash = shift.opening_cash + cashSales - cashRefunds;
  const cashDifference = data.closingCash - expectedCash;

  // Update shift
  const { error } = await supabase
    .from("pos_shifts")
    .update({
      closed_at: new Date().toISOString(),
      closing_cash: data.closingCash,
      expected_cash: expectedCash,
      cash_difference: cashDifference,
      notes: data.notes,
      status: "closed",
    })
    .eq("id", shift.id);

  if (error) throw error;

  // Log audit
  await logAudit({
    action: "SHIFT_CLOSED",
    userId: user.id,
    metadata: {
      shiftId: shift.id,
      closingCash: data.closingCash,
      expectedCash,
      cashDifference,
      totalSales: shift.total_sales,
      transactionCount: shift.transaction_count,
    },
  });

  // Generate EOD report
  const eodReport = await generateEODReport(shift.id);

  return {
    shift,
    cashDifference,
    eodReport,
  };
}
```

---

## 5. Split Payment Implementation

```typescript
// components/pos/SplitPaymentModal.tsx
'use client'

import { useState } from 'react'

interface SplitPaymentModalProps {
  total: number
  onComplete: (payment: {
    method: 'split'
    details: { cash: number; eWallet: number }
  }) => void
}

export function SplitPaymentModal({ total, onComplete }: SplitPaymentModalProps) {
  const [cashAmount, setCashAmount] = useState(0)
  const [eWalletAmount, setEWalletAmount] = useState(0)

  const remaining = total - cashAmount - eWalletAmount
  const isValid = remaining === 0

  return (
    <div className="space-y-4">
      <div className="text-2xl font-bold">
        Total: ${total.toFixed(2)}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Cash Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={cashAmount}
            onChange={(e) => setCashAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            E-Wallet Amount
          </label>
          <input
            type="number"
            step="0.01"
            value={eWalletAmount}
            onChange={(e) => setEWalletAmount(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-lg font-semibold">
            <span>Remaining:</span>
            <span className={remaining > 0 ? 'text-red-500' : 'text-green-500'}>
              ${remaining.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onComplete({
          method: 'split',
          details: {
            cash: cashAmount,
            eWallet: eWalletAmount
          }
        })}
        disabled={!isValid}
        className="w-full py-3 bg-primary text-white rounded-md disabled:bg-gray-300"
      >
        Complete Payment
      </button>
    </div>
  )
}
```

---

## 6. Barcode/QR Scanning

### 6.1 Using QuaggaJS (Barcode Scanner)

```typescript
// components/pos/BarcodeScanner.tsx
'use client'

import { useEffect, useRef } from 'react'
import Quagga from '@ericblade/quagga2'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scannerRef.current) {
      Quagga.init({
        inputStream: {
          name: 'Live',
          type: 'LiveStream',
          target: scannerRef.current,
          constraints: {
            width: 640,
            height: 480,
            facingMode: 'environment'
          }
        },
        decoder: {
          readers: ['code_128_reader', 'ean_reader', 'ean_8_reader', 'upc_reader']
        }
      }, (err) => {
        if (err) {
          console.error(err)
          return
        }
        Quagga.start()
      })

      Quagga.onDetected((result) => {
        const code = result.codeResult.code
        if (code) {
          onScan(code)
          Quagga.stop()
        }
      })
    }

    return () => {
      Quagga.stop()
    }
  }, [onScan])

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-lg w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Scan Barcode</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>
        <div ref={scannerRef} className="w-full h-64 bg-gray-100 rounded" />
        <p className="text-sm text-gray-500 mt-2 text-center">
          Position the barcode within the camera view
        </p>
      </div>
    </div>
  )
}

// Usage in POS
function POSPage() {
  const [showScanner, setShowScanner] = useState(false)

  const handleScan = async (barcode: string) => {
    setShowScanner(false)

    // Look up product by barcode
    const product = await findProductByBarcode(barcode)
    if (product) {
      addToCart(product)
    } else {
      toast.error('Product not found')
    }
  }

  return (
    <>
      <button onClick={() => setShowScanner(true)}>
        📷 Scan Barcode
      </button>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
```

---

## 7. Receipt Generation

### 7.1 Thermal Printer Receipt Format

```typescript
// lib/pos/receipt.ts
export function generateReceiptText(transaction: POSTransaction): string {
  const receipt = `
╔═══════════════════════════════╗
║      VAPOUR LOUNGE            ║
║   123 Main St, City, ZIP      ║
║   Tel: (123) 456-7890         ║
║   TIN: 123-456-789-000        ║
╠═══════════════════════════════╣
║                               ║
║  Receipt #: ${transaction.receipt_number}
║  Date: ${formatDate(transaction.created_at)}
║  Staff: ${transaction.staff_name}
║                               ║
╠═══════════════════════════════╣

${transaction.items
  .map(
    (item) => `
${item.product_name}
${item.variant ? `(${item.variant})` : ""}
  ${item.quantity} x $${item.unit_price}    $${item.subtotal}
`
  )
  .join("\n")}

───────────────────────────────
Subtotal:              $${transaction.subtotal}
Tax (12%):             $${transaction.tax}
───────────────────────────────
TOTAL:                 $${transaction.total}

Payment: ${transaction.payment_method.toUpperCase()}
${
  transaction.cash_received
    ? `
Cash Received:         $${transaction.cash_received}
Change:                $${transaction.change_given}
`
    : ""
}

╠═══════════════════════════════╣
║  AGE RESTRICTED PRODUCT       ║
║  Thank you for your purchase! ║
╚═══════════════════════════════╝
  `;

  return receipt;
}

// Print using browser print
export function printReceipt(receiptText: string) {
  const printWindow = window.open("", "", "width=300,height=600");
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px;
              margin: 0;
              padding: 10px;
            }
            pre {
              white-space: pre-wrap;
              margin: 0;
            }
          </style>
        </head>
        <body>
          <pre>${receiptText}</pre>
          <script>
            window.onload = () => {
              window.print()
              window.close()
            }
          </script>
        </body>
      </html>
    `);
  }
}
```

---

## 8. POS Best Practices

### Performance

✓ Cache product data locally (reduce DB queries)
✓ Optimistic UI updates (instant feedback)
✓ Debounce search input
✓ Virtual scrolling for large product lists

### Security

✓ Require PIN/password for refunds
✓ Limit discount percentages (require manager override)
✓ Log all POS actions
✓ Prevent negative inventory

### UX

✓ Large touch targets (44px minimum)
✓ Keyboard shortcuts (F1-F12 for categories, Enter to checkout)
✓ Clear error messages
✓ Confirmation dialogs for destructive actions

### Offline Capability

✓ LocalStorage for product cache
✓ Queue transactions when offline
✓ Sync when connection restored

---

## Next Steps

1. Build POS UI layout
2. Implement shift management
3. Add barcode scanning
4. Create receipt generation
5. Test split payment flow
6. Add keyboard shortcuts
7. Test on tablet device

---

## Resources

- Square POS: https://squareup.com/us/en/point-of-sale
- Shopify POS: https://www.shopify.com/pos
- QuaggaJS: https://serratus.github.io/quaggaJS/
- Thermal Printer ESC/POS Commands: https://reference.epson-biz.com/modules/ref_escpos/
