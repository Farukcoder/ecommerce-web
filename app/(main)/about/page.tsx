"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  fetchSystemSettings,
  parseSettingArray,
  resolveSystemSettingUrl,
  type AboutTeamMember,
  type AboutValue,
} from "@/lib/system-settings"
import { useTranslation } from "@/lib/i18n"
import { useEffect, useState } from "react"

const defaultHeroImage =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&h=1080&fit=crop"

const defaultMissionImage =
  "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop"

const defaultValues: AboutValue[] = []

const defaultTeam: AboutTeamMember[] = [
  {
    name: "Sarah Chen",
    role: "Founder & CEO",
    image_url:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
  },
  {
    name: "Marcus Johnson",
    role: "Creative Director",
    image_url:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
  },
  {
    name: "Emily Rodriguez",
    role: "Head of Operations",
    image_url:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
  },
  {
    name: "David Park",
    role: "Lead Designer",
    image_url:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
  },
]

export default function AboutPage() {
  const { t } = useTranslation()
  const [settings, setSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const sett = await fetchSystemSettings().catch(() => null)
        setSettings(sett)
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">{t("loading")}</div>
  }

  const websiteName = settings?.frontend_website_name?.trim() || "DEMO"

  const heroImage =
    resolveSystemSettingUrl(settings?.flash_deal_page_banner_large_url ?? null) ??
    defaultHeroImage

  const heroHeading = settings?.about_hero_heading?.trim() || t("our_story")
  const heroDescription =
    settings?.about_hero_description?.trim() ||
    `Founded in 2020, ${websiteName} was born from a passion for quality craftsmanship and timeless design. We believe that exceptional products should be accessible to everyone.`

  const missionHeading = settings?.about_mission_heading?.trim() || t("our_mission")
  const missionDescription =
    settings?.about_mission_description?.trim() ||
    `At ${websiteName}, we are on a mission to redefine online shopping by curating collections that combine premium quality with modern aesthetics. We believe that the things you surround yourself with should inspire and elevate your everyday life. Every product in our collection is carefully selected for its craftsmanship, sustainability, and timeless appeal. We work directly with artisans and ethical manufacturers to ensure that each piece meets our exacting standards.`

  const missionImage =
    resolveSystemSettingUrl(settings?.about_mission_image_url ?? null) ??
    defaultMissionImage

  const missionButtonText =
    settings?.about_mission_button_text?.trim() || t("explore_collection")
  const missionButtonUrl = settings?.about_mission_button_url?.trim() || "/shop"

  const valuesHeading = settings?.about_values_heading?.trim() || t("our_values")
  const valuesSubheading =
    settings?.about_values_subheading?.trim() ||
    t("principles_guide_us")
  const values = parseSettingArray<AboutValue>(settings?.about_values)
  const displayValues = values.length > 0 ? values : [
    { title: t("quality_first"), description: t("quality_first_desc") },
    { title: t("sustainable_practice"), description: t("sustainable_practice_desc") },
    { title: t("customer_focus"), description: t("customer_focus_desc") },
    { title: t("innovation"), description: t("innovation_desc") },
  ]

  const teamHeading = settings?.about_team_heading?.trim() || t("meet_our_team")
  const teamSubheading =
    settings?.about_team_subheading?.trim() ||
    `The passionate people behind ${websiteName}`
  const teamMembers = parseSettingArray<AboutTeamMember>(settings?.about_team_members)
  const displayTeam = teamMembers.length > 0 ? teamMembers : defaultTeam

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={`About ${websiteName}`}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-white">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
              {heroHeading}
            </h1>
            <p className="mt-4 text-lg text-white/80 leading-relaxed">
              {heroDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight mb-6">
                {missionHeading}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6 whitespace-pre-line">
                {missionDescription}
              </p>
              <Button asChild>
                <Link href={missionButtonUrl}>
                  {missionButtonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative aspect-square rounded-lg overflow-hidden">
              <Image
                src={missionImage}
                alt={missionHeading}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">{valuesHeading}</h2>
            <p className="text-muted-foreground mt-2">{valuesSubheading}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayValues.map((value, index) => (
              <div key={index} className="bg-card rounded-lg p-6 border border-border">
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold mb-4">
                  {index + 1}
                </div>
                <h3 className="font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight">{teamHeading}</h2>
            <p className="text-muted-foreground mt-2">{teamSubheading}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayTeam.map((member) => {
              const memberImage =
                resolveSystemSettingUrl(member.image_url) ??
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"

              return (
                <div key={member.name} className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                    <Image
                      src={memberImage}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h3 className="font-semibold">{member.name}</h3>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-semibold">50K+</p>
              <p className="text-primary-foreground/70 mt-1">{t("happy_customers")}</p>
            </div>
            <div>
              <p className="text-4xl font-semibold">500+</p>
              <p className="text-primary-foreground/70 mt-1">{t("products_stat")}</p>
            </div>
            <div>
              <p className="text-4xl font-semibold">25+</p>
              <p className="text-primary-foreground/70 mt-1">{t("countries_stat")}</p>
            </div>
            <div>
              <p className="text-4xl font-semibold">4.9</p>
              <p className="text-primary-foreground/70 mt-1">{t("average_rating")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              {t("join_community", { name: websiteName })}
            </h2>
            <p className="text-muted-foreground mt-2 mb-8">
              {t("subscribe_newsletter_cta")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" asChild>
                <Link href="/shop">{t("shop")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">{t("contact_us")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
