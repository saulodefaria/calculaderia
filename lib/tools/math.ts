export function calculatePercentageOf(percentage: number, base: number): number {
  return (percentage / 100) * base;
}

export function calculatePercentageChange(from: number, to: number): number | null {
  if (from === 0) return null;
  return ((to - from) / Math.abs(from)) * 100;
}

export function calculatePercentageApplied(base: number, percentage: number, operation: "increase" | "decrease") {
  const delta = calculatePercentageOf(percentage, base);
  return operation === "increase" ? base + delta : base - delta;
}

export function solveRuleOfThree(a: number, b: number, c: number): number | null {
  if (a === 0) return null;
  return (b * c) / a;
}
