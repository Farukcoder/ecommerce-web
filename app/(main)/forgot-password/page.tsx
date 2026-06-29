"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/lib/i18n"

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">{t("reset_password")}</h1>
          <p className="text-muted-foreground mt-2">
            {t("reset_password_desc")}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <Button type="submit" className="w-full">
              {t("send_reset_link")}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("remembered_password")}
          </Link>
        </div>
      </div>
    </div>
  )
}
