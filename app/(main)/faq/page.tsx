"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { faqKeys } from "@/lib/data"
import { useTranslation } from "@/lib/i18n"

export default function FAQPage() {
  const { t } = useTranslation()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold tracking-tight">
            {t('frequently_asked_questions')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('faq_desc')}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqKeys.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {t(faq.questionKey)}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t(faq.answerKey)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Still have questions */}
        <div className="mt-12 p-8 bg-muted rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">{t('still_have_questions')}</h2>
          <p className="text-muted-foreground mb-6">
            {t('customer_support_help')}
          </p>
          <Button asChild>
            <Link href="/contact">
              {t('contact_support')} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
