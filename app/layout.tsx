import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import { fetchSystemSettings, resolveSystemSettingUrl } from '@/lib/system-settings'
import './globals.css'

const geistSans = Geist({
  subsets: ["latin"],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: '--font-geist-mono',
})

const hindSiliguri = localFont({
  src: [
    {
      path: '../public/fonts/Hind_Siliguri/HindSiliguri-Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hind_Siliguri/HindSiliguri-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hind_Siliguri/HindSiliguri-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hind_Siliguri/HindSiliguri-SemiBold.ttf',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/Hind_Siliguri/HindSiliguri-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-hind-siliguri',
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSystemSettings().catch(() => null)
  const siteIcon = resolveSystemSettingUrl(settings?.site_icon ?? null) ?? '/icon.svg'
  const frontend_website_name = settings?.frontend_website_name?.trim() || 'DEMO'

  return {
    title: frontend_website_name,
    description: 'Discover curated collections of premium products. Shop the latest trends with free shipping and easy returns.',
    generator: 'v0.app',
    icons: {
      icon: siteIcon,
      apple: '/apple-icon.png',
    }
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const settings = await fetchSystemSettings().catch(() => null)
  const siteIcon = resolveSystemSettingUrl(settings?.site_icon ?? null) ?? '/icon.svg'

  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable}`}>
      <head>
        <link rel="icon" href={siteIcon} sizes="any" />
        <link rel="shortcut icon" href={siteIcon} />
      </head>
      <body className="font-sans antialiased min-h-screen">
        <Providers>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </Providers>
      </body>
    </html>
  )
}
