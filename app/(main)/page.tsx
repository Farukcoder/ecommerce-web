"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Star, Truck, Shield, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductCard } from "@/components/product-card"
import { testimonials } from "@/lib/data"
import { fetchBrands, fetchCategories, fetchProducts, getNewArrivalProducts } from "@/lib/api"
import { fetchSystemSettings } from "@/lib/system-settings"
import { useTranslation } from "@/lib/i18n"
import { useEffect, useState } from "react"

export default function HomePage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, brds, prods, sett] = await Promise.all([
          fetchCategories().catch(() => []),
          fetchBrands().catch(() => []),
          fetchProducts().catch(() => []),
          fetchSystemSettings().catch(() => null)
        ])
        setCategories(cats)
        setBrands(brds)
        setProducts(prods)
        setSettings(sett)
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">{t("loading")}</div>
  }

  const featuredProducts = products.slice(0, 4)
  const bestSellers = products.filter((p) => p.badge === "bestseller")
  const newArrivals = getNewArrivalProducts(products, 4)
  const saleProducts = products.filter((p) => p.badge === "sale")
  const heroImage =
    settings?.flash_deal_page_banner_large_url ?? ""
  
  const promobanner =
    settings?.flash_deal_page_banner_small_url ?? ""

  const heroBadgeText = settings?.hero_badge_text ?? ""
  const heroHeading = settings?.hero_heading ?? ""
  const heroDescription =
    settings?.hero_description ?? ""

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl">
            {heroBadgeText ? (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-accent text-accent-foreground rounded-full mb-4">
                {heroBadgeText}
              </span>
            ) : null}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight text-balance">
              {heroHeading}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-md">
              {heroDescription}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/shop">
                  {t("shop_collection")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/about">{t("learn_more")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="flex items-center gap-4 py-6 md:px-8">
              <Truck className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">{t("free_shipping")}</h3>
                <p className="text-sm text-muted-foreground">{t("on_orders_over")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-6 md:px-8">
              <RotateCcw className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">{t("easy_returns")}</h3>
                <p className="text-sm text-muted-foreground">{t("easy_returns_desc")}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 py-6 md:px-8">
              <Shield className="h-8 w-8 text-muted-foreground" />
              <div>
                <h3 className="font-medium">{t("secure_checkout")}</h3>
                <p className="text-sm text-muted-foreground">{t("secure_checkout_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t("shop_by_category")}</h2>
              <p className="mt-2 text-muted-foreground">{t("find_exactly")}</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/shop">
                {t("view_all")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.slug}
                  href={`/shop?category=${category.slug}`}
                  className="group relative aspect-[3/4] overflow-hidden rounded-lg"
                >
                  {category.image ? (
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h3 className="text-white font-medium">{category.name}</h3>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">{t("no_categories_available")}</p>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t("featured_products")}</h2>
              <p className="mt-2 text-muted-foreground">{t("popular_selections")}</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/shop">
                {t("view_all")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t("best_sellers")}</h2>
              <p className="mt-2 text-muted-foreground">{t("customer_favorites")}</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/shop?badge=bestseller">
                {t("view_all")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="relative py-20 bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={promobanner}
            alt="Hero background"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
        </div>
        <div className="relative container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <span className="inline-block px-3 py-1 text-xs font-medium bg-primary-foreground/20 rounded-full mb-4">
                {t("limited_time_offer")}
              </span>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">
                {t("get_20_off")}
              </h2>
              <p className="mt-2 text-primary-foreground/70 max-w-md">
                {t("newsletter_discount")}
              </p>
            </div>
            <form className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <Input
                type="email"
                placeholder={t("enter_your_email")}
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 w-full sm:w-72"
              />
              <Button variant="secondary">{t("subscribe")}</Button>
            </form>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t("new_arrivals")}</h2>
              <p className="mt-2 text-muted-foreground">{t("fresh_drops")}</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/shop?badge=new">
                {t("view_all")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Sale Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">{t("on_sale")}</h2>
              <p className="mt-2 text-muted-foreground">{t("great_deals")}</p>
            </div>
            <Button variant="ghost" asChild className="hidden md:flex">
              <Link href="/shop?badge=sale">
                {t("view_all")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">{t("premium_brands")}</h2>
            <p className="mt-2 text-muted-foreground">{t("trusted_brands")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="group w-full flex items-center justify-center h-20 p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-all duration-300 bg-white hover:bg-accent/10 cursor-pointer"
              >
                {brand.logo ? (
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    width={160}
                    height={60}
                    className="max-w-full max-h-12 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {brand.name}
                  </span>
                )}
              </div>
            ))}
          </div>
          {brands.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">
              {t("no_categories_available")}
            </p>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">{t("still_have_questions")}</h2>
            <p className="mt-2 text-muted-foreground">{t("customer_support_help")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-card rounded-lg p-8 border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-foreground text-foreground" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {testimonial.text}
                </p>
                <div className="flex items-center gap-3">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Verified Purchase - {testimonial.product}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-semibold tracking-tight">{t("limited_time_offer")}</h2>
            <p className="mt-2 text-muted-foreground">
              {t("newsletter_discount")}
            </p>
            <form className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Input
                type="email"
                placeholder={t("enter_your_email")}
                className="w-full sm:w-80"
              />
              <Button>{t("subscribe")}</Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              {t("newsletter_discount")}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
