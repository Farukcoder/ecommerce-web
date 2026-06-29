import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { StoreProvider } from "@/lib/store-context"
import { ProductImageProvider } from "@/lib/product-image-context"
import { fetchSystemSettings, resolveSystemSettingUrl } from "@/lib/system-settings"
import { CurrencyProvider } from "@/lib/currency"

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const settings = await fetchSystemSettings().catch(() => null)
  const productDefaultImageUrl = resolveSystemSettingUrl(
    settings?.product_default_image_url ?? null
  )

  return (
    <CurrencyProvider systemSettings={settings}>
      <StoreProvider>
        <ProductImageProvider defaultImageUrl={productDefaultImageUrl}>
          <div className="flex min-h-screen flex-col">
            <Navbar settings={settings} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ProductImageProvider>
      </StoreProvider>
    </CurrencyProvider>
  )
}
