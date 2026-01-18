// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// склейка классов tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// форматирование размера файла в человекочитаемый вид
export function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (!bytes) return "0 Bytes";

  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = Math.round(bytes / Math.pow(1024, i));

  return `${value} ${sizes[i]}`;
}
