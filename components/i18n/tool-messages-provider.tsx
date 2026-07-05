import { NextIntlClientProvider } from "next-intl";
import { getToolClientMessages } from "@/i18n/messages";

interface ToolMessagesProviderProps {
  children: React.ReactNode;
  locale: string;
  toolId: string;
}

export async function ToolMessagesProvider({ children, locale, toolId }: ToolMessagesProviderProps) {
  const messages = await getToolClientMessages(locale, toolId);

  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
