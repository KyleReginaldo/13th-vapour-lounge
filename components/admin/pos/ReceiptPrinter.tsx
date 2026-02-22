"use client";

import type { ReceiptData } from "@/app/actions/pos-enhanced";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { Download, Printer } from "lucide-react";
import { useRef } from "react";

type ReceiptPrinterProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData;
};

export function ReceiptPrinter({
  open,
  onOpenChange,
  receipt,
}: ReceiptPrinterProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (receiptRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - ${receipt.receiptNumber}</title>
              <style>
                @media print {
                  @page { margin: 0; size: 80mm auto; }
                  body { margin: 0; }
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 12px;
                  line-height: 1.4;
                  max-width: 80mm;
                  margin: 0 auto;
                  padding: 10mm;
                }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .large { font-size: 14px; }
                .separator { border-top: 1px dashed #000; margin: 8px 0; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 2px 0; }
                .right { text-align: right; }
                .total-line { border-top: 2px solid #000; margin-top: 8px; padding-top: 4px; }
              </style>
            </head>
            <body>
              ${receiptRef.current.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleDownload = () => {
    if (receiptRef.current) {
      const content = receiptRef.current.innerText;
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receipt.receiptNumber}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            Order #{receipt.orderNumber || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-lg p-4 bg-white text-black">
          <div
            ref={receiptRef}
            className="font-mono text-xs space-y-2"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {/* Header */}
            <div className="text-center space-y-1">
              <div className="text-lg font-bold">13TH VAPOUR LOUNGE</div>
              <div className="text-xs">Vape Shop & Lounge</div>
              <div className="text-xs">BGC, Taguig City</div>
              <div className="text-xs">Tel: +63 917 000 0000</div>
            </div>

            <Separator className="my-2" />

            {/* Receipt Info */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              {receipt.orderNumber && (
                <div className="flex justify-between">
                  <span>Order #:</span>
                  <span>{receipt.orderNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date:</span>
                <span>
                  {format(new Date(receipt.timestamp), "MMM dd, yyyy HH:mm")}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Served by:</span>
                <span>{receipt.servedBy}</span>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Items */}
            <div className="space-y-2">
              {receipt.items.map((item, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="flex-1">{item.name}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>
                      {item.quantity} x {formatCurrency(item.price)}
                    </span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="my-2" />

            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (12%):</span>
                <span>{formatCurrency(receipt.tax)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t-2 border-black pt-2 mt-2">
                <span>TOTAL:</span>
                <span>{formatCurrency(receipt.total)}</span>
              </div>
            </div>

            <Separator className="my-2" />

            {/* Payment */}
            <div className="space-y-1">
              <div className="font-bold mb-1">Payment:</div>
              {receipt.payments.map((payment, index) => (
                <div key={index} className="flex justify-between">
                  <span className="capitalize">{payment.method}:</span>
                  <span>{formatCurrency(payment.amount)}</span>
                </div>
              ))}
              {receipt.cashReceived && receipt.cashReceived > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>{formatCurrency(receipt.cashReceived)}</span>
                  </div>
                  {receipt.change && receipt.change > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>Change:</span>
                      <span>{formatCurrency(receipt.change)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator className="my-2" />

            {/* Footer */}
            <div className="text-center space-y-1 text-xs">
              <div>Thank you for your purchase!</div>
              <div>This serves as your official receipt.</div>
              <div className="mt-2">VAT Reg. TIN: XXX-XXX-XXX-XXX</div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
