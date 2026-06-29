"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart, ShoppingBag, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { animateAddToCart } from "@/lib/cart-animation"
import { isCustomerLoggedIn } from "@/lib/customer-auth"
import { useProductImageSrc } from "@/lib/product-image-context"
import { useStore, type Product } from "@/lib/store-context"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/lib/currency"

interface ProductCardProps {
  product: Product
  className?: string
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const pathname = usePathname()
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore()
  const inWishlist = isInWishlist(product.id)
  const productImageSrc = useProductImageSrc(product.image)
  const defaultProductImageSrc = useProductImageSrc(null)
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (defaultProductImageSrc) {
      event.currentTarget.src = defaultProductImageSrc
    }
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0

  return (
    <div className={cn("group relative", className)}>
      <Link href={`/product/${product.id}`} className="block">
        <div className="relative aspect-3/4 overflow-hidden rounded-lg bg-muted">
          {productImageSrc ? (
            <Image
              src={productImageSrc}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              onError={handleImageError}
            />
          ) : null}
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.badge === "new" && (
              <Badge className="bg-foreground text-background">New</Badge>
            )}
            {product.badge === "bestseller" && (
              <Badge className="bg-accent text-accent-foreground">Bestseller</Badge>
            )}
            {product.badge === "sale" && discount > 0 && (
              <Badge variant="destructive">-{discount}%</Badge>
            )}
          </div>
          {/* Quick Actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <Button
              variant="secondary"
              size="icon"
              className="group h-9 w-9 overflow-hidden rounded-full px-3 justify-start shadow-lg transition-all duration-300 ease-out hover:w-[152px] cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                if (!isCustomerLoggedIn()) {
                  router.push(`/login?next=${encodeURIComponent(pathname)}`)
                  return
                }
                if (inWishlist) {
                  removeFromWishlist(product.id)
                  return
                }

                addToWishlist(product)
                animateAddToCart(e.currentTarget, {
                  imageSrc: productImageSrc,
                  label: product.name,
                  destinationSelector: "[data-wishlist-target]",
                })
              }}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className={cn("h-4 w-4 shrink-0", inWishlist && "fill-accent text-accent")} />
              <span className="whitespace-nowrap text-xs font-medium opacity-0 transition-all duration-300 group-hover:opacity-100">
                {inWishlist ? "Remove from wishlist" : "Add to wishlist"}
              </span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="group h-9 w-9 overflow-hidden rounded-full px-3 justify-start shadow-lg transition-all duration-300 ease-out hover:w-[132px] cursor-pointer"
              onClick={(e) => {
                e.preventDefault()
                addToCart(product)
                animateAddToCart(e.currentTarget, {
                  imageSrc: productImageSrc,
                  label: product.name,
                })
              }}
              aria-label="Add to cart"
            >
              <ShoppingBag className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap text-xs font-medium opacity-0 transition-all duration-300 group-hover:opacity-100">
                Add to cart
              </span>
            </Button>
          </div>
        </div>
      </Link>
      
      <div className="mt-4 space-y-1">
        <Link href={`/product/${product.id}`}>
          <h3 className="font-medium text-sm line-clamp-1 group-hover:text-muted-foreground transition-colors">
            {product.name}
          </h3>
        </Link>
        {(product.rating > 0 || product.reviews > 0) ? (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 fill-foreground text-foreground" />
            <span className="text-xs text-muted-foreground">
              {product.rating} ({product.reviews})
            </span>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">New arrival</p>
        )}
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
