import * as React from "react";
import { cn } from "@/lib/cn";

type Variant = "gold" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const variants: Record<Variant, string> = {
  gold: "btn-gold",
  outline: "btn-outline",
  ghost: "btn-base text-sand-50/80 hover:text-gold-300 px-4 py-2"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "gold", fullWidth, className, ...rest }, ref) => (
    <button
      ref={ref}
      className={cn(variants[variant], fullWidth && "w-full", className)}
      {...rest}
    />
  )
);
Button.displayName = "Button";
