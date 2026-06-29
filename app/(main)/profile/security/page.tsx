"use client"

import { useState } from "react"
import { Lock, ShieldCheck, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

export default function SecurityPage() {
  const { t } = useTranslation()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword.length < 8) {
      toast.error(t("password_too_short"), {
        description: t("password_too_short_desc"),
      })
      return
    }

    if (newPassword !== confirmNewPassword) {
      toast.error(t("password_mismatch"), {
        description: t("password_mismatch_desc"),
      })
      return
    }

    setIsUpdating(true)

    setTimeout(() => {
      toast.success(t("password_updated"), {
        description: t("password_updated_desc"),
        icon: <Check className="h-4 w-4 text-green-500" />,
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmNewPassword("")
      setIsUpdating(false)
    }, 800)
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <Lock className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("security_settings_title")}</h2>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("current_password")}</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("new_password")}</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <p className="text-xs text-muted-foreground">{t("password_hint")}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">{t("confirm_new_password")}</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? t("updating_ellipsis") : t("update_password")}
          </Button>
        </div>
      </form>

      {/* Trust Badge / Info Card */}
      <div className="mt-8 bg-muted/30 border border-border/50 rounded-lg p-4 flex gap-3 items-start">
        <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">{t("account_security_title")}</p>
          <p className="text-muted-foreground text-xs mt-1">{t("account_security_desc")}</p>
        </div>
      </div>
    </div>
  )
}
