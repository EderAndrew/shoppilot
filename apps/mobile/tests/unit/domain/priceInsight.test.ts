import { describe, expect, it } from "vitest";

import { calculatePriceInsight } from "../../../src/domain/services/priceInsight";

describe("calculatePriceInsight", () => {
  it("returns no history when there is no previous price", () => {
    expect(calculatePriceInsight(10, null)).toEqual({
      absoluteDifference: null,
      currentPrice: 10,
      percentageDifference: null,
      previousPrice: null,
      status: "no_history",
    });
  });

  it("detects a more expensive current price", () => {
    expect(calculatePriceInsight(12, 10)).toMatchObject({
      absoluteDifference: 2,
      percentageDifference: 20,
      status: "more_expensive",
    });
  });

  it("detects a cheaper current price", () => {
    expect(calculatePriceInsight(8, 10)).toMatchObject({
      absoluteDifference: -2,
      percentageDifference: -20,
      status: "cheaper",
    });
  });

  it("detects unchanged prices", () => {
    expect(calculatePriceInsight(10, 10)).toMatchObject({
      absoluteDifference: 0,
      percentageDifference: 0,
      status: "unchanged",
    });
  });
});
