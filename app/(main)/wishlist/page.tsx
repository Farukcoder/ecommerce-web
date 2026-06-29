"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Heart, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductCard } from "@/components/product-card"
import { isCustomerLoggedIn } from "@/lib/customer-auth"
import { useStore } from "@/lib/store-context"

export default function WishlistPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [isReady, setIsReady] = useState(false)
  const { wishlist } = useStore()

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    setIsReady(true)
  }, [pathname, router])

  if (!isReady) {
    return null
  }

  if (wishlist.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Your wishlist is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Save your favorite items to your wishlist to buy them later.
          </p>
          <Button asChild>
            <Link href="/shop">
              Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Wishlist</h1>
          <p className="text-muted-foreground mt-1">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlist.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}
