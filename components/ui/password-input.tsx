"use client";

import { Eye, EyeOff, Lock } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<
  React.ComponentProps<"input">,
  "type"
> {
  /** Hide the lock icon on the left */
  hideIcon?: boolean;
}

function PasswordInput({ className, hideIcon, ...props }: PasswordInputProps) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      {!hideIcon && (
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD] pointer-events-none" />
      )}
      <Input
        type={show ? "text" : "password"}
        className={cn(hideIcon ? "pr-10" : "pl-9 pr-10", className)}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADADAD] hover:text-[#3D3D3D] transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export { PasswordInput };
