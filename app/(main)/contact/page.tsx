"use client"

import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { ContactForm } from "@/components/contact-form"
import { useTranslation } from "@/lib/i18n"
import { fetchSystemSettings } from "@/lib/system-settings"
import { useEffect, useState } from "react"

const iconMap = {
  "email": Mail,
  "phone": Phone,
  "map-pin": MapPin,
  "clock": Clock,
} as const

type IconKey = keyof typeof iconMap

interface ContactInfoItem {
  icon: IconKey
  title: string
  details: string[]
}

export default function ContactPage() {
  const { t } = useTranslation()
  const [contactInformation, setContactInformation] = useState<ContactInfoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await fetchSystemSettings().catch(() => null)
        const info: ContactInfoItem[] = 
          Array.isArray(settings?.contact_information) 
            ? (settings.contact_information as ContactInfoItem[]) 
            : []
        setContactInformation(info)
      } catch (error) {
        console.error("Failed to fetch contact information", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSettings()
  }, [])
    
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">{t('contact_us')}</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            {t('contact_us_desc')}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {!isLoading && contactInformation.map((item) => {
              const Icon = iconMap[item.icon] ?? Mail
              return (
                <div key={item.icon} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium">{item.title}</h3>
                    {item.details.map((detail, i) => (
                      <p key={i} className="text-sm text-muted-foreground">{detail}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  )
}