import { Money, type MoneyInput } from "../value-objects/Money";
import { Quantity, type QuantityInput } from "../value-objects/Quantity";

export type ShoppingListItemProps = {
  id: string;
  userId: string;
  shoppingListId: string;
  productId: string;
  quantity: QuantityInput;
  unitPrice: MoneyInput;
  totalPrice?: MoneyInput;
  bought?: boolean;
  createdAt: string;
  updatedAt: string;
};

export class ShoppingListItem {
  readonly id: string;
  readonly userId: string;
  readonly shoppingListId: string;
  readonly productId: string;
  readonly quantity: Quantity;
  readonly unitPrice: Money;
  readonly bought: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;

  constructor(props: ShoppingListItemProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.shoppingListId = props.shoppingListId;
    this.productId = props.productId;
    this.quantity = Quantity.from(props.quantity);
    this.unitPrice = Money.positive(props.unitPrice);
    this.bought = props.bought ?? false;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    if (props.totalPrice !== undefined) {
      const expected = this.calculateTotalPrice();
      const provided = Money.from(props.totalPrice);

      if (expected.cents !== provided.cents) {
        throw new RangeError("Item total must equal quantity multiplied by unit price.");
      }
    }
  }

  calculateTotalPrice(): Money {
    return this.unitPrice.multiply(this.quantity.toNumber());
  }

  withQuantityAndPrice(quantity: QuantityInput, unitPrice: MoneyInput): ShoppingListItem {
    return new ShoppingListItem({
      ...this.toRecord(),
      quantity,
      unitPrice,
      totalPrice: undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  withBought(bought: boolean): ShoppingListItem {
    return new ShoppingListItem({
      ...this.toRecord(),
      bought,
      updatedAt: new Date().toISOString(),
    });
  }

  toRecord() {
    return {
      bought: this.bought,
      createdAt: this.createdAt,
      id: this.id,
      productId: this.productId,
      quantity: this.quantity.toNumber(),
      shoppingListId: this.shoppingListId,
      totalPrice: this.calculateTotalPrice().toNumber(),
      unitPrice: this.unitPrice.toNumber(),
      updatedAt: this.updatedAt,
      userId: this.userId,
    };
  }
}
