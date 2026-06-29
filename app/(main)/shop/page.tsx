"use client"

import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SlidersHorizontal, Grid3X3, LayoutGrid, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ProductCard } from "@/components/product-card"
import { useCurrency } from "@/lib/currency"
import { fetchCategories, fetchProducts, getNewArrivalProducts, type Category } from "@/lib/api"
import type { Product } from "@/lib/store-context"
import { useTranslation } from "@/lib/i18n"

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

const getCategoryLabel = (category: string, categories: Category[] = []) => {
  const normalizedCategory = normalizeCategorySlug(category)
  const apiCategory = categories.find((item) => item.slug === normalizedCategory)

  if (apiCategory) {
    return apiCategory.name
  }

  return categoryLabelMap[normalizedCategory] ?? normalizedCategory.replace(/-/g, " ")
}

function ShopContent() {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const PAGE_SIZE = 20
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get("category")
  const badgeParam = searchParams.get("badge")

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [hasMoreProducts, setHasMoreProducts] = useState(true)
  const [productPage, setProductPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    categoryParam ? [normalizeCategorySlug(categoryParam)] : []
  )
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("featured")
  const [gridCols, setGridCols] = useState<3 | 4>(4)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    setSelectedCategories(
      categoryParam ? [normalizeCategorySlug(categoryParam)] : []
    )
  }, [categoryParam])

  useEffect(() => {
    let isActive = true

    setIsLoadingProducts(true)
    setIsLoadingMore(false)
    setHasMoreProducts(true)
    setProductPage(1)
    fetchProducts({ perPage: PAGE_SIZE, page: 1 })
      .then((data) => {
        if (isActive) {
          setProducts(data)
          setHasMoreProducts(data.length === PAGE_SIZE)
        }
      })
      .catch(() => {
        if (isActive) {
          setProducts([])
          setHasMoreProducts(false)
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingProducts(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const loadMoreProducts = useCallback(async () => {
    if (isLoadingProducts || isLoadingMore || !hasMoreProducts) {
      return
    }

    setIsLoadingMore(true)
    const nextPage = productPage + 1

    try {
      const data = await fetchProducts({ perPage: PAGE_SIZE, page: nextPage })
      setProducts((prev) => [...prev, ...data])
      setProductPage(nextPage)
      setHasMoreProducts(data.length === PAGE_SIZE)
    } catch {
      setHasMoreProducts(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [PAGE_SIZE, hasMoreProducts, isLoadingMore, isLoadingProducts, productPage])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !hasMoreProducts) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          loadMoreProducts()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasMoreProducts, loadMoreProducts])

  useEffect(() => {
    let isActive = true

    setIsLoadingCategories(true)
    fetchCategories()
      .then((data) => {
        if (isActive) setCategories(data)
      })
      .catch(() => {
        if (isActive) setCategories([])
      })
      .finally(() => {
        if (isActive) setIsLoadingCategories(false)
      })

    return () => {
      isActive = false
    }
  }, [])

  const filteredProducts = useMemo(() => {
    let filtered = products

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) =>
        selectedCategories.includes(normalizeCategorySlug(p.category))
      )
    }

    // Filter by badge (from URL params)
    if (badgeParam === "new") {
      const newArrivalIds = new Set(getNewArrivalProducts(filtered).map((p) => p.id))
      filtered = filtered.filter((p) => newArrivalIds.has(p.id))
    } else if (badgeParam) {
      filtered = filtered.filter((p) => p.badge === badgeParam)
    }

    // Filter by price range
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    )

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter((p) => p.rating >= minRating)
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        filtered = [...filtered].sort((a, b) => a.price - b.price)
        break
      case "price-desc":
        filtered = [...filtered].sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating)
        break
      case "newest":
        filtered = [...filtered].sort((a, b) => {
          const aTime = a.created_at ? Date.parse(a.created_at) : 0
          const bTime = b.created_at ? Date.parse(b.created_at) : 0
          return bTime - aTime
        })
        break
      default:
        // Featured - bestsellers first
        filtered = [...filtered].sort((a, b) =>
          a.badge === "bestseller" ? -1 : b.badge === "bestseller" ? 1 : 0
        )
    }

    return filtered
  }, [
    products,
    searchQuery,
    selectedCategories,
    priceRange,
    minRating,
    sortBy,
    badgeParam,
  ])

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    )
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategories([])
    setPriceRange([0, 50000])
    setMinRating(0)
    setSortBy("featured")
    router.replace(pathname)
  }

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < 50000 ||
    minRating > 0

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-medium mb-4">{t("categories")}</h3>
        <div className="space-y-3">
          {isLoadingCategories ? (
            <p className="text-sm text-muted-foreground">{t("loading_categories")}</p>
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <div key={category.slug} className="flex items-center space-x-2">
                <Checkbox
                  id={category.slug}
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={() => handleCategoryToggle(category.slug)}
                />
                <Label htmlFor={category.slug} className="text-sm cursor-pointer">
                  {category.name}
                </Label>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t("no_categories_found")}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-4">{t("price_range")}</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={50000}
          step={500}
          className="mb-4"
        />
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value), priceRange[1]])
            }
            className="h-9"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value)])
            }
            className="h-9"
          />
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="font-medium mb-4">{t("minimum_rating")}</h3>
        <div className="space-y-3">
          {[4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() =>
                  setMinRating(minRating === rating ? 0 : rating)
                }
              />
              <Label htmlFor={`rating-${rating}`} className="text-sm cursor-pointer">
                {rating}+ {t("stars")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearFilters}>
            {t("clear_all_filters")}
          </Button>
        </>
      )}
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {badgeParam === "new"
            ? t("new_arrivals")
            : badgeParam === "sale"
            ? t("on_sale")
            : badgeParam === "bestseller"
            ? t("best_sellers")
            : categoryParam
            ? categories.find(
                (c) => c.slug === normalizeCategorySlug(categoryParam)
              )?.name || getCategoryLabel(categoryParam, categories)
            : t("all_products")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {filteredProducts.length} {t("products_found")}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24">
            <h2 className="font-semibold mb-6">{t("filters")}</h2>
            <FilterContent />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {/* Mobile Filter Button */}
              <Sheet>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="outline" size="sm">
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    {t("filters")}
                    {hasActiveFilters && (
                      <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                        !
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>{t("filters")}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Search */}
              <div className="relative">
                <Input
                  type="search"
                  placeholder={t("search_products")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 sm:w-64"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder={t("sort_by")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">{t("featured")}</SelectItem>
                  <SelectItem value="newest">{t("newest")}</SelectItem>
                  <SelectItem value="price-asc">{t("price_low_to_high")}</SelectItem>
                  <SelectItem value="price-desc">{t("price_high_to_low")}</SelectItem>
                  <SelectItem value="rating">{t("top_rated")}</SelectItem>
                </SelectContent>
              </Select>

              {/* Grid Toggle */}
              <div className="hidden md:flex items-center border border-input rounded-md">
                <Button
                  variant={gridCols === 3 ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-none rounded-l-md"
                  onClick={() => setGridCols(3)}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={gridCols === 4 ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-none rounded-r-md"
                  onClick={() => setGridCols(4)}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-sm text-muted-foreground">{t("active_filters")}</span>
              {selectedCategories.map((cat) => (
                <Button
                  key={cat}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCategoryToggle(cat)}
                >
                  {categories.find((c) => c.slug === cat)?.name || getCategoryLabel(cat, categories)}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < 50000) && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPriceRange([0, 50000])}
                >
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              )}
              {minRating > 0 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMinRating(0)}
                >
                  {minRating}+ {t("stars")}
                  <X className="ml-1 h-3 w-3" />
                </Button>
              )}
            </div>
          )}

          {/* Product Grid */}
          {isLoadingProducts ? (
            <div className="rounded-lg border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
              {t("loading")}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div
                className={`grid grid-cols-2 gap-4 md:gap-6 ${
                  gridCols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
                }`}
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div ref={loadMoreRef} className="h-8" />
              {isLoadingMore && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {t("loading_more_products")}
                </div>
              )}
              {!hasMoreProducts && !isLoadingProducts && (
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {t("end_of_list")}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">{t("no_products_found")}</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                {t("clear_filters")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading...</div>}>
      <ShopContent />
    </Suspense>
  )
}
