import { Money, type MoneyInput } from "../value-objects/Money";

export type PriceHistoryProps = {
  id: string;
  userId: string;
  productId: string;
  shoppingListId: string;
  shoppingListItemId?: string | null;
  price: MoneyInput;
  recordedAt: string;
  createdAt: string;
};

export type RecordPriceHistoryInput = {
  id: string;
  userId: string;
  productId: string;
  shoppingListId: string;
  shoppingListItemId?: string | null;
  price: MoneyInput;
  recordedAt?: string;
};

export class PriceHistory {
  readonly id: string;
  readonly userId: string;
  readonly productId: string;
  readonly shoppingListId: string;
  readonly shoppingListItemId: string | null;
  readonly price: Money;
  readonly recordedAt: string;
  readonly createdAt: string;

  constructor(props: PriceHistoryProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.productId = props.productId;
    this.shoppingListId = props.shoppingListId;
    this.shoppingListItemId = props.shoppingListItemId ?? null;
    this.price = Money.positive(props.price);
    this.recordedAt = props.recordedAt;
    this.createdAt = props.createdAt;
  }

  static record(input: RecordPriceHistoryInput): PriceHistory {
    const recordedAt = input.recordedAt ?? new Date().toISOString();

    return new PriceHistory({
      ...input,
      createdAt: recordedAt,
      recordedAt,
    });
  }

  toRecord() {
    return {
      createdAt: this.createdAt,
      id: this.id,
      price: this.price.toNumber(),
      productId: this.productId,
      recordedAt: this.recordedAt,
      shoppingListId: this.shoppingListId,
      shoppingListItemId: this.shoppingListItemId,
      userId: this.userId,
    };
  }
}
