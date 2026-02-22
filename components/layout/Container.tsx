import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide" | "full";
}

export const Container = ({
  children,
  className,
  size = "default",
}: ContainerProps) => {
  return (
    <div
      className={cn(
        "mx-auto px-4 md:px-6 lg:px-8",
        {
          container: size === "default",
          "max-w-4xl": size === "narrow",
          "max-w-7xl": size === "wide",
          "max-w-full": size === "full",
        },
        className
      )}
    >
      {children}
    </div>
  );
};
