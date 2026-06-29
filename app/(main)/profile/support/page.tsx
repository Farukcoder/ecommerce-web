"use client"

import { useEffect, useState } from "react"
import { LifeBuoy, Plus, MessageSquare, Send, Check, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { getCustomerAuth } from "@/lib/customer-auth"
import { fetchSupportTicketSubjects, submitSupportTicket, type SupportTicketSubject } from "@/lib/api"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface LocalSupportTicket {
  id: number
  ticketNumber: string
  subject: string
  orderNumber?: string
  message: string
  status: string
  createdAt: string
}

const DEFAULT_TICKETS: LocalSupportTicket[] = [
  { id: 1, ticketNumber: "TKT-88726", subject: "Delivery Delay", orderNumber: "ORD-99882", message: "My order has been processing for 5 days. Could you check the delivery status?", status: "resolved", createdAt: "May 28, 2026" },
]

export default function SupportPage() {
  const { t } = useTranslation()
  const [tickets, setTickets] = useState<LocalSupportTicket[]>([])
  const [subjects, setSubjects] = useState<SupportTicketSubject[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [subject, setSubject] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetchSupportTicketSubjects()
      .then((data) => { setSubjects(data); if (data.length > 0) setSubject(data[0].value) })
      .catch((err) => console.error("Failed to load subjects:", err))

    const stored = localStorage.getItem("customer_support_tickets")
    if (stored) {
      try { setTickets(JSON.parse(stored)) } catch { setTickets(DEFAULT_TICKETS) }
    } else {
      setTickets(DEFAULT_TICKETS)
      localStorage.setItem("customer_support_tickets", JSON.stringify(DEFAULT_TICKETS))
    }
    setIsLoading(false)
  }, [])

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    const auth = getCustomerAuth()
    if (!auth?.user) {
      toast.error("Authentication required", { description: "Please log in to submit a support ticket." })
      return
    }
    setIsSubmitting(true)
    try {
      const response = await submitSupportTicket({
        name: auth.user.name,
        email: auth.user.email,
        phone: localStorage.getItem("customer_phone") || undefined,
        subject,
        order_number: orderNumber || undefined,
        message,
      })
      const newTicket: LocalSupportTicket = {
        id: response.data.id,
        ticketNumber: response.data.ticket_number,
        subject: subjects.find((s) => s.value === subject)?.label || subject,
        orderNumber: orderNumber || undefined,
        message,
        status: response.data.status || "open",
        createdAt: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date()),
      }
      const updated = [newTicket, ...tickets]
      setTickets(updated)
      localStorage.setItem("customer_support_tickets", JSON.stringify(updated))
      setIsOpen(false)
      setMessage("")
      setOrderNumber("")
      toast.success("Support ticket created!", {
        description: `Ticket Number: ${response.data.ticket_number}`,
        icon: <Check className="h-4 w-4 text-green-500" />,
      })
    } catch (err) {
      toast.error("Failed to create ticket", { description: err instanceof Error ? err.message : "Something went wrong." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "resolved": case "closed": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      case "open": case "active": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">{t("support_center_title")}</h2>
        </div>
        <Button onClick={() => setIsOpen(true)} className="flex items-center gap-1.5 size-sm sm:size-default">
          <Plus className="h-4 w-4" /> {t("create_ticket_btn")}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4 py-8">
          {[1, 2].map((i) => <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-lg">{t("no_support_tickets")}</p>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{t("no_tickets_desc")}</p>
          <Button onClick={() => setIsOpen(true)}>{t("create_first_ticket_btn")}</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((tk) => (
            <div key={tk.id} className="border border-border/80 rounded-xl p-5 hover:border-border transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-sm text-primary">{tk.ticketNumber}</span>
                  <span className="text-xs text-muted-foreground">{tk.createdAt}</span>
                </div>
                <Badge className={getStatusColor(tk.status)} variant="secondary">
                  {tk.status.charAt(0).toUpperCase() + tk.status.slice(1)}
                </Badge>
              </div>
              <div className="space-y-1">
                <h4 className="font-semibold text-sm sm:text-base text-foreground">{tk.subject}</h4>
                {tk.orderNumber && (
                  <p className="text-xs text-muted-foreground font-medium">{t("order_number_label")} {tk.orderNumber}</p>
                )}
                <p className="text-sm text-muted-foreground/90 mt-2 line-clamp-2">{tk.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Support Ticket Modal Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t("open_support_ticket_title")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTicket} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticketSubject">{t("subject_reason_label")}</Label>
              {subjects.length > 0 ? (
                <select id="ticketSubject" value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required>
                  {subjects.map((subj) => <option key={subj.value} value={subj.value}>{subj.label}</option>)}
                </select>
              ) : (
                <Input id="ticketSubject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Delivery issue" required />
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tktOrderNo">{t("order_number_optional")}</Label>
              <Input id="tktOrderNo" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="e.g. ORD-12345" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tktMessage">{t("description_message_label")}</Label>
              <Textarea id="tktMessage" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("describe_issue_placeholder")} rows={5} required />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>{t("cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="gap-1.5">
                <Send className="h-3.5 w-3.5" /> {isSubmitting ? t("submitting_ticket") : t("send_ticket_btn")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
