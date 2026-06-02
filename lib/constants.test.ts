import { describe, expect, test } from "vitest";
import {
  calculatorCategories,
  calculators,
  getCalculatorCategoryById,
  getCalculatorPrimaryCategory,
  getVisibleCalculatorCategories,
} from "./constants";

describe("calculator catalog", () => {
  test("does not define duplicate calculator or category slugs", () => {
    const calculatorIds = calculators.map((calculator) => calculator.id);
    const categorySlugs = calculatorCategories.map((category) => category.slug);

    expect(new Set(calculatorIds).size).toBe(calculatorIds.length);
    expect(new Set(categorySlugs).size).toBe(categorySlugs.length);
  });

  test("assigns every calculator only to known categories", () => {
    for (const calculator of calculators) {
      expect(calculator.categoryIds).toContain(calculator.primaryCategoryId);

      for (const categoryId of calculator.categoryIds) {
        expect(getCalculatorCategoryById(categoryId)).toBeDefined();
      }
    }
  });

  test("assigns every available calculator to a visible primary category", () => {
    const visibleCategoryIds = new Set(getVisibleCalculatorCategories().map((category) => category.id));

    for (const calculator of calculators.filter((item) => item.available)) {
      expect(visibleCategoryIds.has(getCalculatorPrimaryCategory(calculator.id).id)).toBe(true);
    }
  });
});
