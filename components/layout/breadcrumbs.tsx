import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils/index";

export type BreadcrumbLink = {
  label: string;
  href?: string;
};

interface BreadcrumbsProps {
  items: BreadcrumbLink[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("mb-6 text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              {index > 0 ? <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              {item.href && !isLast ? (
                <Link href={item.href} className="truncate transition-colors hover:text-emerald-600">
                  {item.label}
                </Link>
              ) : (
                <span className={cn("truncate", isLast && "font-medium text-foreground")}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
