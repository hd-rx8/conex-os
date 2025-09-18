import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { useCurrency } from '@/context/CurrencyContext'; // Import useCurrency hook

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper to format currency using the global context
export const formatCurrency = (value: number) => {
  // This function should ideally be used within a component that has access to CurrencyContext
  // For direct use in files without context, we'll need to pass the currency explicitly or use a default.
  // However, for consistency, we'll assume it's called from a component or hook that has access.
  // For now, we'll return a placeholder or a default format if not in context.
  // The actual implementation will be in useCurrency hook.
  // This utility will be primarily for `cn` and other non-React specific helpers.
  // The `useCurrency` hook's `formatCurrency` will be used directly in components.
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};