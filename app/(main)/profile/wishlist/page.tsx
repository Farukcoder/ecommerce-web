"use client"

import Link from "next/link"
import { Heart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { useStore } from "@/lib/store-context"
import { useTranslation } from "@/lib/i18n"

export default function ProfileWishlistPage() {
  const { wishlist } = useStore()
  const { t } = useTranslation()

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("my_wishlist_title")}</h2>
      </div>

      {wishlist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Heart className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="font-semibold text-lg">{t("wishlist_empty_title")}</p>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("wishlist_empty_desc")}
          </p>
          <Button className="mt-6" asChild>
            <Link href="/shop">
              {t("browse_products")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
