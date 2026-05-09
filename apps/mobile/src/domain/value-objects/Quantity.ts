const QUANTITY_SCALE = 1_000;
const MAX_QUANTITY_UNITS = 999_999_999_999;

export type QuantityInput = Quantity | number | string;

function parseQuantityUnits(value: QuantityInput): number {
  if (value instanceof Quantity) return value.units;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RangeError("Quantity must be a finite number.");
    }

    return Math.round(value * QUANTITY_SCALE);
  }

  const normalized = value.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,3})?$/.test(normalized)) {
    throw new RangeError("Quantity must use up to three decimal places.");
  }

  const [wholePart, decimalPart = ""] = normalized.split(".");
  const paddedDecimal = decimalPart.padEnd(3, "0");

  return Number(wholePart) * QUANTITY_SCALE + Number(paddedDecimal);
}

export class Quantity {
  readonly units: number;

  private constructor(units: number) {
    if (!Number.isInteger(units)) {
      throw new RangeError("Quantity units must be an integer.");
    }

    if (units <= 0) {
      throw new RangeError("Quantity must be greater than zero.");
    }

    if (units > MAX_QUANTITY_UNITS) {
      throw new RangeError("Quantity exceeds the supported numeric range.");
    }

    this.units = units;
  }

  static from(value: QuantityInput): Quantity {
    return new Quantity(parseQuantityUnits(value));
  }

  toNumber(): number {
    return this.units / QUANTITY_SCALE;
  }

  toDecimalString(): string {
    const whole = Math.floor(this.units / QUANTITY_SCALE);
    const decimal = String(this.units % QUANTITY_SCALE)
      .padStart(3, "0")
      .replace(/0+$/, "");

    return decimal.length > 0 ? `${whole}.${decimal}` : String(whole);
  }

  toJSON(): string {
    return this.toDecimalString();
  }
}
