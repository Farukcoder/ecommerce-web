"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  User,
  Package,
  Heart,
  MapPin,
  CreditCard,
  LogOut,
  LayoutDashboard,
  Gift,
  Star,
  LifeBuoy,
  Lock,
  Menu,
  X
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { getCustomerAuth, isCustomerLoggedIn, clearCustomerAuth } from "@/lib/customer-auth"
import { getApiBaseUrl } from "@/lib/api-base-url"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n"

const API_BASE_URL = getApiBaseUrl()

interface SidebarItem {
  labelKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const sidebarItems: SidebarItem[] = [
  { labelKey: "dashboard", href: "/profile", icon: LayoutDashboard },
  { labelKey: "my_orders", href: "/profile/orders", icon: Package },
  { labelKey: "wishlist", href: "/profile/wishlist", icon: Heart },
  { labelKey: "addresses", href: "/profile/addresses", icon: MapPin },
  { labelKey: "payments", href: "/profile/payment", icon: CreditCard },
  { labelKey: "coupons_rewards", href: "/profile/coupons", icon: Gift },
  { labelKey: "reviews", href: "/profile/reviews", icon: Star },
  { labelKey: "support", href: "/profile/support", icon: LifeBuoy },
  { labelKey: "profile_settings", href: "/profile/settings", icon: User },
  { labelKey: "security", href: "/profile/security", icon: Lock },
]

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useTranslation()
  const [isReady, setIsReady] = useState(false)
  const [profileName, setProfileName] = useState("")
  const [profileEmail, setProfileEmail] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!isCustomerLoggedIn()) {
      clearCustomerAuth()
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
      return
    }

    const auth = getCustomerAuth()
    if (auth?.user) {
      setProfileName(auth.user.name)
      setProfileEmail(auth.user.email)
    }

    // Fetch fresh profile details from API
    const fetchProfile = async () => {
      if (!auth?.token) return
      try {
        const response = await fetch(`${API_BASE_URL}/api/customer/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `${auth.tokenType} ${auth.token}`,
          },
        })
        if (response.ok) {
          const data = await response.json()
          if (data?.user) {
            setProfileName(data.user.name)
            setProfileEmail(data.user.email)
            localStorage.setItem("customer_user", JSON.stringify(data.user))
          }
        }
      } catch (err) {
        console.error("Failed to fetch fresh profile in layout:", err)
      }
    }

    fetchProfile()
    setIsReady(true)
  }, [pathname, router])

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  if (!isReady) {
    return (
      <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t("loading_account_text")}</p>
        </div>
      </div>
    )
  }

  const handleSignOut = () => {
    clearCustomerAuth()
    router.replace("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header and Mobile Trigger */}
      <div className="flex items-center justify-between mb-8 md:mb-10">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{t("my_account")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("welcome_back_customer")}, <span className="font-medium text-foreground">{profileName || t("customer_fallback")}</span>
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation - Desktop */}
        <aside className="hidden lg:block lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-4 sticky top-24">
            <div className="px-3 py-2 mb-4">
              <p className="font-semibold truncate">{profileName}</p>
              <p className="text-xs text-muted-foreground truncate">{profileEmail}</p>
            </div>
            <Separator className="mb-4" />
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                )
              })}
              <Separator className="my-2" />
              <button
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/10 text-destructive transition-colors w-full text-left cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {t("sign_out_btn")}
              </button>
            </nav>
          </div>
        </aside>

        {/* Sidebar Navigation - Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden bg-background/80 backdrop-blur-sm">
            <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-card border-r border-border p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-semibold truncate">{profileName}</p>
                    <p className="text-xs text-muted-foreground truncate">{profileEmail}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Separator className="mb-6" />
                <nav className="space-y-1">
                  {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {t(item.labelKey)}
                      </Link>
                    )
                  })}
                </nav>
              </div>

              <div className="mt-auto pt-6 border-t border-border">
                <button
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/10 text-destructive transition-colors w-full text-left cursor-pointer"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {t("sign_out_btn")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="lg:col-span-3 flex flex-col gap-6">
          {children}
        </main>
      </div>
    </div>
  )
}
