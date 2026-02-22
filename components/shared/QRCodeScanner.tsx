"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Html5Qrcode } from "html5-qrcode";
import { AlertCircle, Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type QRCodeScannerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: string) => void;
  title?: string;
  description?: string;
};

export function QRCodeScanner({
  open,
  onOpenChange,
  onScan,
  title = "Scan QR Code",
  description = "Position the QR code within the camera view",
}: QRCodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const readerId = "qr-reader";

  const startScanner = async () => {
    try {
      setError(null);
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Success callback
          onScan(decodedText);
          toast.success("QR Code scanned successfully");
          stopScanner();
          onOpenChange(false);
        },
        (errorMessage) => {
          // Error callback (can be ignored for scanning errors)
          // console.log("Scanning...", errorMessage);
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      console.error("Error starting scanner:", err);
      setError(
        err?.message || "Failed to start camera. Please check permissions."
      );
      toast.error("Failed to start camera");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  useEffect(() => {
    if (open && !isScanning && !error) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startScanner();
      }, 100);
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const handleClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Camera Error
                  </p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => {
                      setError(null);
                      startScanner();
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div
                id={readerId}
                className="rounded-lg overflow-hidden bg-black"
                style={{ width: "100%", minHeight: "300px" }}
              />

              {isScanning && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Position the QR code in front of the camera
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
