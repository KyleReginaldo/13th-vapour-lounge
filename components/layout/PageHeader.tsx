import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  subtitle,
  description,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("mb-6 md:mb-8", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          {subtitle && (
            <p className="text-sm font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-base text-muted-foreground md:text-lg">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
};

// Admin variant with different styling
export const AdminPageHeader = ({
  title,
  subtitle,
  description,
  actions,
  className,
}: PageHeaderProps) => {
  return (
    <div className={cn("mb-6 border-b pb-4 md:mb-8 md:pb-6", className)}>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          {subtitle && (
            <p className="text-sm font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground md:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
};
