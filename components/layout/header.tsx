"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { calculators, siteConfig } from "@/lib/constants";

export function Header() {
  const [open, setOpen] = useState(false);
  const availableCalculators = calculators.filter((c) => c.available);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-600" />
          <span className="font-semibold tracking-tight text-lg">{siteConfig.name}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {availableCalculators.map((calc) => (
            <Link
              key={calc.id}
              href={calc.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {calc.title.replace("Calculadora de ", "")}
            </Link>
          ))}
        </nav>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <SheetTitle className="flex items-center gap-2 mb-6">
              <Calculator className="h-5 w-5 text-emerald-600" />
              <span>Menu</span>
            </SheetTitle>
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="text-sm font-medium transition-colors hover:text-emerald-600">
                Início
              </Link>
              {availableCalculators.map((calc) => (
                <Link
                  key={calc.id}
                  href={calc.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                  {calc.title}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
