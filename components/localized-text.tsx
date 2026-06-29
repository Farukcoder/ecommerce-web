"use client"

import { useTranslation } from "@/lib/i18n"

interface LocalizedTextProps extends React.HTMLAttributes<HTMLElement> {
  en: string
  bn: string
  as?: keyof JSX.IntrinsicElements
}

export function LocalizedText({ en, bn, as = "span", className, ...props }: LocalizedTextProps) {
  const { locale } = useTranslation()
  const Tag = as

  return (
    <Tag className={className} suppressHydrationWarning {...props}>
      {locale === "bn" ? bn : en}
    </Tag>
  )
}
