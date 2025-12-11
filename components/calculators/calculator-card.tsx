import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/index";
import type { CalculatorDefinition } from "@/lib/constants";

interface CalculatorCardProps {
  calculator: CalculatorDefinition;
}

export function CalculatorCard({ calculator }: CalculatorCardProps) {
  const Icon = calculator.icon;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-lg",
        !calculator.available && "opacity-60"
      )}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">{calculator.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <CardDescription className="text-sm leading-relaxed">{calculator.description}</CardDescription>
        {calculator.available ? (
          <Button asChild className="w-full group-hover:bg-emerald-600">
            <Link href={calculator.href}>
              Acessar calculadora
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        ) : (
          <Button disabled className="w-full">
            Em breve
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
