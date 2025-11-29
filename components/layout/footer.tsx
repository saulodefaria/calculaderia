import { Calculator } from "lucide-react";
import { siteConfig } from "@/lib/constants";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calculator className="h-5 w-5" />
            <span className="text-sm font-medium">{siteConfig.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {currentYear} - Ferramenta gratuita para cálculos financeiros
          </p>
        </div>
      </div>
    </footer>
  );
}
