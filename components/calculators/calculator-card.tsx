import { ToolCard } from "@/components/tools/tool-card";

interface CalculatorCardProps {
  calculatorId: string;
}

export function CalculatorCard({ calculatorId }: CalculatorCardProps) {
  return <ToolCard toolId={calculatorId} />;
}
