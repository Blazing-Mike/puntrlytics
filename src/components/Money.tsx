"use client";

import { moneyParts } from "@/lib/core";

type MoneyProps = {
  value: number;
  currency: string;
  signed?: boolean;
  /** Classes for the currency symbol; defaults to text-base so it reads smaller than the amount. */
  symbolClassName?: string;
  className?: string;
};

/**
 * Money figure with the currency symbol rendered separately at a smaller size
 * (text-base by default) than the amount, so big figures read like "₦1,234"
 * with a subtle symbol. Font, weight and color are inherited from the parent.
 */
export function Money({
  value,
  currency,
  signed = false,
  symbolClassName = "text-base",
  className,
}: MoneyProps) {
  const { sign, symbol, amount } = moneyParts(value, currency, signed);
  return (
    <span className={className}>
      <span>{sign}</span>
      <span className={symbolClassName}>{symbol}</span>
      <span>{amount}</span>
    </span>
  );
}
