import { describe, expect, test } from "vitest";
import {
  calculatorCategories,
  calculators,
  getAvailableTools,
  getCalculatorCategoryById,
  getCalculatorPrimaryCategory,
  getToolCategoryById,
  getToolFamilyById,
  getVisibleCalculatorCategories,
  getVisibleToolCategories,
  getVisibleToolFamilies,
  toolCategories,
  toolFamilies,
  tools,
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

describe("tool catalog", () => {
  test("does not define duplicate tool, family, category, or href values", () => {
    const toolIds = tools.map((tool) => tool.id);
    const toolHrefs = tools.map((tool) => tool.href);
    const familySlugs = toolFamilies.map((family) => family.slug);
    const categoryIds = toolCategories.map((category) => category.id);
    const categoryHrefs = toolCategories.map((category) => category.href);

    expect(new Set(toolIds).size).toBe(toolIds.length);
    expect(new Set(toolHrefs).size).toBe(toolHrefs.length);
    expect(new Set(familySlugs).size).toBe(familySlugs.length);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    expect(new Set(categoryHrefs).size).toBe(categoryHrefs.length);
  });

  test("assigns every tool to known families and categories", () => {
    for (const tool of tools) {
      expect(getToolFamilyById(tool.familyId)).toBeDefined();
      expect(tool.categoryIds).toContain(tool.primaryCategoryId);

      for (const categoryId of tool.categoryIds) {
        const category = getToolCategoryById(categoryId);
        expect(category).toBeDefined();
        expect(category?.familyId).toBe(tool.familyId);
      }
    }
  });

  test("assigns every available tool to a visible family and primary category", () => {
    const visibleFamilyIds = new Set(getVisibleToolFamilies().map((family) => family.id));
    const visibleCategoryIds = new Set(getVisibleToolCategories().map((category) => category.id));

    for (const tool of getAvailableTools()) {
      expect(visibleFamilyIds.has(tool.familyId)).toBe(true);
      expect(visibleCategoryIds.has(tool.primaryCategoryId)).toBe(true);
    }
  });
});
