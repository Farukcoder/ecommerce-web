"use client"

import { createContext, useContext, type ReactNode } from "react"
import { getProductImageSrc } from "@/lib/product-image"

const ProductImageContext = createContext<string | null>(null)

export function ProductImageProvider({
  defaultImageUrl,
  children,
}: {
  defaultImageUrl?: string | null
  children: ReactNode
}) {
  return (
    <ProductImageContext.Provider value={defaultImageUrl ?? null}>
      {children}
    </ProductImageContext.Provider>
  )
}

export function useProductDefaultImage() {
  return useContext(ProductImageContext)
}

export function useProductImageSrc(image?: string | null) {
  const defaultImage = useProductDefaultImage()
  return getProductImageSrc(image, defaultImage)
}
