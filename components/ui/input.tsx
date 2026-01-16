import * as React from "react";
import { clsx } from "clsx";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={clsx(
      "h-9 w-full rounded-xl border border-border bg-slate-900/70 px-3 text-sm outline-none ring-0 focus:border-accent",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";
