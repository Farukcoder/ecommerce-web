"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, Package } from "lucide-react"
import { useCurrency } from "@/lib/currency"
import { fetchCustomerOrders, type CustomerOrderSummary } from "@/lib/customer-checkout"
import { useTranslation } from "@/lib/i18n"

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
}

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  unpaid: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  refunded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function OrdersPage() {
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const { t } = useTranslation()
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isActive = true

    setIsLoading(true)
    fetchCustomerOrders(1, 20)
      .then((response) => {
        if (isActive) {
          setOrders(response.data)
          setError("")
        }
      })
      .catch((caught) => {
        if (isActive) {
          setOrders([])
          setError(caught instanceof Error ? caught.message : "Unable to load order history.")
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const formatOrderDate = (value: string) =>
    new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(value))

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Package className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("order_history_title")}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive py-4">{error}</p>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">{t("no_orders_yet")}</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("no_orders_yet_desc")}
          </p>
          <Button className="mt-6" asChild>
            <Link href="/shop">{t("start_shopping")}</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border border-border rounded-xl overflow-hidden shadow-sm hover:border-border/80 transition-colors">
              <div className="bg-muted/50 px-4 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-border/50">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t("order_label")} </span>
                    <span className="font-semibold text-primary">{order.order_number}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("placed_label")} </span>
                    <span className="font-medium">{formatOrderDate(order.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("total_label")} </span>
                    <span className="font-semibold">{formatPrice(order.total_amount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t("items_label")} </span>
                    <span>{order.items_count}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[order.status.toLowerCase()] ?? "bg-slate-100 text-slate-800"} variant="secondary">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                  <Badge
                    className={paymentStatusColors[order.payment_status.toLowerCase()] ?? "bg-slate-100 text-slate-800"}
                    variant="secondary"
                  >
                    {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="p-4 flex flex-wrap items-center justify-between gap-4 bg-card">
                <div className="text-sm text-muted-foreground">
                  {t("payment_method_label")} <span className="font-medium text-foreground uppercase">{order.payment_method}</span>
                </div>
                <div className="flex justify-end gap-3 w-full sm:w-auto">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/order-tracking?order_number=${order.order_number}`}>
                      {t("track_order")}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/order-tracking?order_number=${order.order_number}`} className="flex items-center">
                      {t("view_details")} <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
