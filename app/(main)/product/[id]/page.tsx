"use client"

import { useEffect, useMemo, useState, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Heart, Minus, Plus, Star, Truck, RotateCcw, Shield, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/product-card"
import { isCustomerLoggedIn } from "@/lib/customer-auth"
import { useProductImageSrc } from "@/lib/product-image-context"
import { useStore, type Product } from "@/lib/store-context"
import { fetchProducts, fetchProductReviews, type ProductReview, type PaginatedProductReviews } from "@/lib/api"
import { cn, sanitizeHtml } from "@/lib/utils"
import { useCurrency } from "@/lib/currency"

const legacyCategoryMap: Record<string, string> = {
  women: "clothing",
  men: "clothing",
  home: "home-garden",
}

const categoryLabelMap: Record<string, string> = {
  accessories: "Accessories",
  clothing: "Clothing",
  electronics: "Electronics",
  footwear: "Footwear",
  "home-garden": "Home & Garden",
}

const normalizeCategorySlug = (category: string) =>
  legacyCategoryMap[category] ?? category

const getCategoryLabel = (category: string) => {
  const normalizedCategory = normalizeCategorySlug(category)

  return categoryLabelMap[normalizedCategory] ?? normalizedCategory.replace(/-/g, " ")
}

const stripHtmlTags = (value?: string) =>
  value ? value.replace(/<[^>]*>/g, "").trim() : ""

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { formatPrice } = useCurrency()
  const router = useRouter()
  const pathname = usePathname()
  const { id } = use(params)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useStore()
  const product = useMemo(
    () => products.find((item) => item.id === id),
    [products, id]
  )
  const inWishlist = product ? isInWishlist(product.id) : false

  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")

  // Dynamic reviews states
  const [reviewsData, setReviewsData] = useState<PaginatedProductReviews | null>(null)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [reviewsPage, setReviewsPage] = useState(1)

  useEffect(() => {
    let isActive = true

    setIsLoadingProducts(true)
    fetchProducts({ perPage: 100 })
      .then((data) => {
        if (isActive) setProducts(data)
      })
      .catch(() => {
        if (isActive) setProducts([])
      })
      .finally(() => {
        if (isActive) setIsLoadingProducts(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    setQuantity(1)
    setSelectedSize(product?.sizes?.[0] || "")
    setSelectedColor(product?.colors?.[0] || "")
  }, [product])

  useEffect(() => {
    setReviewsPage(1)
  }, [product?.id])

  useEffect(() => {
    if (!product?.id) return

    let isActive = true
    setIsLoadingReviews(true)

    fetchProductReviews(product.id, reviewsPage)
      .then((data) => {
        if (isActive) setReviewsData(data)
      })
      .catch((err) => {
        console.error("Failed to fetch reviews:", err)
      })
      .finally(() => {
        if (isActive) setIsLoadingReviews(false)
      })

    return () => {
      isActive = false
    }
  }, [product?.id, reviewsPage])

  const relatedProducts = useMemo(() => {
    if (!product) {
      return []
    }

    return products
      .filter(
        (item) =>
          normalizeCategorySlug(item.category) === normalizeCategorySlug(product.category) &&
          item.id !== product.id
      )
      .slice(0, 4)
  }, [products, product])

  const discount = product?.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0
  const productImageSrc = useProductImageSrc(product?.image)
  const defaultProductImageSrc = useProductImageSrc(null)
  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (defaultProductImageSrc) {
      event.currentTarget.src = defaultProductImageSrc
    }
  }

  if (isLoadingProducts) {
    return (
      <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
        Loading product...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Product not found</h1>
        <p className="mt-2 text-muted-foreground">
          The product you are looking for does not exist or is unavailable.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/shop">Back to shop</Link>
        </Button>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize, selectedColor)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize, selectedColor)
    window.location.href = "/checkout"
  }

  const handleWishlistToggle = () => {
    if (!isCustomerLoggedIn()) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }
    inWishlist ? removeFromWishlist(product.id) : addToWishlist(product)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/shop" className="hover:text-foreground transition-colors">
          Shop
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href={`/shop?category=${normalizeCategorySlug(product.category)}`}
          className="hover:text-foreground transition-colors capitalize"
        >
          {getCategoryLabel(product.category)}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
            {productImageSrc ? (
              <Image
                src={productImageSrc}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={handleImageError}
              />
            ) : null}
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
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
          </div>
          {/* Thumbnail gallery placeholder */}
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md bg-muted border-2 transition-colors",
                  i === 1 ? "border-foreground" : "border-transparent hover:border-muted-foreground"
                )}
              >
                <Image
                  src={productImageSrc}
                  alt={`${product.name} view ${i}`}
                  fill
                  className="object-cover"
                  sizes="100px"
                  onError={handleImageError}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">{product.name}</h1>
            <div className="flex items-center gap-4 mt-3">
              {(product.rating > 0 || product.reviews > 0) ? (
                <>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-4 w-4",
                          i < Math.floor(product.rating)
                            ? "fill-foreground text-foreground"
                            : "fill-muted text-muted"
                        )}
                      />
                    ))}
                    <span className="ml-2 text-sm font-medium">{product.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({product.reviews} reviews)
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">No reviews yet</span>
              )}
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
                <Badge variant="destructive">Save {discount}%</Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground leading-relaxed">
            {stripHtmlTags(product.short_description)}
          </p>

          <Separator />

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="font-medium">Size</Label>
                <button className="text-sm text-muted-foreground hover:text-foreground underline">
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-colors",
                      selectedSize === size
                        ? "border-foreground bg-foreground text-background"
                        : "border-input hover:border-foreground"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div>
              <Label className="font-medium mb-3 block">
                Color: <span className="font-normal text-muted-foreground">{selectedColor}</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "px-4 py-2 text-sm border rounded-md transition-colors",
                      selectedColor === color
                        ? "border-foreground bg-foreground text-background"
                        : "border-input hover:border-foreground"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <Label className="font-medium mb-3 block">Quantity</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-input rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none rounded-l-md"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-none rounded-r-md"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" className="flex-1" onClick={handleAddToCart}>
              Add to Cart
            </Button>
            <Button size="lg" variant="outline" className="flex-1" onClick={handleBuyNow}>
              Buy Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="sm:w-auto"
              onClick={handleWishlistToggle}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  inWishlist && "fill-accent text-accent"
                )}
              />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Free Shipping</p>
                <p className="text-muted-foreground">On orders ৳10,000+</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <RotateCcw className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Easy Returns</p>
                <p className="text-muted-foreground">30-day policy</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Secure</p>
                <p className="text-muted-foreground">SSL protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger
              value="description"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
            >
              Description
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
            >
              Reviews ({product.reviews})
            </TabsTrigger>
            <TabsTrigger
              value="shipping"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent px-6 py-3"
            >
              Shipping & Returns
            </TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <div className="prose prose-neutral max-w-none">
              <div
                className="text-muted-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }}
              />
              <h3 className="text-lg font-semibold mt-6 mb-3">Features</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Premium quality materials sourced from trusted suppliers</li>
                <li>Designed for durability and long-lasting performance</li>
                <li>Modern aesthetic that complements any style</li>
                <li>Carefully crafted with attention to detail</li>
              </ul>
            </div>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            {isLoadingReviews ? (
              <div className="text-center py-6 text-muted-foreground animate-pulse">
                Loading reviews...
              </div>
            ) : !reviewsData || reviewsData.data.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-lg bg-muted/10">
                <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-30 animate-pulse" />
                <p className="font-semibold text-muted-foreground text-sm">No reviews yet</p>
                <p className="text-xs text-muted-foreground mt-1">Be the first to buy and review this product!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviewsData.data.map((rev) => (
                  <div key={rev.id} className="border-b border-border pb-6 last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm capitalize shrink-0">
                        {rev.user?.name ? rev.user.name.charAt(0) : "?"}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm sm:text-base">{rev.user?.name || "Customer"}</p>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {new Date(rev.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <Star
                              key={j}
                              className={cn(
                                "h-3 w-3",
                                j < rev.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                        {rev.comment && (
                          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line mt-2">
                            {rev.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {reviewsData.last_page > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                      disabled={reviewsPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {reviewsPage} of {reviewsData.last_page}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewsPage((p) => Math.min(reviewsData.last_page, p + 1))}
                      disabled={reviewsPage === reviewsData.last_page}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          <TabsContent value="shipping" className="mt-6">
            <div className="prose prose-neutral max-w-none">
              <h3 className="text-lg font-semibold mb-3">Shipping Information</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
                <li>Free standard shipping on orders over ৳10,000</li>
                <li>Standard shipping: 3-5 business days within Bangladesh</li>
                <li>Express shipping: 1-2 business days (Dhaka only)</li>
                <li>Cash on Delivery available</li>
              </ul>
              <h3 className="text-lg font-semibold mb-3">Return Policy</h3>
              <p className="text-muted-foreground">
                We offer a 30-day return policy for all unworn items with original
                tags attached. Please contact our customer service team to initiate
                a return.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-20">
          <h2 className="text-2xl font-semibold tracking-tight mb-8">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>
}
