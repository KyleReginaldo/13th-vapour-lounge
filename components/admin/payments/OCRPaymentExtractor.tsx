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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createWorker } from "tesseract.js";

type OCRPaymentExtractorProps = {
  onExtract: (data: { referenceNumber?: string; amount?: number }) => void;
  className?: string;
};

export function OCRPaymentExtractor({
  onExtract,
  className,
}: OCRPaymentExtractorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{
    referenceNumber?: string;
    amount?: number;
    rawText?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPaymentInfo = async (file: File) => {
    setIsProcessing(true);
    setExtractedData(null);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Create Tesseract worker
      const worker = await createWorker("eng");

      // Perform OCR
      const {
        data: { text },
      } = await worker.recognize(file);

      await worker.terminate();

      // Extract reference number (common patterns)
      const refPatterns = [
        /reference\s*(?:number|no|#)?[\s:]*([A-Z0-9\-]+)/i,
        /ref\s*(?:no|#)?[\s:]*([A-Z0-9\-]+)/i,
        /transaction\s*(?:id|number)?[\s:]*([A-Z0-9\-]+)/i,
        /confirmation\s*(?:code|number)?[\s:]*([A-Z0-9\-]+)/i,
        /([A-Z0-9]{10,})/i, // Generic long alphanumeric
      ];

      let referenceNumber: string | undefined;
      for (const pattern of refPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          referenceNumber = match[1].trim();
          break;
        }
      }

      // Extract amount (common patterns)
      const amountPatterns = [
        /(?:amount|total|paid)[\s:]*(?:PHP|₱)?\s*([\d,]+\.?\d*)/i,
        /(?:PHP|₱)\s*([\d,]+\.?\d*)/i,
        /([\d,]+\.\d{2})/i, // Decimal amounts
      ];

      let amount: number | undefined;
      for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const amountStr = match[1].replace(/,/g, "");
          const parsedAmount = parseFloat(amountStr);
          if (!isNaN(parsedAmount) && parsedAmount > 0) {
            amount = parsedAmount;
            break;
          }
        }
      }

      const extracted = {
        referenceNumber,
        amount,
        rawText: text,
      };

      setExtractedData(extracted);

      if (referenceNumber || amount) {
        onExtract({ referenceNumber, amount });
        toast.success("Payment information extracted");
      } else {
        toast.warning("Could not extract payment info. Please enter manually.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to process image");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      extractPaymentInfo(file);
    }
  };

  const handleReset = () => {
    setImagePreview(null);
    setExtractedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Auto-Extract Payment Info
        </CardTitle>
        <CardDescription>
          Upload a screenshot to automatically extract reference number and
          amount
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!imagePreview ? (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              className="w-full h-32 border-dashed"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Processing image...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8" />
                  <span>Upload Payment Screenshot</span>
                  <span className="text-xs text-muted-foreground">
                    Click to select image
                  </span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Image Preview */}
            <div className="relative rounded-lg overflow-hidden border">
              <img
                src={imagePreview}
                alt="Payment screenshot"
                className="w-full h-auto max-h-64 object-contain"
              />
            </div>

            {/* Extracted Data */}
            {extractedData && (
              <div className="space-y-3">
                {extractedData.referenceNumber && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Extracted Reference
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={extractedData.referenceNumber}
                        readOnly
                        className="font-mono"
                      />
                      <Badge variant="default">Auto</Badge>
                    </div>
                  </div>
                )}

                {extractedData.amount && (
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      Extracted Amount
                    </Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={`₱${extractedData.amount.toFixed(2)}`}
                        readOnly
                      />
                      <Badge variant="default">Auto</Badge>
                    </div>
                  </div>
                )}

                {!extractedData.referenceNumber && !extractedData.amount && (
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">
                      Could not extract payment information. Please enter
                      manually below.
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Try Another Image
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
