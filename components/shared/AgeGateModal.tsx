"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const AGE_GATE_KEY = "vapour-lounge-age-verified";
const MIN_AGE = 18;

type AgeGateModalProps = {
  enabled?: boolean;
  onVerified?: () => void;
};

export function AgeGateModal({
  enabled = true,
  onVerified,
}: AgeGateModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setHasChecked(true);
      return;
    }

    // Check if user has already verified age
    const verified = localStorage.getItem(AGE_GATE_KEY);

    if (verified === "true") {
      setHasChecked(true);
      onVerified?.();
    } else {
      // Show modal after a brief delay
      setTimeout(() => {
        setIsOpen(true);
        setHasChecked(true);
      }, 500);
    }
  }, [enabled, onVerified]);

  const handleConfirm = () => {
    // Store the verification
    localStorage.setItem(AGE_GATE_KEY, "true");
    localStorage.setItem(`${AGE_GATE_KEY}-timestamp`, new Date().toISOString());

    setIsOpen(false);
    onVerified?.();
  };

  const handleDecline = () => {
    // Redirect to an exit page or close
    setIsOpen(false);
    router.push("/unauthorized");
  };

  if (!enabled || !hasChecked) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Age Verification Required
          </DialogTitle>
          <DialogDescription className="text-center text-base py-4">
            You must be at least {MIN_AGE} years old to enter this website and
            purchase our products.
            <br />
            <br />
            By clicking "I am {MIN_AGE}+", you confirm that you are of legal age
            to purchase vaping products in your jurisdiction.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex flex-col sm:flex-col gap-2">
          <Button onClick={handleConfirm} size="lg" className="w-full">
            I am {MIN_AGE} years or older
          </Button>
          <Button
            onClick={handleDecline}
            variant="outline"
            size="lg"
            className="w-full"
          >
            I am under {MIN_AGE}
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-4">
          This website contains products intended for adults only. Vaping
          products contain nicotine, which is a highly addictive substance.
        </p>
      </DialogContent>
    </Dialog>
  );
}
