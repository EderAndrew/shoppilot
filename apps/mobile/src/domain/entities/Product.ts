export type ProductProps = {
  id: string;
  userId: string;
  name: string;
  brand?: string | null;
  barcode?: string | null;
  unit?: string | null;
  createdAt: string;
  updatedAt: string;
};

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export class Product {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly brand: string | null;
  readonly barcode: string | null;
  readonly unit: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: ProductProps) {
    const name = props.name.trim();
    if (!name) throw new RangeError("Product name is required.");

    this.id = props.id;
    this.userId = props.userId;
    this.name = name;
    this.brand = normalizeOptional(props.brand);
    this.barcode = normalizeOptional(props.barcode);
    this.unit = normalizeOptional(props.unit);
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  toRecord() {
    return {
      barcode: this.barcode,
      brand: this.brand,
      createdAt: this.createdAt,
      id: this.id,
      name: this.name,
      unit: this.unit,
      updatedAt: this.updatedAt,
      userId: this.userId,
    };
  }
}
