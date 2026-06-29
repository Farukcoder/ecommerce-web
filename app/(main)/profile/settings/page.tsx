"use client"

import { useEffect, useState } from "react"
import { User, Mail, Phone, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiBaseUrl } from "@/lib/api-base-url"
import { getCustomerAuth, type CustomerUser } from "@/lib/customer-auth"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

const API_BASE_URL = getApiBaseUrl()

export default function SettingsPage() {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<CustomerUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  useEffect(() => {
    const fetchProfile = async () => {
      const auth = getCustomerAuth()
      if (!auth?.token) return

      setIsLoading(true)
      setError("")

      try {
        const response = await fetch(`${API_BASE_URL}/api/customer/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `${auth.tokenType} ${auth.token}`,
          },
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(data?.message || "Unable to load profile.")
        }

        const user = data?.user ?? null
        setProfile(user)
        if (user) {
          const [first = "", last = ""] = (user.name ?? "").split(" ")
          setFirstName(first)
          setLastName(last)
          setEmail(user.email ?? "")
          setPhone(localStorage.getItem("customer_phone") || "+1 (555) 123-4567")
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Unable to load profile.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    setTimeout(() => {
      if (profile) {
        const updatedName = `${firstName} ${lastName}`.trim()
        const updatedUser = { ...profile, name: updatedName, email }

        localStorage.setItem("customer_user", JSON.stringify(updatedUser))
        localStorage.setItem("customer_phone", phone)

        toast.success(t("profile_updated_successfully"), {
          description: t("settings_updated"),
          icon: <Check className="h-4 w-4 text-green-500" />,
        })

        window.dispatchEvent(new Event("storage"))
      }
      setIsSaving(false)
    }, 800)
  }

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-pulse space-y-6">
        <div className="h-6 w-1/3 bg-muted rounded" />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
        <div className="h-10 w-28 bg-muted rounded" />
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("profile_settings_title")}</h2>
      </div>

      <form onSubmit={handleSaveChanges} className="space-y-5">
        {error ? <div className="text-sm text-destructive">{error}</div> : null}

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("first_name")}</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("first_name")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">{t("last_name")}</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("last_name")}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("email_address")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="email@example.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("phone_number")}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="pl-10"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? t("saving_ellipsis") : t("save_changes")}
          </Button>
        </div>
      </form>
    </div>
  )
}
