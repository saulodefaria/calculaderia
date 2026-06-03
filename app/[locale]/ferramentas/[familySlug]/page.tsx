import { notFound, redirect } from "next/navigation";
import { getLocalizedPathname } from "@/i18n/paths";
import { getToolFamilyBySlug } from "@/lib/constants";

export default async function FerramentasFamilyRedirect({
  params,
}: {
  params: Promise<{ locale: string; familySlug: string }>;
}) {
  const { locale, familySlug } = await params;
  const family = getToolFamilyBySlug(familySlug);

  if (!family) {
    notFound();
  }

  redirect(getLocalizedPathname(locale, family.href));
}
