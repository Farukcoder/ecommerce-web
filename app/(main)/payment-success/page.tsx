"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

export default function PaymentSuccessPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get("order_number") ?? ""

  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-xl mx-auto text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle className="h-12 w-12" />
        </div>

        <h1 className="text-3xl font-semibold tracking-tight mb-4">
          {t("payment_success_title")}
        </h1>

        <p className="text-muted-foreground mb-6">
          {t("payment_success_message")}
        </p>

        {orderNumber ? (
          <div className="mb-6 rounded-2xl border border-border bg-background px-5 py-4 text-left shadow-sm">
            <p className="text-sm text-muted-foreground mb-1">{t("order_number")}</p>
            <p className="text-lg font-semibold">{orderNumber}</p>
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground mb-8">
          {t("payment_success_subtitle")}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/shop">{t("continue_shopping")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile/orders">{t("view_orders")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
