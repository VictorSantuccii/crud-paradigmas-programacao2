import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  children: ReactNode;
  hoverEffect?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary font-label-md shadow-md hover:shadow-lg active:scale-95",
  outline:
    "bg-surface text-primary border-2 border-primary hover:bg-primary/5 active:scale-95",
  ghost:
    "text-on-surface-variant hover:text-primary hover:bg-surface-container rounded-full",
};

export function Button({
  variant = "primary",
  className,
  children,
  hoverEffect = variant === "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 transition-all",
        variantClasses[variant],
        hoverEffect && "btn-hover-effect",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
