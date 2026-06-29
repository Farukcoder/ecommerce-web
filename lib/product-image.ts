export const getProductImageSrc = (
  image?: string | null,
  defaultImage?: string | null
) => {
  const trimmedImage = image?.trim()

  if (trimmedImage && trimmedImage !== "null" && trimmedImage !== "undefined") {
    return trimmedImage
  }

  return defaultImage?.trim() || ""
}
