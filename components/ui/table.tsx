import * as React from "react";
import { clsx } from "clsx";

export const Table = ({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table className={clsx("w-full border-collapse text-sm", className)} {...props} />
);

export const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={clsx("bg-slate-900/60", className)} {...props} />
);

export const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={clsx(className)} {...props} />
);

export const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={clsx(
      "border-b border-slate-800 last:border-0 hover:bg-slate-900/40",
      className
    )}
    {...props}
  />
);

export const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={clsx("px-3 py-2 text-left font-medium text-slate-300", className)}
    {...props}
  />
);

export const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={clsx("px-3 py-2 align-middle text-slate-100", className)}
    {...props}
  />
);
