"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Step {
  id: number;
  name: string;
  description?: string;
}

interface CheckoutStepperProps {
  steps: Step[];
  currentStep: number;
}

export function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-center">
        {steps.map((step, stepIdx) => (
          <li
            key={step.id}
            className={cn(
              "relative",
              stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : ""
            )}
          >
            {/* Connector Line */}
            {stepIdx !== steps.length - 1 && (
              <div
                className="absolute left-full top-4 -ml-2 hidden h-0.5 w-full sm:block"
                aria-hidden="true"
              >
                <div
                  className={cn(
                    "h-full transition-colors",
                    currentStep > stepIdx + 1 ? "bg-primary" : "bg-muted"
                  )}
                />
              </div>
            )}

            {/* Step Circle */}
            <div className="group relative flex flex-col items-center">
              <span className="flex h-9 items-center" aria-hidden="true">
                <span
                  className={cn(
                    "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                    currentStep > stepIdx + 1
                      ? "border-primary bg-primary"
                      : currentStep === stepIdx + 1
                        ? "border-primary bg-background"
                        : "border-muted bg-muted"
                  )}
                >
                  {currentStep > stepIdx + 1 ? (
                    <Check className="h-4 w-4 text-primary-foreground" />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        currentStep === stepIdx + 1
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.id}
                    </span>
                  )}
                </span>
              </span>

              {/* Step Label */}
              <span className="mt-2 flex flex-col items-center">
                <span
                  className={cn(
                    "text-xs font-medium sm:text-sm",
                    currentStep >= stepIdx + 1
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.name}
                </span>
                {step.description && (
                  <span className="mt-0.5 hidden text-xs text-muted-foreground sm:block">
                    {step.description}
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
