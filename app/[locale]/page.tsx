"use client";

import { useTranslations } from "next-intl";
import { calculators } from "@/lib/constants";
import { CalculatorCard } from "@/components/calculators/calculator-card";

export default function Home() {
  const t = useTranslations("home");
  const availableCalculators = calculators.filter((c) => c.available);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{t("title")}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{t("description")}</p>
      </section>

      {/* Calculators Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">{t("availableCalculators")}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {availableCalculators.map((calculator) => (
            <CalculatorCard key={calculator.id} calculator={calculator} />
          ))}
        </div>
      </section>
    </div>
  );
}
