import { clsx } from "clsx";

export function Badge({
  children,
  className
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] uppercase tracking-wide text-slate-300",
        className
      )}
    >
      {children}
    </span>
  );
}
