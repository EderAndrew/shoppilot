const MONEY_SCALE = 100;
const MAX_MONEY_CENTS = 999_999_999_999;

export type MoneyInput = Money | number | string;

function parseMoneyCents(value: MoneyInput): number {
  if (value instanceof Money) return value.cents;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RangeError("Money must be a finite number.");
    }

    return Math.round(value * MONEY_SCALE);
  }

  const normalized = value.trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) {
    throw new RangeError("Money must use up to two decimal places.");
  }

  const sign = normalized.startsWith("-") ? -1 : 1;
  const [wholePart, decimalPart = ""] = normalized.replace("-", "").split(".");
  const paddedDecimal = decimalPart.padEnd(2, "0");

  return sign * (Number(wholePart) * MONEY_SCALE + Number(paddedDecimal));
}

export class Money {
  readonly cents: number;

  private constructor(cents: number) {
    if (!Number.isInteger(cents)) {
      throw new RangeError("Money cents must be an integer.");
    }

    if (Math.abs(cents) > MAX_MONEY_CENTS) {
      throw new RangeError("Money exceeds the supported numeric range.");
    }

    this.cents = cents;
  }

  static from(value: MoneyInput): Money {
    return new Money(parseMoneyCents(value));
  }

  static zero(): Money {
    return new Money(0);
  }

  static positive(value: MoneyInput): Money {
    const money = Money.from(value);
    if (money.cents <= 0) {
      throw new RangeError("Money must be greater than zero.");
    }

    return money;
  }

  static nonNegative(value: MoneyInput): Money {
    const money = Money.from(value);
    if (money.cents < 0) {
      throw new RangeError("Money cannot be negative.");
    }

    return money;
  }

  add(other: MoneyInput): Money {
    return new Money(this.cents + Money.from(other).cents);
  }

  subtract(other: MoneyInput): Money {
    return new Money(this.cents - Money.from(other).cents);
  }

  multiply(multiplier: number): Money {
    if (!Number.isFinite(multiplier)) {
      throw new RangeError("Money multiplier must be finite.");
    }

    return new Money(Math.round(this.cents * multiplier));
  }

  isGreaterThan(other: MoneyInput): boolean {
    return this.cents > Money.from(other).cents;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  toNumber(): number {
    return this.cents / MONEY_SCALE;
  }

  toDecimalString(): string {
    const sign = this.cents < 0 ? "-" : "";
    const absoluteCents = Math.abs(this.cents);
    const whole = Math.floor(absoluteCents / MONEY_SCALE);
    const decimal = String(absoluteCents % MONEY_SCALE).padStart(2, "0");

    return `${sign}${whole}.${decimal}`;
  }

  toJSON(): string {
    return this.toDecimalString();
  }
}
