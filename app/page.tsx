import type { Metadata } from "next";
import { calculators, siteConfig } from "@/lib/constants";
import { CalculatorCard } from "@/components/calculators/calculator-card";

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
};

export default function Home() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">{siteConfig.name}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{siteConfig.description}</p>
      </section>

      {/* Calculators Grid */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Calculadoras Disponíveis</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {calculators.map((calculator) => (
            <CalculatorCard key={calculator.id} calculator={calculator} />
          ))}
        </div>
      </section>
    </div>
  );
}
