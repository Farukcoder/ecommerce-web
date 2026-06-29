"use client"

import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { fetchCategories } from "@/lib/api"
import { fetchSystemSettings } from "@/lib/system-settings"
import { useTranslation } from "@/lib/i18n"
import { useEffect, useState } from "react"

export function Footer() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState<any[]>([])
  const [settings, setSettings] = useState<any>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, sett] = await Promise.all([
          fetchCategories().catch(() => []),
          fetchSystemSettings().catch(() => null)
        ])
        setCategories(cats)
        setSettings(sett)
      } catch {
        // ignore
      }
    }
    void loadData()
  }, [])

  const shopCategories = categories.slice(0, 3)
  const websiteName = settings?.frontend_website_name?.trim() || "DEMO"

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-1">
            <Link href="/" className="text-2xl font-semibold tracking-tight">
              {websiteName}
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70 leading-relaxed">
              {t("newsletter_discount")}
            </p>
            <div className="mt-6">
              <p className="text-sm font-medium mb-3">
                {t("newsletter_discount")}
              </p>
              <form className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t("enter_your_email")}
                  className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 h-10"
                />
                <Button variant="secondary" size="sm" className="px-4 h-10">
                  {t("subscribe")}
                </Button>
              </form>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-semibold mb-4">{t("shop")}</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <Link href="/shop" className="hover:text-primary-foreground transition-colors">
                  {t("shop_all")}
                </Link>
              </li>
              {shopCategories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/shop?category=${category.slug}`}
                    className="hover:text-primary-foreground transition-colors"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop?badge=new" className="hover:text-primary-foreground transition-colors">
                  {t("new_arrivals")}
                </Link>
              </li>
              <li>
                <Link href="/shop?badge=sale" className="hover:text-primary-foreground transition-colors">
                  {t("on_sale")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-semibold mb-4">{t("support")}</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <Link href="/contact" className="hover:text-primary-foreground transition-colors">
                  {t("contact_us")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-foreground transition-colors">
                  {t("frequently_asked_questions")}
                </Link>
              </li>
              <li>
                <Link href="/order-tracking" className="hover:text-primary-foreground transition-colors">
                  {t("track_your_order")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-foreground transition-colors">
                  {t("shipping")}
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary-foreground transition-colors">
                  {t("easy_returns")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">{t("our_story")}</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li>
                <Link href="/about" className="hover:text-primary-foreground transition-colors">
                  {t("about")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-foreground transition-colors">
                  {t("careers")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-foreground transition-colors">
                  {t("press")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary-foreground transition-colors">
                  {t("sustainable_practice")}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-12 bg-primary-foreground/20" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-primary-foreground/70">
            &copy; {new Date().getFullYear()} {t("all_rights_reserved")}
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              {t("privacy_policy")}
            </Link>
            <Link href="#" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              {t("terms_of_service")}
            </Link>
          </div>
          {/* Payment Methods */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-primary-foreground/50">{t("payment_methods_accepted")}</span>
            <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/70">
              <span className="px-2 py-1 bg-primary-foreground/10 rounded">{t("bkash")}</span>
              <span className="px-2 py-1 bg-primary-foreground/10 rounded">{t("nagad")}</span>
              <span className="px-2 py-1 bg-primary-foreground/10 rounded">Visa</span>
              <span className="px-2 py-1 bg-primary-foreground/10 rounded">{t("cod")}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
