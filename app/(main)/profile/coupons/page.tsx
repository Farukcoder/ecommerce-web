"use client"

import { useEffect, useState } from "react"
import { Gift, Copy, Award, Check, Ticket, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchCustomerOrders, type CustomerOrderSummary } from "@/lib/customer-checkout"
import { useCurrency } from "@/lib/currency"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface Coupon {
  code: string
  discount: string
  description: string
  expiryDate: string
  minSpend: number
  type: "percentage" | "fixed" | "free_shipping"
}

const COUPONS: Coupon[] = [
  { code: "WELCOME10", discount: "10% OFF", description: "Get 10% discount on your first order over BDT 1,000.", expiryDate: "Dec 31, 2026", minSpend: 1000, type: "percentage" },
  { code: "FREESHIP", discount: "Free Shipping", description: "Enjoy free shipping on any orders over BDT 2,000.", expiryDate: "Aug 31, 2026", minSpend: 2000, type: "free_shipping" },
  { code: "SUMMER500", discount: "৳500 OFF", description: "Flat BDT 500 off on total cart value over BDT 5,000.", expiryDate: "Jun 30, 2026", minSpend: 5000, type: "fixed" },
]

export default function CouponsPage() {
  const { formatPrice } = useCurrency()
  const { t } = useTranslation()
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCustomerOrders(1, 20)
      .then((res) => setOrders(res.data))
      .catch((err) => console.error("Failed to load orders for points math:", err))
      .finally(() => setIsLoading(false))
  }, [])

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success(`Coupon code ${code} copied!`, {
      description: "Paste it at the checkout to redeem your discount.",
      icon: <Check className="h-4 w-4 text-green-500" />,
    })
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const completedOrders = orders.filter((o) => o.status.toLowerCase() === "delivered")
  const totalSpent = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const rewardPoints = Math.floor(totalSpent / 10)
  const pointValueInBdt = rewardPoints * 0.5

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Rewards Overview Widget */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Award className="h-5 w-5" />
            <h2 className="text-xl font-bold">{t("coupons_rewards_title")}</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">{t("reward_points_desc")}</p>
        </div>
        <div className="bg-muted/50 border border-border/50 rounded-xl p-5 flex items-center gap-4 min-w-[200px] justify-between">
          <div>
            <span className="text-2xs text-muted-foreground uppercase font-bold tracking-wider block">{t("points_balance")}</span>
            <span className="text-3xl font-extrabold text-foreground">{isLoading ? "..." : rewardPoints}</span>
            <span className="text-xs text-muted-foreground block mt-1">
              ≈ {isLoading ? "..." : formatPrice(pointValueInBdt)} {t("cashback_label")}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <Gift className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Coupons Section */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Ticket className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{t("available_coupons_title")}</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {COUPONS.map((coupon) => (
            <div key={coupon.code} className="border border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-5 flex flex-col justify-between gap-4 bg-muted/20 relative overflow-hidden">
              <div className="absolute top-1/2 -left-3 h-6 w-6 bg-card border-r border-border rounded-full -translate-y-1/2" />
              <div className="absolute top-1/2 -right-3 h-6 w-6 bg-card border-l border-border rounded-full -translate-y-1/2" />
              <div className="pl-4 pr-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="default" className="font-semibold">{coupon.discount}</Badge>
                  <span className="text-2xs text-muted-foreground">{t("expires_on")} {coupon.expiryDate}</span>
                </div>
                <h4 className="font-bold text-base tracking-wide font-mono text-primary">{coupon.code}</h4>
                <p className="text-xs text-muted-foreground mt-1">{coupon.description}</p>
              </div>
              <div className="pl-4 pr-4 pt-3 border-t border-border/50 flex items-center justify-between">
                <span className="text-2xs text-muted-foreground">{t("min_spend")} {formatPrice(coupon.minSpend)}</span>
                <Button variant="outline" size="sm" onClick={() => handleCopyCode(coupon.code)} className="h-8 gap-1">
                  {copiedCode === coupon.code ? (
                    <><Check className="h-3 w-3 text-green-500" /> {t("copied")}</>
                  ) : (
                    <><Copy className="h-3 w-3" /> {t("copy")}</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Points History Ledger */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-lg">{t("points_history_title")}</h3>
        </div>
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        ) : completedOrders.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">{t("points_history_empty")}</div>
        ) : (
          <div className="space-y-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-2">{t("details_col")}</th>
                  <th className="py-2">{t("date_col")}</th>
                  <th className="py-2 text-right">{t("points_earned_col")}</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => {
                  const pts = Math.floor(Number(order.total_amount) / 10)
                  return (
                    <tr key={order.id} className="border-b border-border/50 text-foreground">
                      <td className="py-3">{t("points_earned_on_order")} {order.order_number}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(order.created_at))}
                      </td>
                      <td className="py-3 text-right text-green-600 dark:text-green-400 font-bold">+{pts}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
