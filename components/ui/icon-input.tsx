import type { LucideIcon } from "lucide-react";
import * as React from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface IconInputProps extends React.ComponentProps<"input"> {
  icon: LucideIcon;
  containerClassName?: string;
}

function IconInput({
  icon: Icon,
  className,
  containerClassName,
  ...props
}: IconInputProps) {
  return (
    <div className={cn("relative", containerClassName)}>
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#ADADAD] pointer-events-none" />
      <Input className={cn("pl-9", className)} {...props} />
    </div>
  );
}

export { IconInput };
