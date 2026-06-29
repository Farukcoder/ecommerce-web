"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

export default function PaymentCancelledPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-xl mx-auto text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100 text-orange-700">
          <AlertTriangle className="h-12 w-12" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          {t("payment_cancelled_title")}
        </h1>

        <p className="text-muted-foreground mb-6">
          {t("payment_cancelled_message")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/shop">{t("continue_shopping")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/checkout">{t("try_again")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
