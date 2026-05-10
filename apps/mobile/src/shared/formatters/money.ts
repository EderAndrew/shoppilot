const defaultCurrency = "BRL";
const defaultLocale = "pt-BR";

export type FormatMoneyOptions = {
  currency?: string;
  locale?: string;
};

export function formatMoney(amount: number, options: FormatMoneyOptions = {}): string {
  return new Intl.NumberFormat(options.locale ?? defaultLocale, {
    currency: options.currency ?? defaultCurrency,
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: "currency",
  }).format(amount);
}

export function formatPercentage(value: number, locale = defaultLocale): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
    style: "percent",
  }).format(value / 100);
}

export function formatSignedMoneyDifference(
  amount: number,
  options: FormatMoneyOptions = {},
): string {
  if (amount === 0) return formatMoney(0, options);
  return `${amount > 0 ? "+" : "-"}${formatMoney(Math.abs(amount), options)}`;
}
