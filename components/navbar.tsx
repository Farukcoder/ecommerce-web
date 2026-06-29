"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ShoppingBag, Heart, User, Menu, X, ChevronDown, Globe, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { useStore } from "@/lib/store-context"
import { fetchCategories, type Category } from "@/lib/api"
import { clearCustomerAuth, isCustomerLoggedIn } from "@/lib/customer-auth"
import { ThemeToggle } from "./theme-toggle"
import { CurrencySwitcher } from "./currency-switcher"
import { useTranslation } from "@/lib/i18n"
import type { SystemSettings } from "@/lib/system-settings"

export function Navbar({ settings }: { settings?: SystemSettings | null }) {
  const router = useRouter()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { cartCount, wishlist } = useStore()
  const { t, availableLocales, locale, setLocale } = useTranslation()
  const logoBlack = settings?.system_logo_black_url
  const logoWhite = settings?.system_logo_white_url
  const websiteName = settings?.frontend_website_name?.trim() || "DEMO"

  const logoMarkup = (
    <span className="inline-flex items-center">
      {(logoBlack || logoWhite) && (
        <span className="relative h-8 w-28">
          {logoBlack && (
            <Image
              src={logoBlack}
              alt="Store logo"
              fill
              sizes="112px"
              className={logoWhite ? "object-contain dark:hidden" : "object-contain"}
            />
          )}
          {logoWhite && (
            <Image
              src={logoWhite}
              alt="Store logo"
              fill
              sizes="112px"
              className={logoBlack ? "hidden object-contain dark:block" : "object-contain"}
            />
          )}
        </span>
      )}
      {!logoBlack && !logoWhite && (
        <span className="text-lg font-semibold tracking-tight text-foreground">
          {websiteName}
        </span>
      )}
    </span>
  )

  const getProtectedHref = (path: string) =>
    isAuthenticated ? path : `/login?next=${encodeURIComponent(path)}`

  useEffect(() => {
    setIsAuthenticated(isCustomerLoggedIn())
  }, [])

  useEffect(() => {
    let isActive = true

    fetchCategories()
      .then((data) => {
        if (isActive) setCategories(data)
      })
      .catch(() => {
        if (isActive) setCategories([])
      })

    return () => {
      isActive = false
    }
  }, [])

  const handleLogout = () => {
    clearCustomerAuth()
    setIsAuthenticated(false)
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetTitle className="sr-only">{t('navigation_menu')}</SheetTitle>
              <div className="flex flex-col gap-6 mt-8">
                <Link href="/" className="font-semibold tracking-tight">
                  {logoMarkup}
                </Link>
                <nav className="flex flex-col gap-4">
                  <Link href="/shop" className="text-lg font-medium hover:text-muted-foreground transition-colors">
                    {t('shop_all')}
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category.slug}
                      href={`/shop?category=${category.slug}`}
                      className="text-lg font-medium hover:text-muted-foreground transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                  <Link href="/about" className="text-lg font-medium hover:text-muted-foreground transition-colors">
                    {t('about')}
                  </Link>
                  <Link href="/contact" className="text-lg font-medium hover:text-muted-foreground transition-colors">
                    {t('contact')}
                  </Link>
                </nav>
                <hr className="border-border" />
                <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">{t('currency_label')}</span>
                  <CurrencySwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="font-semibold tracking-tight">
            {logoMarkup}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/shop" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              {t('shop_all')}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium hover:text-muted-foreground transition-colors">
                {t('categories')} <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-48">
                {categories.map((category) => (
                  <DropdownMenuItem key={category.slug} asChild>
                    <Link href={`/shop?category=${category.slug}`}>{category.name}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/about" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              {t('about')}
            </Link>
            <Link href="/contact" className="text-sm font-medium hover:text-muted-foreground transition-colors">
              {t('contact')}
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2.5 hover:bg-accent hover:text-accent-foreground rounded-lg">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-semibold tracking-tight">{locale.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40 p-1.5 border border-border bg-popover rounded-xl shadow-lg">
                {availableLocales.map((loc) => (
                  <DropdownMenuItem
                    key={loc.code}
                    onClick={() => setLocale(loc.code)}
                    className="flex items-center justify-between px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-md hover:bg-accent transition-colors"
                  >
                    <span>{loc.name}</span>
                    {locale === loc.code && (
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Currency Switcher */}
            <CurrencySwitcher />

            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Search */}
            <div className="hidden md:flex items-center">
              {isSearchOpen ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-5">
                  <Input
                    type="search"
                    placeholder={t('search_products')}
                    className="w-64 h-9"
                    autoFocus
                  />
                  <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} aria-label="Search">
                  <Search className="h-5 w-5" />
                </Button>
              )}
            </div>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Search">
              <Search className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/wishlist" aria-label="Wishlist" data-wishlist-target>
                <Heart className="h-5 w-5" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] font-medium flex items-center justify-center">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            </Button>

            {/* Cart */}
            <Button variant="ghost" size="icon" asChild className="relative">
              <Link href="/cart" aria-label="Shopping cart" data-cart-target>
                <ShoppingBag className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-medium flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>

            {/* User Account */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isAuthenticated ? (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href={getProtectedHref("/profile")}>{t('my_profile')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getProtectedHref("/profile/orders")}>{t('order_history')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getProtectedHref("/wishlist")}>{t('wishlist')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout}>
                      {t('log_out')}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/login">{t('sign_in')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register">{t('create_account')}</Link>
                    </DropdownMenuItem>
                    <hr />
                    <DropdownMenuItem asChild>
                      <Link href={getProtectedHref("/profile")}>{t('my_profile')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getProtectedHref("/profile/orders")}>{t('order_history')}</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getProtectedHref("/wishlist")}>{t('wishlist')}</Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
