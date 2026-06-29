"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { useStore } from "@/lib/store-context"
import { useProductDefaultImage } from "@/lib/product-image-context"
import { getProductImageSrc } from "@/lib/product-image"
import { useCurrency } from "@/lib/currency"
import {
  DHAKA_SHIPPING_CHARGE,
  OUTSIDE_DHAKA_SHIPPING_CHARGE,
} from "@/lib/shipping"
import { useTranslation } from "@/lib/i18n"

export default function CartPage() {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const { cart, updateCartQuantity, removeFromCart, cartTotal } = useStore()
  const productDefaultImage = useProductDefaultImage()
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  const total = cartTotal

  useEffect(() => {
    router.prefetch("/checkout")
  }, [router])

  const handleProceedToCheckout = () => {
    if (isNavigating) {
      return
    }

    setIsNavigating(true)

    const maybePromise = router.push("/checkout")
    if (maybePromise && typeof (maybePromise as Promise<unknown>).catch === "function") {
      ;(maybePromise as Promise<unknown>).catch(() => setIsNavigating(false))
    }
  }

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">{t("your_cart_empty")}</h1>
          <p className="text-muted-foreground mb-8">
            {t("nothing_added_cart")}
          </p>
          <Button asChild>
            <Link href="/shop">
              {t("start_shopping")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">{t("shopping_cart")}</h1>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-6">{t("product")}</div>
            <div className="col-span-2 text-center">{t("quantity")}</div>
            <div className="col-span-2 text-right">{t("price")}</div>
            <div className="col-span-2 text-right">{t("total")}</div>
          </div>
          <Separator className="hidden md:block mb-4" />

          <div className="space-y-4">
            {cart.map((item) => {
              const itemImage = getProductImageSrc(item.image, productDefaultImage)

              return (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-4 items-center py-4 border-b border-border"
              >
                {/* Product Info */}
                <div className="col-span-12 md:col-span-6 flex items-center gap-4">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    {itemImage ? (
                      <Image
                        src={itemImage}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="100px"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${item.id}`}
                      className="font-medium hover:text-muted-foreground transition-colors line-clamp-1"
                    >
                      {item.name}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      {item.selectedSize && item.selectedColor && <span> / </span>}
                      {item.selectedColor && <span>Color: {item.selectedColor}</span>}
                    </div>
                    <p className="text-sm font-medium md:hidden mt-1">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 md:hidden"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quantity */}
                <div className="col-span-6 md:col-span-2 flex justify-start md:justify-center">
                  <div className="flex items-center border border-input rounded-md">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none rounded-l-md"
                      onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-none rounded-r-md"
                      onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Price */}
                <div className="hidden md:block col-span-2 text-right">
                  {formatPrice(item.price)}
                </div>

                {/* Total */}
                <div className="col-span-6 md:col-span-2 text-right flex items-center justify-end gap-2">
                  <span className="font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hidden md:flex h-8 w-8"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              )
            })}
          </div>

          {/* Continue Shopping */}
          <div className="mt-8">
            <Button variant="outline" asChild>
              <Link href="/shop">{t("continue_shopping")}</Link>
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-muted rounded-lg p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">{t("order_summary")}</h2>

            {/* Coupon */}
            <div className="flex gap-2 mb-6">
              <Input placeholder={t("coupon_code")} className="bg-background" />
              <Button variant="outline">{t("apply")}</Button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("subtotal")}</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="text-right text-xs sm:text-sm">
                  {t("dhaka")} {formatPrice(DHAKA_SHIPPING_CHARGE)} · {t("others")}{" "}
                  {formatPrice(OUTSIDE_DHAKA_SHIPPING_CHARGE)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("shipping_cost_note")}
              </p>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-between font-semibold text-lg">
              <span>{t("total")}</span>
              <span>{formatPrice(total)}</span>
            </div>

            <Button className="w-full mt-6" size="lg" type="button" onClick={handleProceedToCheckout} disabled={isNavigating}>
              {isNavigating ? (
                <>
                  <Spinner className="h-4 w-4" />
                  {t("loading")}
                </>
              ) : (
                t("proceed_to_checkout")
              )}
            </Button>

            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                {t("secure_checkout_note")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
