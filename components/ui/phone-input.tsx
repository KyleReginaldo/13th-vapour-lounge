"use client";

import { Phone } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

interface PhoneInputProps {
  /** The raw digits after +63 (max 10) */
  value: string;
  /** Called with the raw digits (no +63 prefix) */
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

function PhoneInput({
  value,
  onChange,
  className,
  placeholder = "9XXXXXXXXX",
  disabled,
  ...rest
}: PhoneInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    onChange(digits);
  };

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border-[1.5px] border-[#E8E8E8] bg-white overflow-hidden transition-all",
        "focus-within:border-[#0A0A0A] focus-within:shadow-[0_0_0_3px_rgba(10,10,10,0.06)]",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <span className="pl-3 pr-2 text-[14px] text-[#3D3D3D] font-medium shrink-0 border-r border-[#E8E8E8] py-2.5">
        <Phone className="inline h-3.5 w-3.5 text-[#ADADAD] mr-1" />
        +63
      </span>
      <input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        maxLength={10}
        disabled={disabled}
        className="flex-1 h-11 px-3 text-[14px] bg-transparent outline-none placeholder:text-[#CDCDCD] disabled:cursor-not-allowed"
        {...rest}
      />
    </div>
  );
}

export { PhoneInput };
