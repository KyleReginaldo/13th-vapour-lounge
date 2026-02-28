import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-[#CDCDCD] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-xl border-[1.5px] border-[#E8E8E8] bg-white px-4 py-3 text-[14px] shadow-xs outline-none transition-all focus-visible:border-[#0A0A0A] focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_rgba(10,10,10,0.06)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
