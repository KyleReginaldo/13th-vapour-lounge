"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import {
  Banknote,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  Printer,
  Receipt,
  Smartphone,
} from "lucide-react";
import { useState } from "react";

type Transaction = {
  id: string;
  items: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card" | "gcash" | "maya";
  cashReceived?: number;
  change?: number;
  timestamp: string;
};

interface TransactionHistoryProps {
  transactions: Transaction[];
  onPrintReceipt?: (transaction: Transaction) => void;
}

export function TransactionHistory({
  transactions,
  onPrintReceipt = () => {},
}: TransactionHistoryProps) {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <Banknote className="h-4 w-4" />;
      case "card":
        return <CreditCard className="h-4 w-4" />;
      case "gcash":
      case "maya":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalTransactions = transactions.length;
  const totalSales = transactions.reduce((sum, t) => sum + t.total, 0);
  const averageTransaction =
    totalTransactions > 0 ? totalSales / totalTransactions : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-sm text-muted-foreground">Transactions Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {formatCurrency(totalSales)}
            </div>
            <p className="text-sm text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {formatCurrency(averageTransaction)}
            </div>
            <p className="text-sm text-muted-foreground">Avg Transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Today's completed transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-xs">Completed transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-100 overflow-y-auto">
              {transactions
                .slice(-10)
                .reverse()
                .map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center h-10 w-10 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{transaction.id}</span>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            {getPaymentMethodIcon(transaction.paymentMethod)}
                            {getPaymentMethodLabel(transaction.paymentMethod)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(transaction.timestamp)}
                          <span>•</span>
                          <span>{transaction.items.length} items</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">
                          {formatCurrency(transaction.total)}
                        </div>
                        {transaction.paymentMethod === "cash" &&
                          transaction.change &&
                          transaction.change > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Change: {formatCurrency(transaction.change)}
                            </div>
                          )}
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Transaction Details</DialogTitle>
                              <DialogDescription>
                                Receipt #{transaction.id}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                              {/* Transaction Info */}
                              <div className="text-center pb-4 border-b border-dashed">
                                <h3 className="font-bold text-lg">
                                  VAPOUR LOUNGE
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Receipt #{transaction.id}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    transaction.timestamp
                                  ).toLocaleString()}
                                </p>
                              </div>

                              {/* Items */}
                              <div className="space-y-2">
                                {transaction.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex justify-between items-start text-sm"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">{item.name}</p>
                                      <p className="text-muted-foreground text-xs">
                                        {item.sku}
                                      </p>
                                    </div>
                                    <div className="text-right ml-4">
                                      <p>
                                        {item.quantity} x{" "}
                                        {formatCurrency(item.price)}
                                      </p>
                                      <p className="font-medium">
                                        {formatCurrency(
                                          item.price * item.quantity
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <Separator className="border-dashed" />

                              {/* Totals */}
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span>Subtotal:</span>
                                  <span>
                                    {formatCurrency(transaction.subtotal)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Tax (12%):</span>
                                  <span>{formatCurrency(transaction.tax)}</span>
                                </div>
                                <Separator className="border-dashed" />
                                <div className="flex justify-between font-bold text-base">
                                  <span>Total:</span>
                                  <span>
                                    {formatCurrency(transaction.total)}
                                  </span>
                                </div>
                              </div>

                              {/* Payment Info */}
                              <div className="bg-muted/50 p-3 rounded text-sm">
                                <div className="flex items-center gap-2 mb-2">
                                  {getPaymentMethodIcon(
                                    transaction.paymentMethod
                                  )}
                                  <span className="font-medium">
                                    {getPaymentMethodLabel(
                                      transaction.paymentMethod
                                    )}
                                  </span>
                                </div>
                                {transaction.paymentMethod === "cash" && (
                                  <>
                                    <div className="flex justify-between">
                                      <span>Cash Received:</span>
                                      <span>
                                        {formatCurrency(
                                          transaction.cashReceived || 0
                                        )}
                                      </span>
                                    </div>
                                    {transaction.change &&
                                      transaction.change > 0 && (
                                        <div className="flex justify-between font-medium">
                                          <span>Change:</span>
                                          <span>
                                            {formatCurrency(transaction.change)}
                                          </span>
                                        </div>
                                      )}
                                  </>
                                )}
                              </div>

                              <div className="text-center pt-4 border-t border-dashed">
                                <p className="text-xs text-muted-foreground">
                                  Thank you for your purchase!
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onPrintReceipt(transaction)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
