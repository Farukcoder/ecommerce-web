"use client"

import { useEffect, useState } from "react"
import { CreditCard, Plus, Trash2, Check, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface PaymentMethod {
  id: string
  cardHolder: string
  cardNumber: string
  expiryDate: string
  cardBrand: "visa" | "mastercard" | "amex" | "generic"
  isDefault: boolean
}

const DEFAULT_METHODS: PaymentMethod[] = [
  { id: "1", cardHolder: "John Doe", cardNumber: "•••• •••• •••• 4242", expiryDate: "12/28", cardBrand: "visa", isDefault: true },
  { id: "2", cardHolder: "John Doe", cardNumber: "•••• •••• •••• 5555", expiryDate: "08/29", cardBrand: "mastercard", isDefault: false },
]

export default function PaymentsPage() {
  const { t } = useTranslation()
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const [cardHolder, setCardHolder] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("customer_payments")
    if (stored) {
      try { setMethods(JSON.parse(stored)) } catch { setMethods(DEFAULT_METHODS) }
    } else {
      setMethods(DEFAULT_METHODS)
      localStorage.setItem("customer_payments", JSON.stringify(DEFAULT_METHODS))
    }
  }, [])

  const saveToStorage = (updated: PaymentMethod[]) => {
    setMethods(updated)
    localStorage.setItem("customer_payments", JSON.stringify(updated))
  }

  const openAddModal = () => {
    setCardHolder(""); setCardNumber(""); setExpiryDate(""); setCvv(""); setIsDefault(false)
    setIsOpen(true)
  }

  const detectCardBrand = (num: string): PaymentMethod["cardBrand"] => {
    const n = num.replace(/\s+/g, "")
    if (n.startsWith("4")) return "visa"
    if (n.startsWith("5")) return "mastercard"
    if (n.startsWith("3")) return "amex"
    return "generic"
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNum = cardNumber.replace(/\s+/g, "")
    if (cleanNum.length < 15) {
      toast.error("Invalid card number", { description: "Please enter a valid credit card number." })
      return
    }
    const lastFour = cleanNum.slice(-4)
    const brand = detectCardBrand(cardNumber)
    const paymentData: PaymentMethod = {
      id: Math.random().toString(36).substring(2, 9),
      cardHolder: cardHolder || "Card Holder",
      cardNumber: `•••• •••• •••• ${lastFour}`,
      expiryDate, cardBrand: brand,
      isDefault: isDefault || (methods.length === 0),
    }
    let updatedMethods = [...methods]
    if (paymentData.isDefault) updatedMethods = updatedMethods.map((m) => ({ ...m, isDefault: false }))
    updatedMethods.push(paymentData)
    saveToStorage(updatedMethods)
    setIsOpen(false)
    toast.success("Card added successfully!")
  }

  const handleDelete = (id: string) => {
    const toDelete = methods.find((m) => m.id === id)
    if (toDelete?.isDefault && methods.length > 1) {
      toast.error("Cannot delete default card", { description: "Set another card as default before deleting this one." })
      return
    }
    const updated = methods.filter((m) => m.id !== id)
    if (updated.length > 0 && toDelete?.isDefault) updated[0].isDefault = true
    saveToStorage(updated)
    toast.success("Payment method deleted successfully!")
  }

  const handleSetDefault = (id: string) => {
    const updated = methods.map((m) => ({ ...m, isDefault: m.id === id }))
    saveToStorage(updated)
    toast.success("Default payment method updated!")
  }

  const getCardGradient = (brand: PaymentMethod["cardBrand"]) => {
    switch (brand) {
      case "visa": return "bg-gradient-to-r from-blue-700 via-indigo-800 to-indigo-900"
      case "mastercard": return "bg-gradient-to-r from-stone-900 via-orange-950 to-orange-900"
      case "amex": return "bg-gradient-to-r from-teal-700 via-cyan-800 to-cyan-900"
      default: return "bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-900"
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t("payment_methods_title")}</h2>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-1.5 size-sm sm:size-default">
          <Plus className="h-4 w-4" /> {t("add_card_btn")}
        </Button>
      </div>

      {methods.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="font-semibold">{t("no_payment_saved")}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t("add_card_hint")}</p>
          <Button onClick={openAddModal}>{t("add_credit_card_btn")}</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {methods.map((method) => (
            <div
              key={method.id}
              className={`rounded-xl p-5 flex flex-col justify-between text-white relative h-48 overflow-hidden shadow-lg ${getCardGradient(method.cardBrand)}`}
            >
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
                <CreditCard className="h-44 w-44" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold capitalize tracking-wide">
                    {method.cardBrand === "generic" ? t("credit_card_label") : method.cardBrand}
                  </div>
                  {method.isDefault && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-transparent text-2xs px-2 py-0.5">
                      {t("default_badge")}
                    </Badge>
                  )}
                </div>
                <div className="mt-6">
                  <p className="text-lg tracking-widest font-mono font-medium">{method.cardNumber}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between">
                <div>
                  <span className="text-2xs opacity-60 uppercase block">{t("card_holder_label")}</span>
                  <span className="text-sm font-medium tracking-wide">{method.cardHolder}</span>
                </div>
                <div className="flex items-end gap-x-6">
                  <div>
                    <span className="text-2xs opacity-60 uppercase block">{t("expires_label")}</span>
                    <span className="text-sm font-medium tracking-wide">{method.expiryDate}</span>
                  </div>
                  <div className="flex gap-2">
                    {!method.isDefault ? (
                      <button onClick={() => handleSetDefault(method.id)} className="text-xs hover:underline text-white font-semibold" title="Set Default">
                        {t("set_default_btn")}
                      </button>
                    ) : (
                      <span className="text-xs text-white/80 flex items-center gap-1 font-semibold">
                        <Check className="h-3 w-3 text-green-400 fill-green-400" /> {t("default_badge")}
                      </span>
                    )}
                    <button onClick={() => handleDelete(method.id)} className="text-xs text-red-200 hover:text-red-400 font-semibold" title="Delete card">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PCI Security Badge */}
      <div className="mt-8 bg-muted/30 border border-border/50 rounded-lg p-4 flex gap-3 items-start">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold">{t("pci_dss_title")}</p>
          <p className="text-muted-foreground text-xs mt-1">{t("pci_dss_desc")}</p>
        </div>
      </div>

      {/* Add Card Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("add_payment_method_title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="holderName">{t("card_holder_name_label")}</Label>
              <Input id="holderName" value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} placeholder="JOHN DOE" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="cardNo">{t("card_number_label")}</Label>
              <div className="relative">
                <Input
                  id="cardNo" value={cardNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19)
                    setCardNumber(v)
                  }}
                  placeholder="4000 1234 5678 9010" required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="cardExpiry">{t("expiration_date_label")}</Label>
                <Input
                  id="cardExpiry" value={expiryDate}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "")
                    setExpiryDate(v.length <= 2 ? v : `${v.slice(0, 2)}/${v.slice(2, 4)}`)
                  }}
                  placeholder="MM/YY" maxLength={5} required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cardCvv">{t("cvv_code_label")}</Label>
                <Input id="cardCvv" type="password" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" maxLength={4} required />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input id="defaultPay" type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-border text-primary focus:ring-primary h-4 w-4" />
              <Label htmlFor="defaultPay" className="cursor-pointer font-medium text-sm">{t("set_default_payment")}</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>{t("cancel")}</Button>
              <Button type="submit">{t("save_card_btn")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
