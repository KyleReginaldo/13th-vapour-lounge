"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

export const QuantityInput = ({
  value,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  className,
}: QuantityInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
      setInputValue((value - 1).toString());
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
      setInputValue((value + 1).toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Parse and validate
    const parsedValue = parseInt(newValue, 10);
    if (!isNaN(parsedValue) && parsedValue >= min && parsedValue <= max) {
      onChange(parsedValue);
    }
  };

  const handleInputBlur = () => {
    // Reset to current value if input is invalid
    const parsedValue = parseInt(inputValue, 10);
    if (isNaN(parsedValue) || parsedValue < min || parsedValue > max) {
      setInputValue(value.toString());
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="h-10 w-10 shrink-0"
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">Decrease quantity</span>
      </Button>

      <Input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        className="h-10 w-16 text-center font-medium"
        aria-label="Quantity"
      />

      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="h-10 w-10 shrink-0"
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">Increase quantity</span>
      </Button>

      {max < 99 && (
        <span className="text-sm text-muted-foreground">Max: {max}</span>
      )}
    </div>
  );
};
