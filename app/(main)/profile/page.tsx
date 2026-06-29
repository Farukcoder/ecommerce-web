"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Heart, Award, ArrowRight, Package, Truck, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "@/lib/currency"
import {
  fetchCustomerOrders,
  fetchCustomerOrderTracking,
  type CustomerOrderSummary,
  type CustomerOrderTracking
} from "@/lib/customer-checkout"
import { useStore } from "@/lib/store-context"
import { fetchProducts } from "@/lib/api"
import type { Product } from "@/lib/store-context"
import { ProductCard } from "@/components/product-card"
import { useTranslation } from "@/lib/i18n"

const statusColors: Record<string, string> = {
  delivered: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  shipped: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  processing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  pending: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400",
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const { wishlist } = useStore()
  const [orders, setOrders] = useState<CustomerOrderSummary[]>([])
  const [latestTracking, setLatestTracking] = useState<CustomerOrderTracking | null>(null)
  const [recommended, setRecommended] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTrackingLoading, setIsTrackingLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    const loadDashboardData = async () => {
      try {
        setIsLoading(true)
        setError("")

        // 1. Fetch Orders
        const ordersRes = await fetchCustomerOrders(1, 10)
        if (!active) return

        const fetchedOrders = ordersRes.data
        setOrders(fetchedOrders)

        // 2. Fetch tracking for the latest active/processing order if exists
        const trackableOrder = fetchedOrders.find(
          (o) => ["pending", "processing", "shipped"].includes(o.status.toLowerCase())
        ) || fetchedOrders[0]

        if (trackableOrder) {
          setIsTrackingLoading(true)
          try {
            const trackingData = await fetchCustomerOrderTracking(trackableOrder.order_number)
            if (active) {
              setLatestTracking(trackingData)
            }
          } catch (err) {
            console.error("Failed to fetch tracking details:", err)
          } finally {
            if (active) setIsTrackingLoading(false)
          }
        }

        // 3. Fetch Recommended Products
        const products = await fetchProducts({ perPage: 4 })
        if (active) {
          setRecommended(products.slice(0, 4))
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to load dashboard data.")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      active = false
    }
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-card border border-border animate-pulse" />
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-80 rounded-xl bg-card border border-border animate-pulse" />
          <div className="h-80 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
        <h3 className="font-semibold text-destructive">{t("error_loading_dashboard")}</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>{t("try_again")}</Button>
      </div>
    )
  }

  // Card math
  const totalOrders = orders.length
  const activeOrders = orders.filter((o) =>
    ["pending", "processing", "shipped"].includes(o.status.toLowerCase())
  ).length
  const wishlistCount = wishlist.length

  // Reward points calculation (e.g. 1 point for every 10 BDT spent on completed/delivered orders)
  const completedOrders = orders.filter((o) => o.status.toLowerCase() === "delivered")
  const totalSpent = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0)
  const rewardPoints = Math.floor(totalSpent / 10)

  // Track order tracking states
  const getTrackingStep = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return 1
      case "processing":
        return 2
      case "shipped":
        return 3
      case "delivered":
        return 4
      default:
        return 0
    }
  }

  const trackingStep = latestTracking ? getTrackingStep(latestTracking.status) : 0

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("total_orders")}</span>
            <p className="text-2xl font-bold">{totalOrders}</p>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("active_orders")}</span>
            <p className="text-2xl font-bold">{activeOrders}</p>
          </div>
          <div className="p-3 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-xl">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("wishlist_items_count")}</span>
            <p className="text-2xl font-bold">{wishlistCount}</p>
          </div>
          <div className="p-3 bg-pink-500/10 text-pink-600 dark:text-pink-500 rounded-xl">
            <Heart className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t("reward_points")}</span>
            <p className="text-2xl font-bold">{rewardPoints}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 rounded-xl">
            <Award className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders (Table) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{t("recent_orders")}</h3>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link href="/profile/orders" className="flex items-center gap-1">
                  {t("view_all_orders")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">{t("no_orders_yet")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("orders_appear_here")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-medium">
                      <th className="py-3 pr-4">Order #</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 pl-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 pr-4 font-semibold text-primary">
                          <Link href={`/profile/orders`} className="hover:underline">
                            {order.order_number}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-muted-foreground">
                          {new Intl.DateTimeFormat("en", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }).format(new Date(order.created_at))}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge className={statusColors[order.status.toLowerCase()] ?? "bg-slate-100 text-slate-800"} variant="secondary">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3.5 pl-4 text-right font-medium">
                          {formatPrice(order.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Order Tracking Status Widget */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-4">{t("latest_order_tracker")}</h3>
            {isTrackingLoading ? (
              <div className="py-12 flex items-center justify-center">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : !latestTracking ? (
              <div className="text-center py-8">
                <Truck className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">{t("no_order_to_track")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("active_orders_shown")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Order #</span>
                    <span className="font-bold text-foreground">{latestTracking.order_number}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">Status</span>
                    <Badge className={statusColors[latestTracking.status.toLowerCase()] ?? "bg-slate-100 text-slate-800"} variant="secondary">
                      {latestTracking.status.charAt(0).toUpperCase() + latestTracking.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar and events */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-border">
                  {[
                    { step: 1, label: t("order_placed"), desc: t("order_placed_desc") },
                    { step: 2, label: t("processing"), desc: t("processing_desc") },
                    { step: 3, label: t("shipped"), desc: t("shipped_desc") },
                    { step: 4, label: t("delivered"), desc: t("delivered_desc") },
                  ].map((s) => {
                    const isCompleted = trackingStep >= s.step
                    const isCurrent = trackingStep === s.step
                    return (
                      <div key={s.step} className="relative text-sm">
                        <div
                          className={`absolute -left-6 top-1 h-4 w-4 rounded-full border-2 transition-colors flex items-center justify-center ${
                            isCompleted
                              ? "bg-primary border-primary"
                              : "bg-card border-border"
                          }`}
                        >
                          {isCompleted && <div className="h-1.5 w-1.5 bg-background rounded-full" />}
                        </div>
                        <div className="pl-1">
                          <p className={`font-semibold ${isCurrent ? "text-foreground" : isCompleted ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
                            {s.label}
                          </p>
                          <p className="text-xs text-muted-foreground/80 mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          {latestTracking && (
            <Button variant="outline" size="sm" className="w-full mt-4" asChild>
              <Link href={`/order-tracking?order_number=${latestTracking.order_number}`}>
                {t("full_tracking_details")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Recommended Products */}
      {recommended.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-xl">{t("recommended_for_you")}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
