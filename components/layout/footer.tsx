"use client";

import { useTranslations } from "next-intl";
import { Calculator, Coffee, ExternalLink, Heart } from "lucide-react";
import { GitHubLogo, LinkedInLogo } from "@/components/ui/brand-icons";
import { Link } from "@/i18n/navigation";
import { getVisibleCalculatorCategories } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const t = useTranslations("footer");
  const siteT = useTranslations("site");
  const tCategories = useTranslations("calculatorCategories");
  const tNav = useTranslations("nav");
  const visibleCategories = getVisibleCalculatorCategories();

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Description */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 transition-colors">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold tracking-tight">{siteT("name")}</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t("description")}</p>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/saulodefaria/calculaderia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                title={tNav("viewOnGitHub")}>
                <GitHubLogo className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/saulodefaria/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                title="LinkedIn">
                <LinkedInLogo className="h-4 w-4" />
              </a>
              <Link
                href="/apoiar"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/30 hover:bg-amber-200 dark:hover:bg-amber-950/50 transition-colors text-amber-600"
                title={tNav("support")}>
                <Coffee className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Calculators - Available */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">{t("calculators")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/calculadoras"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1">
                  {tNav("allCalculators")}
                </Link>
              </li>
              {visibleCategories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={category.href}
                    className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1">
                    {tCategories(`${category.id}.title`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support & Resources */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">{t("resources")}</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="https://github.com/saulodefaria/calculaderia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
                  {t("sourceCode")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/saulodefaria/calculaderia/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
                  {t("reportBug")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/saulodefaria/calculaderia/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5">
                  {t("suggestFeature")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
            </ul>

            {/* Support CTA */}
            <div className="mt-6 p-4 rounded-lg bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/30">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-2">{t("likeProject")}</p>
              <Link
                href="/apoiar"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                <Coffee className="h-4 w-4" />
                {t("buyMeCoffee")}
              </Link>
            </div>
          </div>

          {/* Institutional */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-foreground">{t("institutional")}</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/sobre" className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/contato"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                  {t("contact")}
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href="/termos" className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link
                  href="/aviso-legal"
                  className="text-sm text-muted-foreground hover:text-emerald-600 transition-colors">
                  {t("disclaimer")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-border/40">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              © {currentYear} {siteT("name")}. {t("copyright")}
            </p>
            <p className="flex items-center gap-1">
              {t("madeWith")} <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> {t("inBrazil")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
