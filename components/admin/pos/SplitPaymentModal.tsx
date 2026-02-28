"use client";

import type { SplitPayment } from "@/app/actions/pos-enhanced";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

type SplitPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (payments: SplitPayment[], cashReceived?: number) => void;
};

export function SplitPaymentModal({
  open,
  onOpenChange,
  total,
  onConfirm,
}: SplitPaymentModalProps) {
  const [payments, setPayments] = useState<SplitPayment[]>([
    { method: "cash", amount: total },
  ]);
  const [cashReceived, setCashReceived] = useState<string>("");

  useEffect(() => {
    if (open) {
      // Reset when modal opens
      setPayments([{ method: "cash", amount: total }]);
      setCashReceived("");
    }
  }, [open, total]);

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - totalPaid;
  const hasCash = payments.some((p) => p.method === "cash");
  const cashAmount = payments.find((p) => p.method === "cash")?.amount || 0;
  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = hasCash ? Math.max(0, cashReceivedNum - cashAmount) : 0;

  const isValid =
    Math.abs(remaining) < 0.01 && (!hasCash || cashReceivedNum >= cashAmount);

  const handleAddPayment = () => {
    const remainingAmount = total - totalPaid;
    if (remainingAmount > 0) {
      setPayments([...payments, { method: "cash", amount: remainingAmount }]);
    }
  };

  const handleRemovePayment = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePayment = (
    index: number,
    field: keyof SplitPayment,
    value: any
  ) => {
    setPayments(
      payments.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]: field === "amount" ? parseFloat(value) || 0 : value,
            }
          : p
      )
    );
  };

  const handleConfirm = () => {
    if (isValid) {
      onConfirm(payments, hasCash ? cashReceivedNum : undefined);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
          <DialogDescription>
            Accept multiple payment methods for this order
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Total */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">Order Total:</span>
              <span className="text-2xl font-bold">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Payment Methods</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddPayment}
                disabled={Math.abs(remaining) < 0.01}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Payment
              </Button>
            </div>

            {payments.map((payment, index) => (
              <div
                key={index}
                className="flex items-end gap-3 p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <Label className="text-sm">Payment Method</Label>
                  <Select
                    value={payment.method}
                    onValueChange={(value) =>
                      handleUpdatePayment(index, "method", value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="maya">Maya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-sm">Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={payment.amount}
                    onChange={(e) =>
                      handleUpdatePayment(index, "amount", e.target.value)
                    }
                    className="mt-1"
                    placeholder="0.00"
                  />
                </div>

                {payments.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePayment(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Cash Received Input */}
          {hasCash && (
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg space-y-3">
              <Label htmlFor="cashReceived">Cash Received</Label>
              <Input
                id="cashReceived"
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="Enter cash amount received"
                className="text-lg"
              />
              {cashReceivedNum > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Change:</span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(change)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Payment Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Paid:</span>
              <Badge
                variant={Math.abs(remaining) < 0.01 ? "default" : "destructive"}
              >
                {formatCurrency(totalPaid)}
              </Badge>
            </div>
            {Math.abs(remaining) >= 0.01 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Remaining:</span>
                <span className="font-medium text-destructive">
                  {formatCurrency(Math.abs(remaining))}
                </span>
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {!isValid && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                <div className="text-sm text-yellow-700 dark:text-yellow-400">
                  {Math.abs(remaining) >= 0.01 && (
                    <p>Payment total must equal order total</p>
                  )}
                  {hasCash && cashReceivedNum < cashAmount && (
                    <p>Cash received must be at least the cash amount</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
