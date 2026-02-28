"use client";

import {
  lookupPOSTransaction,
  processPOSRefund,
  type POSRefundItem,
  type POSTransactionLookup,
} from "@/app/actions/pos-returns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type RefundItemState = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  maxQty: number;
  selected: boolean;
  quantity: number;
  reason: string;
  condition: "unopened" | "opened" | "defective" | "damaged";
};

interface POSRefundModalProps {
  onRefundComplete?: (returnNumber: string, refundAmount: number) => void;
}

export function POSRefundModal({ onRefundComplete }: POSRefundModalProps) {
  const [open, setOpen] = useState(false);
  const [receiptInput, setReceiptInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transaction, setTransaction] = useState<POSTransactionLookup | null>(
    null
  );
  const [searchError, setSearchError] = useState<string | null>(null);
  const [items, setItems] = useState<RefundItemState[]>([]);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState<{
    returnNumber: string;
    refundAmount: number;
  } | null>(null);

  const reset = () => {
    setReceiptInput("");
    setTransaction(null);
    setSearchError(null);
    setItems([]);
    setNotes("");
    setDone(null);
    setSearching(false);
    setSubmitting(false);
  };

  const handleSearch = async () => {
    const receipt = receiptInput.trim();
    if (!receipt) return;
    setSearching(true);
    setSearchError(null);
    setTransaction(null);
    setItems([]);
    setDone(null);

    const result = await lookupPOSTransaction(receipt);

    if (!result.success || !result.data) {
      setSearchError(result.error ?? "Transaction not found.");
      setSearching(false);
      return;
    }

    const txn = result.data;
    setTransaction(txn);
    setItems(
      txn.pos_transaction_items.map((i) => ({
        productId: i.product_id,
        name: i.products?.name ?? "Unknown Product",
        sku: i.products?.sku ?? "",
        unitPrice: i.unit_price,
        maxQty: i.quantity,
        selected: false,
        quantity: 1,
        reason: "",
        condition: "opened",
      }))
    );
    setSearching(false);
  };

  const updateItem = (productId: string, patch: Partial<RefundItemState>) => {
    setItems((prev) =>
      prev.map((it) => (it.productId === productId ? { ...it, ...patch } : it))
    );
  };

  const selectedItems = items.filter((i) => i.selected);

  const refundTotal = selectedItems.reduce(
    (sum, i) => sum + i.unitPrice * i.quantity,
    0
  );

  const canSubmit =
    selectedItems.length > 0 &&
    selectedItems.every((i) => i.reason.trim().length >= 3);

  const handleSubmit = async () => {
    if (!transaction || !canSubmit) return;
    setSubmitting(true);

    const payload: POSRefundItem[] = selectedItems.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      reason: i.reason.trim(),
      condition: i.condition,
    }));

    const result = await processPOSRefund(
      transaction.id,
      payload,
      notes.trim() || undefined
    );

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Refund failed.");
      return;
    }

    const { returnNumber, refundAmount } = result.data;
    setDone({ returnNumber, refundAmount });
    toast.success(`Refund processed — ${returnNumber}`);
    onRefundComplete?.(returnNumber, refundAmount);
  };

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Process Refund
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            POS Refund
          </DialogTitle>
          <DialogDescription>
            Enter the receipt number to look up a transaction and process a
            refund.
          </DialogDescription>
        </DialogHeader>

        {/* ── Success state ─────────────────────────────────────────── */}
        {done ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <CheckCircle2 className="h-14 w-14 text-green-500" />
            <div>
              <p className="text-lg font-semibold">Refund Processed</p>
              <p className="text-muted-foreground text-sm mt-1">
                Return #{done.returnNumber}
              </p>
            </div>
            <div className="text-3xl font-bold text-green-600">
              {formatCurrency(done.refundAmount)}
            </div>
            <p className="text-sm text-muted-foreground">
              Stock has been restored and the audit log updated.
            </p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" onClick={reset}>
                Process Another Refund
              </Button>
              <Button onClick={() => handleOpenChange(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Step 1: Receipt search ──────────────────────────── */}
            <div className="space-y-2">
              <Label>Receipt Number</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. RCP-1234567890"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSearch}
                  disabled={searching || !receiptInput.trim()}
                >
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {searchError && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {searchError}
                </p>
              )}
            </div>

            {/* ── Step 2: Transaction preview + item selection ─────── */}
            {transaction && (
              <>
                <Separator />

                {/* Transaction summary */}
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      Receipt #{transaction.receipt_number}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleString()} ·{" "}
                      {transaction.payment_method.toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {formatCurrency(transaction.total)}
                    </p>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "outline"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>

                {/* Item list */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Select items to refund</p>
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className={`border rounded-lg p-3 transition-colors ${
                        item.selected
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                    >
                      {/* Item header row */}
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 cursor-pointer"
                          checked={item.selected}
                          onChange={(e) =>
                            updateItem(item.productId, {
                              selected: e.target.checked,
                            })
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium text-sm truncate">
                              {item.name}
                            </p>
                            <p className="text-sm font-semibold shrink-0">
                              {formatCurrency(item.unitPrice)}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            SKU: {item.sku} · Sold qty: {item.maxQty}
                          </p>
                        </div>
                      </div>

                      {/* Expanded fields when selected */}
                      {item.selected && (
                        <div className="mt-3 pl-7 grid grid-cols-2 gap-3">
                          {/* Quantity */}
                          <div className="space-y-1">
                            <Label className="text-xs">Qty to Refund</Label>
                            <Input
                              type="number"
                              min={1}
                              max={item.maxQty}
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.productId, {
                                  quantity: Math.min(
                                    item.maxQty,
                                    Math.max(1, Number(e.target.value))
                                  ),
                                })
                              }
                              className="h-8"
                              placeholder="1"
                            />
                          </div>

                          {/* Condition */}
                          <div className="space-y-1">
                            <Label className="text-xs">Condition</Label>
                            <Select
                              value={item.condition}
                              onValueChange={(v) =>
                                updateItem(item.productId, {
                                  condition: v as RefundItemState["condition"],
                                })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unopened">
                                  Unopened
                                </SelectItem>
                                <SelectItem value="opened">Opened</SelectItem>
                                <SelectItem value="defective">
                                  Defective
                                </SelectItem>
                                <SelectItem value="damaged">Damaged</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Reason */}
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">
                              Reason <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              placeholder="e.g. Wrong item, defective, customer changed mind"
                              value={item.reason}
                              onChange={(e) =>
                                updateItem(item.productId, {
                                  reason: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          </div>

                          {/* Subtotal preview */}
                          <div className="col-span-2 flex justify-end text-sm text-muted-foreground">
                            Refund:{" "}
                            <span className="font-semibold text-foreground ml-1">
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Staff notes */}
                <div className="space-y-1">
                  <Label className="text-sm">Staff Notes (optional)</Label>
                  <Textarea
                    placeholder="Any additional context for the audit log…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <Separator />

                {/* Refund total + submit */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {selectedItems.length} item
                      {selectedItems.length !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-xl font-bold">
                      Refund:{" "}
                      <span className="text-green-600">
                        {formatCurrency(refundTotal)}
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="min-w-32"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing…
                      </>
                    ) : (
                      "Confirm Refund"
                    )}
                  </Button>
                </div>

                {selectedItems.length > 0 &&
                  selectedItems.some((i) => i.reason.trim().length < 3) && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      All selected items require a reason before submitting.
                    </p>
                  )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
