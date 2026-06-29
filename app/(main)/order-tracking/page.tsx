"use client"

import { useEffect, useState, Suspense } from "react"
import { useTranslation } from '@/lib/i18n'
import { useSearchParams } from "next/navigation"
import { Package, Truck, CheckCircle, MapPin, Search, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { fetchCustomerOrderTracking, type CustomerOrderTracking } from "@/lib/customer-checkout"

const formatTimelineDate = (value: string | null, locale = "en") => {
  if (!value) {
    return locale === "en" ? "Pending" : "প্রতীক্ষা"
  }

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate)
}

const progressIcons = [Package, Package, Truck, Truck, CheckCircle]

function OrderTrackingContent() {
  const searchParams = useSearchParams()
  const [orderId, setOrderId] = useState("")
  const [tracking, setTracking] = useState<CustomerOrderTracking | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const { t, locale } = useTranslation()

  const loadTracking = async (identifier: string) => {
    const trimmedIdentifier = identifier.trim()

    if (!trimmedIdentifier) {
      setError(t('please_enter_order_id'))
      setTracking(null)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const data = await fetchCustomerOrderTracking(trimmedIdentifier)
      setTracking(data)
    } catch (caught: unknown) {
      setTracking(null)
      setError(caught instanceof Error ? caught.message : t('unable_to_load_tracking'))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const initialOrderNumber =
      searchParams.get("order_number") ?? searchParams.get("orderid") ?? searchParams.get("id") ?? ""

    if (initialOrderNumber) {
      setOrderId(initialOrderNumber)
      void loadTracking(initialOrderNumber)
    }
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void loadTracking(orderId)
  }

  const trackingSteps = tracking?.tracking_events ?? []
  const progressWidth = trackingSteps.length > 0
    ? `${Math.max(20, Math.round((trackingSteps.filter((step) => step.completed).length / trackingSteps.length) * 100))}%`
    : "0%"

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">{t('track_your_order')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('enter_order_to_track')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3 mb-12">
          <div className="flex-1">
            <Label htmlFor="orderId" className="sr-only">
              {t('order_id')}
            </Label>
            <Input
              id="orderId"
              placeholder={t('enter_order_placeholder')}
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              required
            />
          </div>
          <Button type="submit">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            {t('track')}
          </Button>
        </form>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        ) : null}

        {tracking && (
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm text-muted-foreground">{t('order_id')}</p>
                <p className="font-semibold">{tracking.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('estimated_delivery')}</p>
                <p className="font-semibold">{tracking.estimated_delivery ?? t('not_available')}</p>
              </div>
            </div>

            <div className="relative mb-8">
              <div className="h-1 bg-muted rounded-full">
                <div
                  className="h-full bg-foreground rounded-full transition-all"
                  style={{ width: progressWidth }}
                />
              </div>
              <div className="absolute top-0 left-0 w-full flex justify-between -translate-y-1/2">
                {progressIcons.map((Icon, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      trackingSteps[i]?.completed
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-0">
              {trackingSteps.map((step, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full border-2",
                        step.completed
                          ? "bg-foreground border-foreground"
                          : "bg-background border-muted-foreground"
                      )}
                    />
                    {index < trackingSteps.length - 1 && (
                      <div
                        className={cn(
                          "w-0.5 h-16",
                          step.completed ? "bg-foreground" : "bg-muted"
                        )}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <p
                      className={cn(
                        "font-medium",
                        !step.completed && "text-muted-foreground"
                      )}
                    >
                      {step.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimelineDate(step.date, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">
                    {tracking.shipping_address.name}<br />
                    {tracking.shipping_address.address}
                    {tracking.shipping_address.area ? `, ${tracking.shipping_address.area}` : ""}<br />
                    {tracking.shipping_address.city}
                    {tracking.shipping_address.zip ? `, ${tracking.shipping_address.zip}` : ""}
                    {tracking.shipping_address.country ? `, ${tracking.shipping_address.country}` : ""}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !tracking && !error ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t('enter_order_to_see')}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-16 text-center text-muted-foreground">Loading...</div>}>
      <OrderTrackingContent />
    </Suspense>
  )
}
