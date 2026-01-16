import * as React from "react";
import { clsx } from "clsx";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md";
}

type Variant = NonNullable<ButtonProps["variant"]>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-xl text-sm font-medium transition disabled:pointer-events-none disabled:opacity-50";
    const variants: Record<Variant, string> = {
      default: "bg-accent text-slate-900 hover:bg-sky-500",
      outline: "border border-border text-slate-100 hover:bg-slate-900/40"
    };
    const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-8 px-3",
      md: "h-9 px-4"
    };
    const v: Variant = variant ?? "default";

    return (
      <button
        ref={ref}
        className={clsx(base, variants[v], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
