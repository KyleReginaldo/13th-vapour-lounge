"use client";

import { cn } from "@/lib/utils";
import { Check, CreditCard, MapPin, Package } from "lucide-react";

interface Step {
  id: number;
  name: string;
  description?: string;
}

interface CheckoutStepperProps {
  steps: Step[];
  currentStep: number;
}

const STEP_ICONS = {
  1: MapPin,
  2: CreditCard,
  3: Package,
};

export function CheckoutStepper({ steps, currentStep }: CheckoutStepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, stepIdx) => {
          const Icon = STEP_ICONS[step.id as keyof typeof STEP_ICONS];
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <li
              key={step.id}
              className="relative flex flex-1 flex-col items-center"
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div
                  className="absolute left-[calc(50%+1.5rem)] top-5 h-0.5 w-[calc(100%-3rem)] hidden sm:block"
                  aria-hidden="true"
                >
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isComplete ? "bg-green-500" : "bg-gray-200"
                    )}
                  />
                </div>
              )}

              {/* Step Content */}
              <div className="relative z-10 flex flex-col items-center">
                {/* Circle with Icon */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300",
                    isComplete
                      ? "bg-green-500 text-white shadow-md"
                      : isCurrent
                        ? "bg-blue-600 text-white shadow-lg scale-110"
                        : "bg-white border-2 border-gray-300 text-gray-400"
                  )}
                >
                  {isComplete ? (
                    <Check className="h-5 w-5" strokeWidth={3} />
                  ) : Icon ? (
                    <Icon
                      className="h-5 w-5"
                      strokeWidth={isCurrent ? 2.5 : 2}
                    />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>

                {/* Label */}
                <div className="mt-2.5 text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold transition-colors",
                      isCurrent || isComplete
                        ? "text-gray-900"
                        : "text-gray-500"
                    )}
                  >
                    {step.name}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
