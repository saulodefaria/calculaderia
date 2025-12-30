import Link from "next/link";
import { Calculator, Github, Coffee, Heart, ExternalLink } from "lucide-react";
import { calculators, siteConfig } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const availableCalculators = calculators.filter((c) => c.available);

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 transition-colors">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight">{siteConfig.name}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Ferramentas gratuitas e de código aberto para cálculos financeiros. Tome decisões mais informadas sobre
              financiamento, consórcio e investimentos.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/saulodefaria/calculadoras-financeiras"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                title="GitHub">
                <Github className="h-4 w-4" />
              </a>
              <Link
                href="/apoiar"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/30 hover:bg-amber-200 dark:hover:bg-amber-950/50 transition-colors text-amber-600"
                title="Apoiar">
                <Coffee className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Calculators - Available */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">Calculadoras</h3>
            <ul className="space-y-2.5">
              {availableCalculators.map((calc) => (
                <li key={calc.id}>
                  <Link
                    href={calc.href}
                    className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1">
                    {calc.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Resources */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">Recursos</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/saulodefaria/calculadoras-financeiras"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
                  Código fonte
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/saulodefaria/calculadoras-financeiras/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
                  Reportar bug
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/saulodefaria/calculadoras-financeiras/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
                  Sugerir funcionalidade
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>

            {/* Support CTA */}
            <div className="mt-6 p-4 rounded-lg bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">Gostou do projeto?</p>
              <Link
                href="/apoiar"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                <Coffee className="h-4 w-4" />
                Me pague um café
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} {siteConfig.name}. Ferramenta gratuita e de código aberto.
            </p>
            <p className="flex items-center gap-1">
              Feito com <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> no Brasil
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
