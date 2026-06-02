"use client";

import { Fragment, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";
import { Menu, Calculator, ChevronDown, Globe, Coffee, Bookmark, CircleUser, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GitHubLogo } from "@/components/ui/brand-icons";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useRouter, usePathname } from "@/i18n/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { getPrimaryCalculatorsByCategory, getVisibleCalculatorCategories } from "@/lib/constants";

const languages = [
  { code: "pt-br", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
];

function UserAvatar({ src }: { src?: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return <CircleUser className="h-5 w-5" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className="h-5 w-5 rounded-full bg-muted object-cover"
      onError={() => setFailedSrc(src)}
    />
  );
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");
  const siteT = useTranslations("site");
  const tCalculators = useTranslations("calculators");
  const tCategories = useTranslations("calculatorCategories");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const visibleCategories = getVisibleCalculatorCategories();
  const user = session?.user;

  const handleLocaleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleSignOut = () => {
    void signOut({ redirectTo: getLocalizedPathname(locale, "/") });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 transition-colors">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold tracking-tight hidden sm:inline-block">{siteT("name")}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Calculators Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
                {t("calculadoras")}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[72vh] w-80 overflow-y-auto">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {t("availableTools")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/calculadoras" className="flex cursor-pointer items-center gap-2">
                  <Calculator className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium">{t("allCalculators")}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {visibleCategories.map((category, index) => {
                const categoryCalculators = getPrimaryCalculatorsByCategory(category.id);
                if (categoryCalculators.length === 0) return null;

                return (
                  <Fragment key={category.id}>
                    {index > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                      {tCategories(`${category.id}.title`)}
                    </DropdownMenuLabel>
                    {categoryCalculators.map((calc) => {
                      const Icon = calc.icon;
                      const calcTitle = tCalculators(`${calc.id}.title`);
                      const displayTitle = locale === "pt-br" ? calcTitle.replace(/^Calculadora de\s+/, "") : calcTitle;
                      return (
                        <DropdownMenuItem key={calc.id} asChild>
                          <Link href={calc.href} className="flex cursor-pointer items-center gap-2">
                            <Icon className="h-4 w-4 text-emerald-600" />
                            <div className="flex flex-col">
                              <span className="text-sm">{displayTitle}</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Guides Link */}
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/guias">
              <span className="text-sm font-medium">{t("guias")}</span>
            </Link>
          </Button>

          {/* Favorites Link */}
          <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Link href="/favoritos">
              <Bookmark className="h-4 w-4" />
              <span className="text-sm font-medium">{t("favoritos")}</span>
            </Link>
          </Button>

          {status !== "loading" ? (
            user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <UserAvatar src={user.image} />
                    <span className="hidden max-w-28 truncate text-sm lg:inline">
                      {user.name ?? user.email ?? t("account")}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="min-w-0">
                    <span className="block truncate text-sm font-medium">{user.name ?? t("account")}</span>
                    {user.email ? (
                      <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
                    ) : null}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("signOut")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Link href="/entrar">
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm font-medium">{t("signIn")}</span>
                </Link>
              </Button>
            )
          ) : null}

          <div className="h-4 w-px bg-border mx-2" />


          {/* Language Switcher (Skeleton) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <Globe className="h-4 w-4" />
                <span className="text-sm">{languages.find((l) => l.code === locale)?.flag || "🌐"}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                {t("language")}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLocaleChange(lang.code)}
                  className={`cursor-pointer ${locale === lang.code ? "bg-accent" : ""}`}>
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* GitHub Link */}
          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-foreground">
            <a
              href="https://github.com/saulodefaria/calculaderia"
              target="_blank"
              rel="noopener noreferrer"
              title={t("viewOnGitHub")}>
              <GitHubLogo className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>

          {/* Support Link */}
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-1.5 text-amber-600 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20">
            <Link href="/apoiar">
              <Coffee className="h-4 w-4" />
              <span className="text-sm font-medium">{t("support")}</span>
            </Link>
          </Button>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-1 md:hidden">
          {/* Mobile Language */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.code}
                  onClick={() => handleLocaleChange(lang.code)}
                  className={`cursor-pointer ${locale === lang.code ? "bg-accent" : ""}`}>
                  <span className="mr-2">{lang.flag}</span>
                  {lang.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("openMenu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <SheetTitle className="flex items-center gap-2 p-6 pb-4 border-b">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600">
                  <Calculator className="h-4 w-4 text-white" />
                </div>
                <span className="font-semibold">{siteT("name")}</span>
              </SheetTitle>

              <div className="flex flex-col h-full">
                {/* Calculators Section */}
                <div className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {t("calculadoras")}
                  </p>
                  <nav className="flex flex-col gap-1">
                    <Link
                      href="/calculadoras"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      <Calculator className="h-4 w-4 text-emerald-600" />
                      {t("allCalculators")}
                    </Link>
                    {visibleCategories.map((category) => {
                      const categoryCalculators = getPrimaryCalculatorsByCategory(category.id);
                      if (categoryCalculators.length === 0) return null;

                      return (
                        <div key={category.id} className="pt-3">
                          <p className="px-3 pb-1 text-xs font-medium text-muted-foreground">
                            {tCategories(`${category.id}.title`)}
                          </p>
                          <div className="flex flex-col gap-1">
                            {categoryCalculators.map((calc) => {
                              const Icon = calc.icon;
                              return (
                                <Link
                                  key={calc.id}
                                  href={calc.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                                  <Icon className="h-4 w-4 text-emerald-600" />
                                  {tCalculators(`${calc.id}.title`)}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </nav>
                </div>

                {/* External Links Section */}
                <div className="mt-auto p-4 border-t bg-muted/30">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {t("links")}
                  </p>
                  <div className="flex flex-col gap-1">
                    <Link
                      href="/guias"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      {t("guias")}
                    </Link>
                    <Link
                      href="/favoritos"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      <Bookmark className="h-4 w-4 text-emerald-600" />
                      {t("favoritos")}
                    </Link>
                    {status !== "loading" ? (
                      user ? (
                        <button
                          type="button"
                          onClick={() => {
                            setMobileOpen(false);
                            handleSignOut();
                          }}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-accent">
                          <LogOut className="h-4 w-4" />
                          {t("signOut")}
                        </button>
                      ) : (
                        <Link
                          href="/entrar"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                          <LogIn className="h-4 w-4 text-emerald-600" />
                          {t("signIn")}
                        </Link>
                      )
                    ) : null}
                    <a
                      href="https://github.com/saulodefaria/calculaderia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                      <GitHubLogo className="h-4 w-4" />
                      {t("viewOnGitHub")}
                    </a>
                    <Link
                      href="/apoiar"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/20">
                      <Coffee className="h-4 w-4" />
                      {t("support")}
                    </Link>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
